export const pluginA = `<?php
/**
 * Plugin Name: VortexPay Ingress (Site A)
 * Description: Intercepts WooCommerce checkout and routes to VortexPay Gateway.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'plugins_loaded', 'vortexpay_init_gateway_class' );
function vortexpay_init_gateway_class() {
    if ( ! class_exists( 'WC_Payment_Gateway' ) ) return;

    class WC_Gateway_Vortexpay_A extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'vortexpay_a';
            $this->icon = ''; 
            $this->has_fields = false;
            $this->method_title = 'VortexPay Secure';
            $this->method_description = 'Secure off-site payment routing.';

            $this->init_form_fields();
            $this->init_settings();

            $this->title = $this->get_option( 'title' );
            $this->description = $this->get_option( 'description' );
            $this->router_url = $this->get_option( 'router_url' );
            $this->api_key = $this->get_option( 'api_key' );

            add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
            add_action( 'woocommerce_api_vortexpay_callback', array( $this, 'webhook_handler' ) );
            
            // Listen for Origin changes to sync back to Router
            add_action( 'woocommerce_order_status_changed', array( $this, 'sync_origin_status_changed' ), 10, 4 );
        }

        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array(
                    'title'   => 'Enable/Disable',
                    'type'    => 'checkbox',
                    'label'   => 'Enable VortexPay',
                    'default' => 'yes'
                ),
                'title' => array(
                    'title'   => 'Title',
                    'type'    => 'text',
                    'default' => 'Credit Card (Secure)'
                ),
                'description' => array(
                    'title'   => 'Description',
                    'type'    => 'textarea',
                    'default' => 'Pay securely via our encrypted payment gateway.'
                ),
                'router_url' => array(
                    'title'   => 'Router URL',
                    'type'    => 'text',
                    'default' => 'VORTEXPAY_ROUTER_URL_PLACEHOLDER'
                ),
                'api_key' => array(
                    'title'   => 'API Key',
                    'type'    => 'password'
                )
            );
        }

        public function process_payment( $order_id ) {
            $order = wc_get_order( $order_id );
            
            // Intercept & Send to Router
            $payload = array(
                'api_key' => $this->api_key,
                'order_id' => $order->get_id(),
                'amount' => $order->get_total(),
                'currency' => $order->get_currency(),
                'return_url' => $this->get_return_url( $order ),
                'items' => array()
            );

            foreach ( $order->get_items() as $item_id => $item ) {
                $payload['items'][] = $item->get_name();
            }

            $response = wp_remote_post( rtrim($this->router_url, '/') . '/api/gateway/checkout', array(
                'body'    => wp_json_encode( $payload ),
                'headers' => array( 'Content-Type' => 'application/json' ),
                'timeout' => 15,
            ) );

            if ( is_wp_error( $response ) ) {
                wc_add_notice( 'Connection error.', 'error' );
                return;
            }

            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            
            if ( isset($body['success']) && $body['success'] && ! empty( $body['paymentUrl'] ) ) {
                $order->update_meta_data( '_vortexpay_sys_id', $body['sysOrderId'] );
                $order->save();
                return array(
                    'result'   => 'success',
                    'redirect' => $body['paymentUrl']
                );
            } else {
                wc_add_notice( 'Gateway error: ' . (isset($body['error']) ? $body['error'] : 'Unknown'), 'error' );
                return;
            }
        }

        public function webhook_handler() {
            $body = file_get_contents('php://input');
            $data = json_decode($body, true);

            if ( empty($data['sysOrderId']) || empty($data['order_id']) || empty($data['status']) ) {
                wp_die( 'Invalid payload', 'Error', 400 );
            }

            $order = wc_get_order( $data['order_id'] );
            if ( ! $order ) {
                wp_die( 'Order not found', 'Error', 404 );
            }

            $order->update_meta_data('_vortexpay_incoming_sync', 'yes');
            $order->save();

            if ( $data['status'] === 'paid' ) {
                $order->payment_complete( $data['sysOrderId'] );
                $order->add_order_note('VortexPay: Payment successful on target B site.');
            } elseif ( $data['status'] === 'failed' || $data['status'] === 'cancelled' ) {
                $order->update_status( 'cancelled', 'VortexPay: Payment failed/cancelled on target B site.' );
            } elseif ( $data['status'] === 'refunded' ) {
                 $order->update_status( 'refunded', 'VortexPay: Payment refunded on target B site.' );
            } elseif ( $data['status'] === 'on-hold' ) {
                 $order->update_status( 'on-hold', 'VortexPay: Payment on-hold on target B site.' );
            } elseif ( $data['status'] === 'pending' ) {
                 $order->update_status( 'pending', 'VortexPay: Payment pending on target B site.' );
            }
            
            $order->update_meta_data('_vortexpay_incoming_sync', 'no');
            $order->save();

            echo wp_json_encode(array('success' => true));
            exit;
        }

        public function sync_origin_status_changed($order_id, $old_status, $new_status, $order) {
             $syncable_statuses = array('refunded', 'cancelled', 'on-hold', 'pending', 'completed', 'processing', 'failed');
             if (!in_array($new_status, $syncable_statuses)) return;
             
             $status = $new_status;
             if ($new_status === 'processing' || $new_status === 'completed') {
                  $status = 'paid';
             }
             $this->send_origin_webhook($order_id, $status);
        }

        private function send_origin_webhook($order_id, $status) {
             $order = wc_get_order($order_id);
             $sys_id = $order->get_meta('_vortexpay_sys_id');
             if(empty($sys_id)) return;
             
             if ($order->get_meta('_vortexpay_incoming_sync') === 'yes') return;

             $router_url = $this->get_option('router_url');
             if(empty($router_url)) return;

             $payload = array(
                 'sysOrderId' => $sys_id,
                 'status' => $status,
                 'source' => 'woocommerce_admin'
             );

             wp_remote_post( rtrim($router_url, '/') . '/api/webhook/origin', array(
                'body'    => wp_json_encode( $payload ),
                'headers' => array( 'Content-Type' => 'application/json' ),
                'blocking' => false
            ));
        }
    }
}

add_filter( 'woocommerce_payment_gateways', 'add_vortexpay_gateway_class' );
function add_vortexpay_gateway_class( $gateways ) {
    $gateways[] = 'WC_Gateway_Vortexpay_A'; 
    return $gateways;
}
?>`;

