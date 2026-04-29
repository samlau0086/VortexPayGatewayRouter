import React, { useState } from 'react';
import { Network, Globe, Code2, ServerCog, ShoppingBag, TerminalSquare, BookOpen, ArrowLeft, MonitorPlay, Component } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Docs() {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [activeTab, setActiveTab] = useState('system');
  
  const translations = {
    zh: {
      back: '返回首页',
      title: '官方帮助与对接文档',
      subtitle: '全面了解系统使用方法与不同平台的无缝对接指南',
      
      navOverview: '系统概览',
      navTutorial: '后台管理教程',
      navIntegration: '集成与对接',
      
      system: '系统介绍',
      tutorial: '后台配置教程',
      saas: 'SaaS 开发者 (API)',
      shopify: 'Shopify',
      opencart: 'OpenCart',
      woo: 'WooCommerce',
      other: '其他通用架构',
      
      systemTitle: 'VortexPay 支付路由中心',
      systemDesc: 'VortexPay 是一套支持多种支付通道与电商业务端解耦的智能路由分发中心。它可以将来自不同 A 站 (Business Sites) 的订单流量，按照预设规则 (如权重分配、轮询等) 智能分发到对应的 B 站 (Payment Gateways) 接口进行收款，从而实现资金隔离、抗封禁与灵活扩容。',
      
      tutorialTitle: '后台管理使用教程',
      tutorialSteps: [
        { label: '步骤一：配置业务 A 站', code: '进入面板左侧 "业务 A 站 (A Sites)"\n点击 "新增 A 站"，填写业务站域名和名称\n系统会自动为该站点分配一个 API Key，请妥善保存该密钥，后续在插件或 API 请求时用于鉴权。' },
        { label: '步骤二：配置支付 B 站', code: '进入面板左侧 "支付 B 站 (B Sites)"\n点击 "新增 B 站"，填写支付渠道站或收款通道的网关地址\n可设置权重 (Weight)，权重越高，分配到的订单概率越大。' },
        { label: '步骤三：配置路由策略', code: '进入面板左侧 "网关设置 (Settings)"\n在策略引擎 (Routing Strategy) 中，选择分流模式：\n- Random (完全随机)\n- Round Robin (顺序轮询)\n- Weighted (权重模式)' },
        { label: '步骤四：查看订单及数据', code: '在 "订单记录 (Orders)" 随时查看所有 A 站汇总的订单及其被分发至的 B 站追踪路线。\n在 "数据监控 (Dashboard)" 查看整体收单转化率、资金吞吐量等核心指标。' }
      ],

      saasTitle: 'REST API 自建架构对接',
      saasDesc: '如果您是自建电商平台、SaaS 提供商，或使用 Node.js / PHP / Java / Go 等语言原生开发，您可以通过我们的 RESTful API 直接与系统交互，进行流量分发和状态回调。',
      saasEndpoint: '请求网关 API: POST /api/gateway/checkout',
      saasPayload: '请求参数:',
      saasReturn: '成功后路由中心返回包含跳转 URL 的 JSON，商户后端需将用户重定向至此 URL。',

      wooTitle: 'WordPress + WooCommerce 插件对接',
      wooDesc: '我们为 WooCommerce 提供了专有的免代码插件。无需技术开发，上传插件并在后台输入鉴权密钥，即可自动劫持原生支付流。',
      wooSteps: '1. 在系统后台生成 Site A 接口密钥。\n2. 下载 WooCommerce 专属网关插件 (.zip)。\n3. 登录 WordPress -> 插件 -> 安装插件 -> 上传并启用。\n4. 进入 WooCommerce 设置 -> 支付 -> 开启 VortexPay，填入 API Key 即可。',
      
      shopifyTitle: 'Shopify 对接指南',
      shopifyDesc: '由于 Shopify 限制了结账页面的彻底修改，我们将通过 HPP (Hosted Payment Page) 或 Shopify App 方式实现无缝劫持。',
      shopifySteps: '1. 在后台创建一个 Custom App 并获取 Access Token。\n2. 在其结账页面注入自动重定向 JS 脚本，劫持 "Pay Now" 按钮（适用于 Plus 客户）。\n3. 或者，可将其添加为 Offline Payment Method，在用户下单完的 Thank You 页面按钮跳转至路由中心处理真实扣款。',
      
      ocTitle: 'OpenCart 对接手册',
      ocDesc: 'OpenCart 的支付模块基于经典的 MVC 架构。我们提供了标准的 OCMOD 和完整支付模块安装包。',
      ocSteps: '1. 通过 Extension Installer 上传 `vortexpay_opencart.ocmod.zip`。\n2. 在 Extensions -> Payments 中找到 VortexPay Routing Gateway 并点击 Install。\n3. 点击 Edit 填入 API Key，并设置 Order Status 即可完成接入。',
      
      otherTitle: '其他主流 CMS 与通用架构',
      otherDesc: '像 Magento, PrestaShop, BigCommerce 这类系统，可通过我们的通用 Webhook 服务及通用 Payment Gateway 范本快速接入。',
      otherSteps: '对于此类平台，通常要求：\n1. 创建一个新的 Payment 插件。\n2. 构建提单数据并 POST 至我们的 `/api/gateway/checkout`。\n3. 将顾客浏览器重定向至返回的 `paymentUrl`。\n4. 在您的 CMS 中暴露一个 Webhook 接口用于接收成功/失败的异步通知。',
      
      webhook: 'Webhook 异步回调'
    },
    en: {
      back: 'Back to Home',
      title: 'Documentation & Help Center',
      subtitle: 'Comprehensive guide to mastering the system and integrating with any platform',
      
      navOverview: 'Overview',
      navTutorial: 'Dashboard Tutorial',
      navIntegration: 'Integrations',

      system: 'System Introduction',
      tutorial: 'Dashboard Config Guide',
      saas: 'SaaS Developers (API)',
      shopify: 'Shopify',
      opencart: 'OpenCart',
      woo: 'WooCommerce',
      other: 'Other Systems',
      
      systemTitle: 'VortexPay Routing Engine',
      systemDesc: 'VortexPay is an intelligent routing hub that decouples e-commerce frontends from backend payment channels. It intelligently routes traffic from various Business Sites (A Sites) to appropriate Payment Gateways (B Sites) using predefined rules like weighted distribution or round-robin, ensuring fund isolation, anti-ban resilience, and scalable architecture.',
      
      tutorialTitle: 'Dashboard Management Tutorial',
      tutorialSteps: [
        { label: 'Step 1: Configure A Sites', code: 'Go to "A Sites" on the left menu.\nClick "Add A Site" and enter your business platform domain.\nThe system allocates a unique API Key for it. Save it safely; you need it to authenticate plugin or API calls.' },
        { label: 'Step 2: Configure B Sites', code: 'Go to "B Sites" on the left menu.\nClick "Add B Site" and enter your destination payment gateway.\nYou can set a Weight. Higher weight means a higher chance of receiving transactions.' },
        { label: 'Step 3: Setup Routing Strategy', code: 'Go to "Settings" on the left menu.\nUnder "Routing Strategy", select your preferred mode:\n- Random\n- Round Robin\n- Weighted' },
        { label: 'Step 4: Monitor Orders & Analytics', code: 'Use the "Orders" page to view consolidated orders across all A sites and track which B site fulfilled them.\nUse the "Dashboard" for core metrics and success rates.' }
      ],

      saasTitle: 'REST API Custom Architecture',
      saasDesc: 'If you are building your own e-commerce platform, SaaS, or using native languages like Node.js, PHP, Java, Go, etc., you can interact directly with our RESTful API to manage traffic and callbacks.',
      saasEndpoint: 'Gateway API: POST /api/gateway/checkout',
      saasPayload: 'Payload Parameters:',
      saasReturn: 'On success, the router returns a JSON containing a redirect URL. Your backend should redirect the consumer to this URL.',

      wooTitle: 'WordPress + WooCommerce Integration',
      wooDesc: 'We provide a proprietary, no-code plugin for WooCommerce. Upload it, enter your API key, and it automatically intercepts native checkouts.',
      wooSteps: '1. Generate a Site A API key in your router dashboard.\n2. Download the WooCommerce Gateway Plugin (.zip).\n3. Go to WordPress -> Plugins -> Add New -> Upload & Activate.\n4. Go to WooCommerce Settings -> Payments -> Enable VortexPay and enter your API Key.',
      
      shopifyTitle: 'Shopify Integration Guide',
      shopifyDesc: 'Since Shopify restricts checkout modifications, we use Hosted Payment Pages (HPP) or custom Shopify Apps to intercept flow.',
      shopifySteps: '1. Create a Custom App in Shopify and grab the Access Token.\n2. Inject redirect scripts in the checkout process to hijack the "Pay Now" button (for Plus customers).\n3. Alternatively, add an Offline Payment Method, and use the Thank You page to redirect the user to the router for actual payment processing.',
      
      ocTitle: 'OpenCart Manual',
      ocDesc: 'OpenCart payment modules use a classic MVC architecture. We provide a standard OCMOD installer.',
      ocSteps: '1. Upload `vortexpay_opencart.ocmod.zip` via Extension Installer.\n2. Navigate to Extensions -> Payments, find VortexPay Routing Gateway and Install.\n3. Click Edit, enter your API Key, configure Order Status, and you are done.',
      
      otherTitle: 'Other CMS & Generic Frameworks',
      otherDesc: 'For systems like Magento, PrestaShop, BigCommerce, you can integrate rapidly via our Generic Webhook Service and template payloads.',
      otherSteps: 'For such platforms, the general flow is:\n1. Create a new Payment Method extension.\n2. Serialize order data and POST to our `/api/gateway/checkout`.\n3. Redirect customer browser to the returned `paymentUrl`.\n4. Expose a Webhook endpoint in your CMS to accept Async success/fail notifications.',
      
      webhook: 'Webhook Callbacks'
    }
  };

  const t = (key: string) => translations[lang][key as keyof typeof translations['en']] || key;

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#141414] py-4 px-6 md:px-10">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <a href="/" className="inline-flex items-center text-slate-500 hover:text-[#141414] transition-colors font-bold text-sm uppercase tracking-widest mr-4">
               <ArrowLeft className="w-4 h-4 mr-2" />
               {t('back')}
             </a>
             <div className="w-px h-6 bg-slate-200 hidden md:block" />
             <div className="items-center space-x-3 ml-4 bg-[#141414] text-white p-2 rotate-2 shadow-sm hidden md:flex">
                <BookOpen className="w-5 h-5" />
             </div>
             <h1 className="text-xl font-black uppercase tracking-tighter text-[#141414] hidden md:block">{t('title')}</h1>
          </div>
          <button 
             onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
             className="border-2 border-[#141414] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-colors"
          >
             <Globe className="w-4 h-4 inline-block mr-2" /> {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row py-8 px-6 md:px-10 gap-10">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
           <div className="sticky top-24 space-y-8">
             <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-[#141414] opacity-50 mb-4">{t('navOverview')}</h4>
               <ul className="space-y-2">
                 <li>
                   <button 
                     onClick={() => setActiveTab('system')} 
                     className={`w-full text-left px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'system' ? 'bg-[#141414] text-white' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-transparent'}`}
                   >
                     {t('system')}
                   </button>
                 </li>
                 <li>
                   <button 
                     onClick={() => setActiveTab('tutorial')} 
                     className={`w-full text-left px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'tutorial' ? 'bg-[#141414] text-white' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-transparent'}`}
                   >
                     {t('tutorial')}
                   </button>
                 </li>
               </ul>
             </div>

             <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-[#141414] opacity-50 mb-4">{t('navIntegration')}</h4>
               <ul className="space-y-2">
                 {[
                   { id: 'saas', icon: TerminalSquare, label: 'saas' },
                   { id: 'woo', icon: ShoppingBag, label: 'woo' },
                   { id: 'shopify', icon: Code2, label: 'shopify' },
                   { id: 'oc', icon: ServerCog, label: 'opencart' },
                   { id: 'other', icon: Network, label: 'other' }
                 ].map(item => (
                   <li key={item.id}>
                     <button 
                       onClick={() => setActiveTab(item.id)} 
                       className={`w-full text-left px-4 py-2 text-sm font-bold uppercase transition-colors flex items-center ${activeTab === item.id ? 'bg-[#141414] text-white' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
                     >
                       <item.icon className="w-4 h-4 mr-3 opacity-70" />
                       <span className="truncate">{t(item.label)}</span>
                     </button>
                   </li>
                 ))}
               </ul>
             </div>
           </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 max-w-4xl min-h-[70vh]">
          
          {activeTab === 'system' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('systemTitle')}</h2>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed">
                <p className="text-lg">{t('systemDesc')}</p>
                <div className="my-10 p-8 border-4 border-[#141414] bg-white text-center shadow-[8px_8px_0_0_#141414]">
                   <div className="flex items-center justify-center space-x-6">
                      <div className="text-center">
                         <MonitorPlay className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                         <span className="font-bold uppercase tracking-widest text-xs">Customer Site (A)</span>
                      </div>
                      <div className="flex-1 border-t-4 border-dashed border-slate-300 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141414] text-white px-4 py-2 font-bold uppercase text-xs">VortexPay Engine</div>
                      </div>
                      <div className="text-center">
                         <Component className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                         <span className="font-bold uppercase tracking-widest text-xs">Payment Gateway (B)</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-8">{t('tutorialTitle')}</h2>
              <div className="space-y-8">
                 {translations[lang].tutorialSteps.map((step, idx) => (
                   <Card key={idx} className="rounded-none border-2 border-[#141414] shadow-[4px_4px_0_0_#141414]">
                     <CardHeader className="border-b-2 border-[#141414] bg-slate-50 py-4">
                        <CardTitle className="font-black uppercase tracking-widest text-sm flex items-center">
                          <span className="bg-[#141414] text-white w-6 h-6 flex items-center justify-center rounded-full mr-3 text-xs">{idx + 1}</span>
                          {step.label}
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-0">
                       <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-6 bg-slate-100 text-slate-800 m-0">
                         {step.code}
                       </pre>
                     </CardContent>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'saas' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('saasTitle')}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{t('saasDesc')}</p>
              
              <div className="bg-[#141414] text-emerald-400 p-4 font-mono text-sm mb-6">
                {t('saasEndpoint')}
              </div>
              
              <div className="mb-6">
                <h4 className="font-bold uppercase tracking-widest text-xs mb-3 text-slate-500">{t('saasPayload')}</h4>
                <pre className="bg-slate-100 border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-4 font-mono text-sm text-slate-800 overflow-x-auto">
{`{
  "api_key": "sk_a_xxxxxxx",
  "order_id": "ORD-2026-9912",
  "amount": 199.99,
  "currency": "USD",
  "items": ["Product A", "Product B"],
  "webhook_url": "https://your.site/api/callback"
}`}
                </pre>
              </div>

              <p className="border-l-4 border-indigo-600 pl-4 text-slate-600 italic text-sm">{t('saasReturn')}</p>
            </div>
          )}

          {activeTab === 'woo' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('wooTitle')}</h2 >
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{t('wooDesc')}</p>
              <div className="bg-indigo-50 border-2 border-indigo-200 p-6 shadow-[4px_4px_0_0_#c7d2fe]">
                <pre className="whitespace-pre-wrap font-mono text-sm text-indigo-900 leading-8">
                  {t('wooSteps')}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'shopify' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('shopifyTitle')}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{t('shopifyDesc')}</p>
              <div className="bg-emerald-50 border-2 border-emerald-200 p-6 shadow-[4px_4px_0_0_#a7f3d0]">
                <pre className="whitespace-pre-wrap font-mono text-sm text-emerald-900 leading-8">
                  {t('shopifySteps')}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'oc' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('ocTitle')}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{t('ocDesc')}</p>
              <div className="bg-amber-50 border-2 border-amber-200 p-6 shadow-[4px_4px_0_0_#fde68a]">
                <pre className="whitespace-pre-wrap font-mono text-sm text-amber-900 leading-8">
                  {t('ocSteps')}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'other' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#141414] mb-6">{t('otherTitle')}</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">{t('otherDesc')}</p>
              
              <div className="bg-slate-100 border-2 border-slate-300 p-6 shadow-[4px_4px_0_0_#cbd5e1] mb-8">
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-8">
                  {t('otherSteps')}
                </pre>
              </div>
              
              <div>
                <h4 className="font-bold uppercase tracking-widest text-xs mb-3 text-slate-500">{t('webhook')}</h4>
                <p className="text-slate-600 text-sm mb-4">When a payment is successful, our router will POST the following JSON to your webhook URL:</p>
                <pre className="bg-[#141414] text-indigo-300 border-2 border-transparent p-4 font-mono text-sm overflow-x-auto shadow-[4px_4px_0_0_#818cf8]">
{`{
  "sysOrderId": "sys_txn_89asf723",
  "status": "paid",
  "source": "router_gateway"
}`}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