export const pluginB = `<?php
/**
 * Plugin Name: VortexPay Egress Receiver (Site B)
 * Description: Intercepts routed sessions, generates mirrored orders and forwards actual payments back to router.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// 1. Create Options Page for Router URL
add_action('admin_menu', 'vortexpay_b_menu');
function vortexpay_b_menu() {
    add_options_page('VortexPay B Settings', 'VortexPay B Config', 'manage_options', 'vortexpay-b-config', 'vortexpay_b_settings_page');
}

function vortexpay_b_settings_page() {
    if (isset($_POST['vortexpay_router_url'])) {
        update_option('vortexpay_router_url', sanitize_text_field($_POST['vortexpay_router_url']));
        echo '<div class="updated"><p>Saved successfully.</p></div>';
    }
    $url = get_option('vortexpay_router_url', 'VORTEXPAY_ROUTER_URL_PLACEHOLDER');
    echo '<div class="wrap"><h1>Site B Settings</h1><form method="POST"><p>Enter your VortexPay Router API URL below to enable webhook callbacks.</p><label>Router URL: </label><input type="text" name="vortexpay_router_url" value="'.esc_attr($url).'" style="width:300px;" placeholder="https://your-app.run.app"/><br><br><input type="submit" class="button button-primary" value="Save"/></form></div>';
}

// 2. Intercept incoming requests to Site B (e.g., ?vortexpay_sys_id=X&amount=100)
// This will create a temporary cart and skip immediately to WC checkout
add_action('template_redirect', 'vortexpay_b_intercept');
function vortexpay_b_intercept() {
    if ( isset($_GET['vortexpay_sys_id']) && isset($_GET['amount']) ) {
        if (!class_exists('WooCommerce')) return;

        $sys_id = sanitize_text_field($_GET['vortexpay_sys_id']);
        $amount = floatval($_GET['amount']);

        // Clear existing cart to avoid mixing user's old items
        WC()->cart->empty_cart();

        // Create a programmatic order skipping the cart logic
        $order = wc_create_order();
        
        // Add a generic processing fee to match the routed amount
        $item = new WC_Order_Item_Fee();
        $item->set_name('Secure Payment Processing');
        $item->set_amount($amount);
        $item->set_total($amount);
        $order->add_item($item);
        
        $order->set_total($amount);
        $order->update_meta_data('_vortexpay_sys_id', $sys_id);
        if (isset($_GET['return_url'])) {
            $order->update_meta_data('_vortexpay_return_url', esc_url_raw(urldecode($_GET['return_url'])));
        }
        
        // Mark order as 'pending' so it can be paid
        $order->update_status('pending', 'Created via VortexPay Router.');
        $order->save();

        // Redirect to WooCommerce Pay for Order endpoint directly!
        $checkout_url = $order->get_checkout_payment_url();
        wp_redirect($checkout_url);
        exit;
    }
}

// 2.5 Inject Custom Professional UI for VortexPay Checkouts
add_action('wp_head', 'vortexpay_b_custom_checkout_ui', 999);
function vortexpay_b_custom_checkout_ui() {
    if ( function_exists('is_checkout_pay_page') && is_checkout_pay_page() ) {
        global $wp;
        $order_id = absint( $wp->query_vars['order-pay'] );
        $order = wc_get_order( $order_id );
        if ( $order && $order->get_meta('_vortexpay_sys_id') ) {
            ?>
            <style>
                /* Professional Checkout Overrides */
                html, body {
                    background-color: #f7f9fc !important;
                    height: 100%;
                    margin: 0;
                }
                header, footer, .sidebar, #sidebar, .site-header, .site-footer, .header, .footer, #header, #footer {
                    display: none !important;
                }
                .site, #page, #wrapper, .wrap, .container {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                }
                .woocommerce {
                    max-width: 450px !important;
                    margin: 8vh auto 40px auto !important;
                    background: #ffffff !important;
                    padding: 40px !important;
                    border-radius: 16px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08) !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
                }
                .woocommerce::before {
                    content: "Secure Checkout";
                    display: block;
                    text-align: center;
                    font-size: 22px;
                    font-weight: 700;
                    margin-bottom: 30px;
                    color: #111;
                }
                .woocommerce-NoticeGroup, .woocommerce-error, .woocommerce-message, .woocommerce-info {
                    margin-bottom: 24px !important;
                    border-radius: 8px !important;
                }
                ul.order_details {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin: 0 0 30px 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
                ul.order_details li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    text-transform: none !important;
                    color: #666;
                }
                ul.order_details li strong {
                    color: #111;
                    font-size: 16px;
                }
                #order_review_heading {
                    display: none !important;
                }
                table.shop_table {
                    border: none !important;
                    margin-bottom: 24px !important;
                }
                table.shop_table thead, table.shop_table tbody {
                    display: none !important;
                }
                table.shop_table tfoot th, table.shop_table tfoot td {
                    border-top: 1px solid #f0f0f0 !important;
                    border-bottom: none !important;
                    padding: 16px 0 !important;
                    background: transparent !important;
                    font-weight: 400 !important;
                }
                table.shop_table tfoot tr.order-total th, table.shop_table tfoot tr.order-total td {
                    font-size: 20px !important;
                    color: #111 !important;
                    font-weight: 700 !important;
                    border-top: 2px solid #eaeaea !important;
                }
                table.shop_table tfoot tr.order-total td strong {
                    font-weight: 700 !important;
                }
                #payment {
                    background: transparent !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                }
                #payment ul.payment_methods {
                    border-bottom: none !important;
                    padding: 0 0 24px 0 !important;
                }
                #payment ul.payment_methods li {
                    background: #fff;
                    border: 1px solid #eaeaea;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    padding: 16px;
                    transition: border-color 0.2s ease;
                }
                #payment ul.payment_methods li:hover {
                    border-color: #ccc;
                }
                #payment div.payment_box {
                    background-color: #f7f9fc !important;
                    color: #555 !important;
                    box-shadow: none !important;
                    border-radius: 6px !important;
                    margin-top: 12px !important;
                    padding: 16px !important;
                    font-size: 13.5px !important;
                    line-height: 1.5 !important;
                }
                #payment div.payment_box::before {
                    display: none !important;
                }
                .place-order {
                    padding: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    margin-top: 20px !important;
                }
                #place_order {
                    width: 100% !important;
                    padding: 18px !important;
                    background-color: #111 !important;
                    color: #fff !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    border-radius: 8px !important;
                    border: none !important;
                    transition: all 0.2s ease !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                }
                #place_order:hover {
                    background-color: #333 !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.15) !important;
                }
            </style>
            <?php
        }
    }
}

add_filter( 'woocommerce_get_return_url', 'vortexpay_b_return_url', 10, 2 );
function vortexpay_b_return_url( $return_url, $order ) {
    if ( $order ) {
        $custom_return = $order->get_meta( '_vortexpay_return_url' );
        if ( ! empty( $custom_return ) ) {
            return $custom_return;
        }
    }
    return $return_url;
}

// 3. Listen for order status changes and ping Router
add_action('woocommerce_order_status_changed', 'vortexpay_b_status_changed', 10, 4);
function vortexpay_b_status_changed($order_id, $old_status, $new_status, $order) {
    if ($old_status === $new_status) return;
    
    $status_map = array(
        'processing' => 'paid',
        'completed'  => 'paid',
        'failed'     => 'failed',
        'cancelled'  => 'cancelled',
        'refunded'   => 'refunded',
        'on-hold'    => 'on-hold',
        'pending'    => 'pending'
    );
    
    if (array_key_exists($new_status, $status_map)) {
        vortexpay_b_send_webhook($order_id, $status_map[$new_status]);
    }
}

function vortexpay_b_send_webhook($order_id, $status) {
    $order = wc_get_order($order_id);
    if (!$order) return;

    $sys_id = $order->get_meta('_vortexpay_sys_id');
    if (empty($sys_id)) return;

    // Skip sending webhook if this status was triggered by an incoming router sync
    if ($order->get_meta('_vortexpay_incoming_sync') === 'yes') return;

    $router_url = get_option('vortexpay_router_url');
    if (empty($router_url)) return;

    // Prevent duplicate webhook for the same status
    if ($order->get_meta('_vortexpay_synced_' . $status) === 'yes') return;

    $payload = array(
        'sysOrderId' => $sys_id,
        'status' => $status,
        'source' => 'b_site_webhook'
    );

    wp_remote_post( rtrim($router_url, '/') . '/api/webhook/gateway', array(
        'body'    => wp_json_encode( $payload ),
        'headers' => array( 'Content-Type' => 'application/json' ),
        'blocking' => false
    ));
    
    $order->update_meta_data('_vortexpay_synced_' . $status, 'yes');
    $order->save();
}

// 4. Listen for Router -> B site sync updates (e.g. A site cancelled/refunded)
add_action('woocommerce_api_vortexpay_b_callback', 'vortexpay_b_webhook_handler');
function vortexpay_b_webhook_handler() {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    if ( empty($data['sysOrderId']) || empty($data['status']) ) {
        wp_die( 'Invalid payload', 'Error', 400 );
    }

    $orders = wc_get_orders(array(
        'meta_key' => '_vortexpay_sys_id',
        'meta_value' => sanitize_text_field($data['sysOrderId']),
        'limit' => 1,
        'return' => 'objects'
    ));

    if ( empty($orders) ) {
        wp_die( 'Order not found for sysOrderId: ' . esc_html($data['sysOrderId']), 'Error', 404 );
    }
    
    $order = $orders[0];

    // Mark that we are applying an incoming sync so we don't bounce it back
    $order->update_meta_data('_vortexpay_incoming_sync', 'yes');
    $order->save();

    if ( $data['status'] === 'cancelled' ) {
        $order->update_status( 'cancelled', 'VortexPay: Order cancelled on Origin A site.' );
    } elseif ( $data['status'] === 'refunded' ) {
         $order->update_status( 'refunded', 'VortexPay: Order refunded on Origin A site.' );
    } elseif ( $data['status'] === 'on-hold' ) {
         $order->update_status( 'on-hold', 'VortexPay: Order on-hold on Origin A site.' );
    } elseif ( $data['status'] === 'paid' ) {
         $order->update_status( 'processing', 'VortexPay: Order paid on Origin A site.' );
    } elseif ( $data['status'] === 'pending' ) {
         $order->update_status( 'pending', 'VortexPay: Order pending on Origin A site.' );
    } elseif ( $data['status'] === 'failed' ) {
         $order->update_status( 'failed', 'VortexPay: Order failed on Origin A site.' );
    }

    // Reset flag after status update
    $order->update_meta_data('_vortexpay_incoming_sync', 'no');
    $order->save();

    echo wp_json_encode(array('success' => true));
    exit;
}
?>`;
