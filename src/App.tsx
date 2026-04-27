/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ServerCog, Activity, ShieldCheck, CreditCard, ExternalLink, ArrowRightLeft, Radio, Network, Settings, Trash2, Plus,Globe, Code2, LogOut, Copy, Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pluginA, pluginB } from './lib/plugin-templates';
import JSZip from 'jszip';
import { apiFetch } from './lib/api';
import { AdminPanel } from './components/AdminPanel';
import { Toaster, toast } from 'sonner';

const translations: Record<'en'|'zh', Record<string, string>> = {
  en: {
    title: "VortexPay Router",
    subtitle: "A/B Polling & Core Isolation Gateway",
    sys_online: "SYSTEM ONLINE",
    node: "Node",
    global_matrix: "Global Matrix",
    route_sim: "Route Simulator",
    config: "Configuration",
    total_vol: "Total Volume",
    lifetime_routed: "LIFETIME ROUTED",
    ingress_sources: "Ingress Sources",
    sites: "SITES",
    active_a_domains: "ACTIVE A-DOMAINS",
    egress_gateways: "Egress Gateways",
    active_b_domains: "ACTIVE B-DOMAINS (POOLS)",
    ingress_matrix: "Ingress Matrix (Site A)",
    untrusted_origin: "Untrusted Origin",
    domain: "Domain",
    identifier: "Identifier",
    egress_b: "Egress Gateways (Site B)",
    trusted_terminus: "Trusted Terminus",
    state: "State",
    action: "Action",
    active: "ACTIVE",
    paused: "PAUSED",
    disable: "DISABLE",
    enable: "ENABLE",
    tx_feed: "Transaction Feed",
    sys_id: "Sys ID",
    ingress_a: "Ingress (A)",
    egress_b_col: "Egress (B)",
    value: "Value",
    no_tx: "NO TRANSACTIONS DETECTED.",
    source_ref: "SOURCE Ref:",
    bgateway_ref: "B-GATEWAY Ref:",
    paid: "PAID",
    pending: "PENDING",
    failed: "FAILED",
    sim_title: "Checkout Simulator",
    sim_desc: "Initiate a mock transaction from an untrusted Site A, and observe the system dynamically route to a trusted Site B.",
    select_origin: "Select Origin Target",
    initiate_flow: "INITIATE FLOW",
    route_est: "ROUTE ESTABLISHED",
    route_intercepted: "The inbound request has been intercepted and safely routed to an active Site B gateway.",
    payment_terminus: "Generated Payment Terminus",
    sim_webhook: "Simulate Gateway Webhook",
    resolve_paid: "Resolve as PAID",
    resolve_failed: "Resolve as FAILED",
    conf_a: "Configure Ingress (A Sites)",
    conf_domain_lbl: "Domain",
    conf_id_lbl: "Identifier Label",
    conf_api_override: "API Key Override (Optional)",
    add_a: "Add A Site",
    conf_b: "Configure Gateways (B Sites)",
    safe_domain: "Safe Domain",
    add_b: "Add B Site",
    routing_engine: "Routing Rule Engine",
    curr_strategy: "Current Forwarding Strategy",
    select_rule: "Select Rule",
    rand_dist: "Random Distribution",
    round_robin: "Strict Round-Robin",
    weighted: "Weighted Ratio (Sliding Window)",
    rand_desc: "Randomly selects an active B-site. Good for general unlinked traffic.",
    rr_desc: "Cycles through active B-sites in order sequentially. Best for keeping payment gateways equally warmed up and avoiding sudden volume spikes on a single account.",
    weighted_desc: "Distributes traffic based on custom weights set per gateway, utilizing a sliding window algorithm for precise traffic splitting (e.g. 30:70).",
    init_core: "INITIALIZING CORE ROOT...",
    lang: "中文",
    integration_tab: "API & Integration",
    site_a_docs: "Site A (Ingress) Integration",
    site_a_desc: "Your Site A WooCommerce plugin needs to intercept the checkout process and POST to this central router instead of a real gateway.",
    site_b_docs: "Site B (Egress) Integration",
    site_b_desc: "Site B requires a receiver module that accepts the incoming customer session, initiates a real payment, and forwards the webhook back to the router.",
    req_format: "Request Format",
    resp_format: "Response Format",
    webhook_format: "Webhook Format",
    sync_status: "A-Site Sync",
    sync_b_status: "B-Site Sync",
    synced: "SYNCED",
    syncing: "SYNCING...",
    pending_sync: "WAITING",
    sync_docs: "State Sync (Router -> Site A)",
    webhook_a_format: "A-Site Callback Payload",
    sync_desc: "After Site B receives the payment, the router will automatically push the order status back to Site A via a background Webhook to complete the loop.",
    webhook_origin: "Simulate Origin Webhook (Refund/Cancel)",
    resolve_refunded: "Resolve as REFUNDED",
    resolve_cancelled: "Resolve as CANCELLED",
    refunded: "REFUNDED",
    cancelled: "CANCELLED",
    download_plg: "Download Plugin (.zip)",
    change_pwd: "Change Password",
    old_pwd: "Old Password",
    new_pwd: "New Password",
    confirm_pwd: "Confirm New Password",
    update_pwd_btn: "Update Password",
    pwd_mismatch: "Passwords do not match",
    pwd_changed: "Password updated successfully"
  },
  zh: {
    title: "VortexPay 核心路由网关",
    subtitle: "A/B 轮询分发与资金隔离分流系统",
    sys_online: "系统在线运行中",
    node: "节点",
    global_matrix: "全局大盘数据",
    route_sim: "路由网关模拟器",
    config: "系统高级配置",
    total_vol: "累计分流总额",
    lifetime_routed: "历史订单总额 (USD)",
    ingress_sources: "接入站点 (A站)",
    sites: "个站点",
    active_a_domains: "当前活跃的业务域名",
    egress_gateways: "支付出口 (B站)",
    active_b_domains: "网关池中处于活跃状态额度",
    ingress_matrix: "业务站点矩阵与鉴权 (Site A)",
    untrusted_origin: "业务风险源",
    domain: "域名地址",
    identifier: "站点标识/备注",
    egress_b: "安全出口网关配置 (Site B)",
    trusted_terminus: "合规资金沉淀端",
    state: "运行状态",
    action: "操作指令",
    active: "活跃分流",
    paused: "风控暂停",
    disable: "停止解析",
    enable: "重新激活",
    tx_feed: "实时资金路由请求日志",
    sys_id: "网关主流水号",
    ingress_a: "请求来源 (A站)",
    egress_b_col: "资金落点 (B站)",
    value: "请求金额",
    no_tx: "暂无路由分发记录。",
    source_ref: "来源订单追踪号:",
    bgateway_ref: "下游网关单号:",
    paid: "支付成功",
    pending: "等待回调",
    failed: "已拒绝/失败",
    sim_title: "全链路资金路由模拟实验室",
    sim_desc: "此处用于测试：从无支付能力的业务站点（A站）发起付款请求，观察流量如何被劫持并动态下发给资金网关（B站）。",
    select_origin: "选择发起请求的「业务 A 站」",
    initiate_flow: "发起测试扣款",
    route_est: "安全信道建立成功",
    route_intercepted: "后门 API 已拦截到原生请求，现已构建安全链路并定向至活跃的结算目标（B 站）。",
    payment_terminus: "资金接收方安全收银台地址",
    sim_webhook: "模拟异步到账回调 (Mock Async Webhook)",
    resolve_paid: "推送 [支付成功] 状态",
    resolve_failed: "推送 [风控拒绝] 状态",
    conf_a: "管控 Ingress 业务端 (A 站)",
    conf_domain_lbl: "域名/网址",
    conf_id_lbl: "站点内部标识",
    conf_api_override: "指定鉴权 API Key (留空自动生成)",
    add_a: "新增 A 站应用",
    conf_b: "搭建 Egress 支付池 (B 站)",
    safe_domain: "安全着陆页域名",
    add_b: "新增 B 站网关",
    routing_engine: "路由负载均衡算法引擎",
    curr_strategy: "下发分拣策略",
    select_rule: "选择并发规则",
    rand_dist: "混沌随机分发 (Random)",
    round_robin: "严格顺延均摊 (Round-Robin)",
    weighted: "滑动窗口权重配比 (Weighted)",
    rand_desc: "纯随机分配给池中任何一个正常的 B 站。适合大流量、不在乎各站资金均衡的野蛮生长模式。",
    rr_desc: "按录入顺序进行均匀轮询。最完美的「防爆单」策略，确保所有的 Stripe/Paypal 等收款账户平摊业务流，减缓单点触达风控阈值的时间。",
    weighted_desc: "根据为每个网关配置的自定权重，采用滑动窗口算法进行精确的心跳分发，误差率极低（如 30:70 的资金引流分配）。",
    init_core: "正在自检微服务与核心数据链路...",
    lang: "EN",
    integration_tab: "API 接口与插件对接",
    site_a_docs: "A站 (业务端) 插件对接指南",
    site_a_desc: "在您的 A 站安装一款定制的 WooCommerce 支付插件。当用户下单时，插件会拦截支付并将订单信息 POST 到此路由中心的 API，而非直接调用 Stripe/Paypal。",
    site_b_docs: "B站 (支付端) 接送池对接指南",
    site_b_desc: "B站需要安装一个接收端插件（通常也是 WordPress），接收来自路由中心的跳转，唤起真实的付款页面。支付完成后，将 Webhook 异步推回路由中心。",
    req_format: "请求格式 (POST)",
    resp_format: "响应格式",
    webhook_format: "Webhook 异步通知",
    sync_status: "A站状态同步",
    sync_b_status: "B站状态同步",
    synced: "已成功回调",
    syncing: "正在回传...",
    pending_sync: "等待触发",
    sync_docs: "状态回传 (路由 -> A站)",
    webhook_a_format: "A站回调通知格式",
    sync_desc: "B站收到付款后，路由网关会在后台自动将最终订单状态（成功/失败）推送回 A 站的 WooCommerce 原生接口，完成闭环。",
    webhook_origin: "模拟源站状态变更 (退款/取消)",
    resolve_refunded: "推送 [已退款] 状态",
    resolve_cancelled: "推送 [已取消] 状态",
    refunded: "已退款",
    cancelled: "已关闭",
    download_plg: "下载插件包 (.zip)",
    change_pwd: "修改登录密码",
    old_pwd: "当前旧密码",
    new_pwd: "设置新密码",
    confirm_pwd: "确认新密码",
    update_pwd_btn: "立即更新密码",
    pwd_mismatch: "两次输入的新密码不一致",
    pwd_changed: "密码已成功修改"
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/intro" element={<LandingPage />} />
        <Route path="/admin" element={<VortexPayApp />} />
        {/* Redirect root to intro for sales focus */}
        <Route path="/" element={<Navigate to="/intro" replace />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/intro" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function VortexPayApp() {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const t = (key: string) => translations[lang][key] || key;

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'gateway' | 'admin'>('gateway');
  const [stats, setStats] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [sysOrder, setSysOrder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms state
  const [newASite, setNewASite] = useState({ name: '', domain: '', api_key: '' });
  const [newBSite, setNewBSite] = useState({ name: '', domain: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async () => {
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error(t('pwd_mismatch'));
      return;
    }
    setPwdLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword: pwdForm.old, newPassword: pwdForm.new })
      });
      toast.success(t('pwd_changed'));
      setPwdForm({ old: '', new: '', confirm: '' });
    } catch(e: any) {
      toast.error(e.message || e);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [qrCode, setQrCode] = useState('');
  const [setupOtpCode, setSetupOtpCode] = useState('');

  const setupOtp = async () => {
    try {
      const data = await apiFetch('/auth/setup-otp', { method: 'POST' });
      setQrCode(data.qrCode);
    } catch(e: any) { toast.error(e.message || e); }
  };

  const confirmOtp = async () => {
    try {
      await apiFetch('/auth/confirm-otp', {
        method: 'POST',
        body: JSON.stringify({ code: setupOtpCode })
      });
      toast.success('OTP Enabled Successfully!');
      setQrCode('');
      setSetupOtpCode('');
      // Force stats refresh
      const data = await apiFetch('/stats');
      setStats({...stats, tenantConfig: data.tenantConfig});
    } catch(e: any) { toast.error(e.message || e); }
  };

  const disableOtp = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;
    try {
      await apiFetch('/auth/disable-otp', { method: 'POST' });
      toast.success('OTP Disabled');
      const data = await apiFetch('/stats');
      setStats({...stats, tenantConfig: data.tenantConfig});
    } catch(e: any) { toast.error(e.message || e); }
  };

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const submitAuth = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
       if (authMode === 'forgot') {
          const data = await apiFetch('/auth/forgot-password', {
             method: 'POST',
             body: JSON.stringify({ email: emailInput })
          });
          toast.success(data.message);
          setAuthLoading(false);
          return;
       }

       if (authMode === 'reset') {
          const data = await apiFetch('/auth/reset-password', {
             method: 'POST',
             body: JSON.stringify({ token: resetToken, newPassword: passwordInput })
          });
          toast.success(data.message);
          setAuthMode('login');
          window.history.replaceState({}, document.title, "/admin");
          setAuthLoading(false);
          return;
       }

       if (authMode === 'otp') {
         const data = await apiFetch('/auth/verify-otp', {
           method: 'POST',
           body: JSON.stringify({ tempToken, code: otpInput })
         });
         localStorage.setItem('token', data.token);
         setUser(data.user);
         setIsAdmin(data.user.email === 'samlau0086@gmail.com');
         setAuthLoading(false);
         return;
       }

       const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
       const data = await apiFetch(endpoint, {
         method: 'POST',
         body: JSON.stringify({ email: emailInput, password: passwordInput })
       });

       if (data.requireOtp) {
         setTempToken(data.tempToken);
         setAuthMode('otp');
       } else {
         if (authMode === 'register') {
           toast.success('Registration successful! You are now being logged in.');
         }
         localStorage.setItem('token', data.token);
         setUser(data.user);
         setIsAdmin(data.user.email === 'samlau0086@gmail.com');
       }
    } catch(e: any) {
       toast.error(e.message || e);
    }
    setAuthLoading(false);
  };

  const logout = () => {
     localStorage.removeItem('token');
     setUser(null);
     setIsAdmin(false);
     setStats(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
       setResetToken(token);
       setAuthMode('reset');
    }

    if (localStorage.getItem('token')) {
       // Mock restore since token is valid 7 days
       const payload = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]));
       setUser({ uid: payload.uid, email: payload.email });
       setIsAdmin(payload.email === 'samlau0086@gmail.com');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }
    
    let isSubscribed = true;
    const fetchStats = async () => {
       try {
         const currentStats = await apiFetch('/stats');
         if (isSubscribed) {
           currentStats.summary = {
             totalRevenue: currentStats.orders.filter((o:any)=>o.status==='paid').reduce((s:number,o:any)=>s+(o.amount||0), 0),
             totalOrders: currentStats.orders.length,
             pending: currentStats.orders.filter((o:any)=>o.status==='pending').length
           };
           setStats(currentStats);
         }
       } catch(e: any) {
         console.error(e);
         // If tenant is missing (e.g. DB reset), logout to prevent constant error popups/logs
         if (e.message.includes('Tenant') || e.message.includes('Unauthorized') || e.message.includes('expire')) {
            logout();
         }
       }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => { isSubscribed = false; clearInterval(interval); };
  }, [user]);

  const toggleBSite = async (id: string) => {
    const site = stats.bSites.find((s:any) => s.id === id);
    if (!site) return;
    try {
      await apiFetch(`/bsites/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !site.active })
      });
    } catch(e) { console.error(e); }
  };

  const simulateACheckout = async (siteApiKey: string) => {
    setSimLoading(true);
    setPaymentUrl('');
    try {
      const res = await fetch('/api/gateway/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: siteApiKey,
          order_id: `wc_${Math.floor(Math.random() * 10000)}`,
          amount: 199.99,
          currency: 'USD',
          items: ['Gucci Bag Replica']
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentUrl(data.paymentUrl);
        setSysOrder(data.sysOrderId);
      } else {
        toast.error("Checkout Failed: " + data.error);
      }
    } catch(err) {
      console.error(err);
    }
    setSimLoading(false);
  };

  const simulateBWebhook = async (status: string) => {
    if(!sysOrder) return;
    try {
      await fetch('/api/webhook/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sysOrderId: sysOrder,
          status: status
        })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const simulateAWebhook = async (status: string) => {
    if(!sysOrder) return;
    try {
      await fetch('/api/webhook/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sysOrderId: sysOrder,
          status: status,
          source: 'woocommerce_admin'
        })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const downloadPlugin = async (filename: string, phpContent: string) => {
    const zip = new JSZip();
    const folderName = filename.replace('.zip', '');
    const folder = zip.folder(folderName);
    
    // Replace placeholder with actual location
    const finalizedContent = phpContent.replace(/VORTEXPAY_ROUTER_URL_PLACEHOLDER/g, window.location.origin);
    
    if(folder) folder.file(`${folderName}.php`, finalizedContent);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addASite = async () => {
    if(!newASite.name || !newASite.domain || !user) return;
    try {
      await apiFetch('/asites', {
        method: 'POST',
        body: JSON.stringify({
           id: 'site_' + Math.random().toString(36).substring(2),
           name: newASite.name,
           domain: newASite.domain,
           api_key: newASite.api_key || 'sk_a_' + Math.random().toString(36).substring(2)
        })
      });
      setNewASite({ name: '', domain: '', api_key: '' });
      toast.success('A Site added successfully');
    } catch (e: any) {
      toast.error(e.message || e);
    }
  };

  const deleteASite = async (id: string) => {
    try {
      await apiFetch(`/asites/${id}`, { method: 'DELETE' });
      toast.success('A Site deleted');
    } catch (e: any) {
      toast.error(e.message || e);
    }
  };

  const addBSite = async () => {
    if(!newBSite.name || !newBSite.domain || !user) return;
    try {
      await apiFetch('/bsites', {
        method: 'POST',
        body: JSON.stringify({
           id: 'site_' + Math.random().toString(36).substring(2),
           name: newBSite.name,
           domain: newBSite.domain
        })
      });
      setNewBSite({ name: '', domain: '' });
      toast.success('B Site added successfully');
    } catch (e: any) {
      toast.error(e.message || e);
    }
  };

  const deleteBSite = async (id: string) => {
    try {
      await apiFetch(`/bsites/${id}`, { method: 'DELETE' });
      toast.success('B Site deleted');
    } catch (e: any) {
      toast.error(e.message || e);
    }
  };

  const updateBSiteWeight = async (id: string, weight: number) => {
    try {
      await apiFetch(`/bsites/${id}`, { 
        method: 'PUT',
        body: JSON.stringify({ weight })
      });
      toast.success('Weight updated');
    } catch (e: any) {
      toast.error(e.message || e);
    }
  };

  const changePollingRule = async (rule: string) => {
    if (!user) return;
    await apiFetch(`/tenants/${user.uid}`, {
       method: 'PUT',
       body: JSON.stringify({ strategy: rule })
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="bg-white p-8 border-2 border-[#141414] shadow-[8px_8px_0_0_#141414] max-w-md w-full text-center">
           <div className="bg-[#141414] text-white w-16 h-16 flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg">
             <ServerCog className="w-10 h-10" />
           </div>
           <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[#141414]">VortexPay</h1>
           <p className="text-sm font-mono tracking-widest uppercase text-slate-500 font-bold mb-8">System Gateway</p>
           
            {authMode === 'otp' ? (
              <div className="space-y-4" onKeyDown={e => e.key === 'Enter' && submitAuth()}>
                 <p className="text-sm mb-4 font-bold">2FA Required: Enter your code</p>
                 <Input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="000000" className="mb-4 rounded-none border-2 border-[#141414] font-mono text-center h-12 text-2xl tracking-[0.5em]" maxLength={6} autoFocus />
                 <Button onClick={submitAuth} disabled={authLoading} className="w-full bg-[#141414] hover:bg-black rounded-none h-12 uppercase font-bold tracking-widest text-white mb-4">
                    {authLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
                 </Button>
                 <Button variant="ghost" onClick={() => setAuthMode('login')} className="w-full text-xs uppercase font-bold">Cancel</Button>
              </div>
           ) : authMode === 'reset' ? (
              <div className="space-y-1" onKeyDown={e => e.key === 'Enter' && submitAuth()}>
                  <p className="text-sm mb-4 font-bold text-center">Reset Your Password</p>
                  <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="New Password" className="mb-6 rounded-none border-2 border-[#141414] font-mono text-center h-12" autoFocus />
                  <Button onClick={submitAuth} disabled={authLoading} className="w-full bg-[#141414] hover:bg-black rounded-none h-12 uppercase font-bold tracking-widest text-white mb-4">
                    {authLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Update Password'}
                 </Button>
                 <Button variant="ghost" onClick={() => setAuthMode('login')} className="w-full text-xs uppercase font-bold">Back to login</Button>
              </div>
           ) : (
              <div className="space-y-1" onKeyDown={e => e.key === 'Enter' && submitAuth()}>
                 {authMode === 'forgot' ? (
                    <>
                       <p className="text-sm mb-4 text-center">Enter your email to receive a reset link</p>
                       <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="Email address" className="mb-4 rounded-none border-2 border-[#141414] font-mono text-center h-12" autoFocus />
                       <Button onClick={submitAuth} disabled={authLoading} className="w-full bg-[#141414] hover:bg-black rounded-none h-12 uppercase font-bold tracking-widest text-white mb-4">
                          {authLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                       </Button>
                       <Button variant="ghost" onClick={() => setAuthMode('login')} className="w-full text-xs uppercase font-bold">Back to login</Button>
                    </>
                 ) : (
                    <>
                       <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="Email address" className="mb-4 rounded-none border-2 border-[#141414] font-mono text-center h-12" />
                       <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Password" className="mb-2 rounded-none border-2 border-[#141414] font-mono text-center h-12" />
                       
                       <div className="flex justify-end mb-4">
                         <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] uppercase font-bold text-slate-400 hover:text-black tracking-widest">Forgot Password?</button>
                       </div>

                       <Button onClick={submitAuth} disabled={authLoading} className="w-full bg-[#141414] hover:bg-black rounded-none h-12 uppercase font-bold tracking-widest text-white mb-4">
                          {authLoading ? <Activity className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Log in' : 'Register')}
                       </Button>

                       <Button variant="ghost" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-xs uppercase font-bold text-slate-500 hover:text-black">
                          {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Log in"}
                       </Button>
                    </>
                 )}
              </div>
           )}
        </div>
      </div>
    );
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPanel onBack={() => setView('gateway')} />;
  }

  if (!stats) return <div className="min-h-screen bg-[#111111] flex items-center justify-center text-slate-400 font-mono text-sm">{t('init_core')}</div>;

  const tenantCfg = stats.tenantConfig || {};
  const isExpired = tenantCfg.expiresAt && new Date(tenantCfg.expiresAt).getTime() < Date.now();
  const isDisabled = tenantCfg.active === false;

  if (isDisabled || isExpired) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="bg-white p-8 border-2 border-[#141414] shadow-[8px_8px_0_0_#141414] max-w-md w-full text-center">
           <div className="bg-red-500 text-white w-16 h-16 flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg">
             <ShieldAlert className="w-10 h-10" />
           </div>
           <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[#141414]">Access Denied</h1>
           <p className="text-sm font-mono text-slate-600 mb-8 mt-4">
              {isDisabled ? 'Your account has been disabled.' : 'Your subscription has expired.'} <br/>
              Please contact the administrator to renew your service.
           </p>
           {isAdmin && (
             <Button onClick={() => setView('admin')} className="w-full bg-[#141414] hover:bg-black text-white rounded-none uppercase tracking-widest font-bold h-12 mb-4">
               Go To Admin Panel
             </Button>
           )}
           <Button variant="outline" onClick={logout} className="w-full rounded-none h-12 uppercase font-bold tracking-widest border-[#141414]">
              Logout
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#141414] font-sans p-6 selection:bg-[#141414] selection:text-white">
      <header className="max-w-7xl mx-auto mb-8 border-b-2 border-[#141414] pb-6 flex items-end justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-[#141414] text-white p-3 rotate-3 shadow-lg">
            <ServerCog className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1 text-[#141414]">{t('title')}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-slate-500 font-bold">{t('subtitle')}</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-4 flex-wrap justify-end">
          {isAdmin && (
            <Button variant="default" size="sm" onClick={() => setView('admin')} className="rounded-none font-bold bg-indigo-600 hover:bg-indigo-700 text-white uppercase text-[10px]">
               <ShieldCheck className="w-3 h-3 mr-2" /> SaaS Admin
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="rounded-none font-bold border-[#141414] uppercase text-[10px]">
             <Globe className="w-3 h-3 mr-2" /> {t('lang')}
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="rounded-none font-bold border-[#141414] uppercase text-[10px]">
             <LogOut className="w-3 h-3 mr-2" /> Logout
          </Button>
          <div className="hidden sm:block">
            <div className="flex items-center justify-end text-emerald-600 font-mono text-xs mb-1 font-bold">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> {t('sys_online')}
            </div>
            <div className="text-[10px] uppercase font-mono text-slate-400">{user.email}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-8 rounded-none border border-[#141414] bg-white p-0 h-auto flex flex-wrap">
            <TabsTrigger value="dashboard" className="rounded-none data-[state=active]:bg-[#141414] data-[state=active]:text-white uppercase font-bold text-xs py-3 px-6"><Activity className="w-4 h-4 mr-2" /> {t('global_matrix')}</TabsTrigger>
            <TabsTrigger value="simulation" className="rounded-none data-[state=active]:bg-[#141414] data-[state=active]:text-white uppercase font-bold text-xs py-3 px-6"><ArrowRightLeft className="w-4 h-4 mr-2" /> {t('route_sim')}</TabsTrigger>
            <TabsTrigger value="config" className="rounded-none data-[state=active]:bg-[#141414] data-[state=active]:text-white uppercase font-bold text-xs py-3 px-6"><Settings className="w-4 h-4 mr-2" /> {t('config')}</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none data-[state=active]:bg-[#141414] data-[state=active]:text-white uppercase font-bold text-xs py-3 px-6"><ShieldCheck className="w-4 h-4 mr-2" /> Security</TabsTrigger>
            <TabsTrigger value="integration" className="rounded-none data-[state=active]:bg-[#141414] data-[state=active]:text-white uppercase font-bold text-xs py-3 px-6"><Code2 className="w-4 h-4 mr-2" /> {t('integration_tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in duration-500">
            {/* KPI STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-t border-l border-[#141414]">
              <div className="bg-white p-6 border-r border-b border-[#141414] hover:bg-[#141414] hover:text-white transition-colors group cursor-default">
                <div className="font-serif italic text-xs uppercase opacity-70 mb-2 group-hover:opacity-100">Plan & Subscription</div>
                <div className="text-4xl font-mono tracking-tighter uppercase">{tenantCfg.plan || 'Free'}</div>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-50">
                  {tenantCfg.expiresAt ? `${(new Date(tenantCfg.expiresAt).getTime() - Date.now()) > 0 ? 'Expires' : 'Expired'} in ${Math.ceil((new Date(tenantCfg.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days` : 'Permanent Account'}
                </p>
              </div>
              <div className="bg-white p-6 border-r border-b border-[#141414] hover:bg-[#141414] hover:text-white transition-colors group cursor-default">
                <div className="font-serif italic text-xs uppercase opacity-70 mb-2 group-hover:opacity-100">{t('total_vol')}</div>
                <div className="text-4xl font-mono tracking-tighter">${stats.summary.totalRevenue.toFixed(2)}</div>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-50">{t('lifetime_routed')}</p>
              </div>
              <div className="bg-white p-6 border-r border-b border-[#141414] hover:bg-[#141414] hover:text-white transition-colors group cursor-default">
                <div className="font-serif italic text-xs uppercase opacity-70 mb-2 group-hover:opacity-100">{t('ingress_sources')}</div>
                <div className="text-4xl font-mono tracking-tighter">
                  {stats.aSites.length} 
                  <span className="text-lg opacity-40 ml-1">/ {stats.quotas?.aSites || 1}</span>
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-50">{t('active_a_domains')}</p>
              </div>
              <div className="bg-white p-6 border-r border-b border-[#141414] hover:bg-[#141414] hover:text-white transition-colors group cursor-default">
                <div className="font-serif italic text-xs uppercase opacity-70 mb-2 group-hover:opacity-100">{t('egress_gateways')}</div>
                <div className="text-4xl font-mono tracking-tighter">
                  {stats.bSites.filter((s:any)=>s.active).length} 
                  <span className="text-lg opacity-40 ml-1">/ {stats.quotas?.bSites || 2}</span>
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-50">{t('active_b_domains')}</p>
              </div>
            </div>

            {/* DOMAIN CONFIGURATION MULTI-GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SITE A */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-red-600 pb-2">
                  <h3 className="font-bold uppercase tracking-widest text-sm flex items-center text-red-600">
                    <Network className="w-4 h-4 mr-2" /> {t('ingress_matrix')}
                  </h3>
                  <Badge variant="outline" className="text-[10px] rounded-none border-red-600 text-red-600 uppercase font-mono">{t('untrusted_origin')}</Badge>
                </div>
                <div className="border border-[#141414] bg-white">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow className="border-[#141414]">
                        <TableHead className="font-serif italic text-xs uppercase text-[#141414]">{t('domain')}</TableHead>
                        <TableHead className="font-serif italic text-xs uppercase text-[#141414]">{t('identifier')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.aSites.map((site: any) => (
                        <TableRow key={site.id} className="border-[#141414] hover:bg-slate-50">
                          <TableCell className="font-mono text-sm">{site.domain}</TableCell>
                          <TableCell className="text-sm font-medium">{site.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* SITE B */}
              <div>
                 <div className="flex items-center justify-between mb-3 border-b-2 border-emerald-600 pb-2">
                  <h3 className="font-bold uppercase tracking-widest text-sm flex items-center text-emerald-600">
                    <ShieldCheck className="w-4 h-4 mr-2" /> {t('egress_b')}
                  </h3>
                  <Badge variant="outline" className="text-[10px] rounded-none border-emerald-600 text-emerald-600 uppercase font-mono">{t('trusted_terminus')}</Badge>
                </div>
                <div className="border border-[#141414] bg-white">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow className="border-[#141414]">
                        <TableHead className="font-serif italic text-xs uppercase text-[#141414]">{t('domain')}</TableHead>
                        <TableHead className="font-serif italic text-xs uppercase text-[#141414]">{t('state')}</TableHead>
                        <TableHead className="text-right font-serif italic text-xs uppercase text-[#141414]">{t('action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.bSites.map((site: any) => (
                        <TableRow key={site.id} className="border-[#141414] hover:bg-slate-50">
                          <TableCell className="font-mono text-sm">{site.domain}</TableCell>
                          <TableCell>
                            {site.active ? 
                              <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>{t('active')}</span> : 
                              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center"><span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>{t('paused')}</span>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => toggleBSite(site.id)} className="rounded-none border-[#141414] font-mono uppercase text-[10px] h-7">
                              {site.active ? t('disable') : t('enable')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* ORDER LOG */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold uppercase tracking-widest text-sm flex items-center">
                  {t('tx_feed')}
                </h3>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Search Order ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-none border-2 border-[#141414] font-mono text-xs h-9 bg-white"
                  />
                </div>
              </div>
              <div className="border border-[#141414] bg-white overflow-hidden shadow-[4px_4px_0_0_#141414]">
                <Table>
                  <TableHeader className="bg-[#141414]">
                    <TableRow className="hover:bg-[#141414]">
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('sys_id')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('ingress_a')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('egress_b_col')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10 text-right">{t('value')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('state')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('sync_status')}</TableHead>
                      <TableHead className="font-serif italic text-xs uppercase text-slate-300 h-10">{t('sync_b_status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center font-mono py-8 text-slate-400 text-xs">{t('no_tx')}</TableCell>
                      </TableRow>
                    )}
                    {stats.orders.filter((o: any) => 
                      !searchQuery || 
                      o.sysOrderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (o.aSiteOrderId && o.aSiteOrderId.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (o.bSiteOrderId && o.bSiteOrderId.toString().toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((o: any) => (
                      <TableRow key={o.sysOrderId} className="border-[#141414] group hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono text-xs text-slate-600 line-clamp-1">{o.sysOrderId}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{stats.aSites.find((a:any)=>a.id===o.aSiteId)?.domain || o.aSiteId}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{t('source_ref')} {o.aSiteOrderId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-emerald-700">{stats.bSites.find((b:any)=>b.id===o.bSiteId)?.domain || o.bSiteId}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{t('bgateway_ref')} {o.bSiteOrderId}</div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-right">${o.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {o.status === 'paid' && <Badge className="bg-[#141414] rounded-none hover:bg-[#141414] uppercase text-[10px] font-bold">{t('paid')}</Badge>}
                          {o.status === 'pending' && <Badge variant="outline" className="rounded-none border-[#141414] text-[#141414] uppercase text-[10px] font-bold border-dashed">{t('pending')}</Badge>}
                          {o.status === 'failed' && <Badge variant="destructive" className="rounded-none uppercase text-[10px] font-bold">{t('failed')}</Badge>}
                          {o.status === 'refunded' && <Badge variant="outline" className="rounded-none border-orange-600 text-orange-600 uppercase text-[10px] font-bold border-dashed">{t('refunded')}</Badge>}
                          {o.status === 'cancelled' && <Badge variant="outline" className="rounded-none border-slate-600 text-slate-600 uppercase text-[10px] font-bold border-dashed">{t('cancelled')}</Badge>}
                        </TableCell>
                        <TableCell>
                          {o.syncToAStatus === 'synced' && <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 rounded-none uppercase text-[10px] font-bold">{t('synced')}</Badge>}
                          {o.syncToAStatus === 'syncing' && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 animate-pulse rounded-none uppercase text-[10px] font-bold">{t('syncing')}</Badge>}
                          {o.syncToAStatus === 'pending' && <span className="text-[10px] font-mono text-slate-400 uppercase">{t('pending_sync')}</span>}
                        </TableCell>
                        <TableCell>
                          {o.syncToBStatus === 'synced' && <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 rounded-none uppercase text-[10px] font-bold">{t('synced')}</Badge>}
                          {o.syncToBStatus === 'syncing' && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 animate-pulse rounded-none uppercase text-[10px] font-bold">{t('syncing')}</Badge>}
                          {o.syncToBStatus === 'pending' && <span className="text-[10px] font-mono text-slate-400 uppercase">{t('pending_sync')}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto">
              <div className="border-2 border-[#141414] bg-white shadow-[8px_8px_0_0_#141414] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ArrowRightLeft className="w-64 h-64" />
                </div>
                
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Checkout Simulator</h2>
                <p className="text-sm font-serif italic text-slate-500 mb-8 max-w-md">Initiate a mock transaction from an untrusted Site A, and observe the system dynamically route to a trusted Site B.</p>
                
                {!paymentUrl ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold">1</div>
                      <h3 className="font-bold uppercase tracking-widest text-sm">Select Origin Target</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {stats.aSites.map((a: any) => (
                        <div key={a.id} className="border border-[#141414] p-4 cursor-pointer hover:bg-[#141414] hover:text-white transition-all group flex flex-col items-start" onClick={() => simulateACheckout(a.api_key)}>
                          <div className="font-bold uppercase tracking-wider mb-2">{a.name}</div>
                          <div className="font-mono text-xs opacity-60 mb-4">{a.domain}</div>
                          <div className="mt-auto">
                            <Button size="sm" variant="outline" disabled={simLoading} className="rounded-none font-mono text-[10px] border-current bg-transparent group-hover:text-[#141414] group-hover:bg-white w-full uppercase">
                              <ExternalLink className="w-3 h-3 mr-2" /> INITIATE FLOW
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                    <div className="p-6 bg-emerald-50 border-2 border-emerald-600">
                      <div className="font-black text-emerald-800 uppercase tracking-widest flex items-center mb-4 text-xl">
                        <ShieldCheck className="w-6 h-6 mr-3" /> ROUTE ESTABLISHED
                      </div>
                      <p className="font-serif italic text-emerald-800 mb-6">
                        The inbound request has been intercepted and safely routed to an active Site B gateway.
                      </p>
                      
                      <div className="font-mono text-[10px] text-slate-500 uppercase font-bold mb-1">Generated Payment Terminus</div>
                      <div className="p-4 bg-white border border-emerald-200 text-sm font-mono break-all text-slate-800 shadow-inner">
                        {paymentUrl}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                       <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold">2</div>
                        <h3 className="font-bold uppercase tracking-widest text-sm">{t('sim_webhook')}</h3>
                      </div>
                      <div className="flex flex-col xl:flex-row gap-4 mb-4">
                        <Button className="w-full xl:w-1/2 bg-[#141414] hover:bg-black rounded-none h-12 uppercase font-bold tracking-widest whitespace-normal h-auto py-3" onClick={() => simulateBWebhook('paid')}>
                           {t('resolve_paid')}
                        </Button>
                         <Button variant="outline" className="w-full xl:w-1/2 rounded-none h-12 uppercase font-bold tracking-widest border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 whitespace-normal h-auto py-3" onClick={() => simulateBWebhook('failed')}>
                           {t('resolve_failed')}
                        </Button>
                      </div>

                      <div className="flex items-center space-x-3 mb-6 mt-8">
                        <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold">3</div>
                        <h3 className="font-bold uppercase tracking-widest text-sm">{t('webhook_origin')}</h3>
                      </div>
                      <div className="flex flex-col xl:flex-row gap-4 mb-4">
                        <Button className="w-full xl:w-1/2 rounded-none h-12 uppercase font-bold tracking-widest border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-white whitespace-normal h-auto py-3" onClick={() => simulateAWebhook('refunded')}>
                           {t('resolve_refunded')}
                        </Button>
                         <Button variant="outline" className="w-full xl:w-1/2 rounded-none h-12 uppercase font-bold tracking-widest border-slate-600 text-slate-600 hover:bg-slate-50 hover:text-slate-700 whitespace-normal h-auto py-3" onClick={() => simulateAWebhook('cancelled')}>
                           {t('resolve_cancelled')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="config" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Site A Config */}
              <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414]">
                <div className="flex justify-between items-center border-b-2 border-red-600 pb-2 mb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center text-red-600">
                    <Network className="w-5 h-5 mr-3" /> {t('conf_a')}
                  </h2>
                  <div className="text-[10px] font-bold tracking-widest uppercase bg-red-100 text-red-800 px-2 py-1 flex items-center">
                    Quota: {stats.aSites.length} / {stats.quotas?.aSites || 1}
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t('conf_domain_lbl')}</label>
                     <Input placeholder="e.g. shoes-replica.com" className="rounded-none border-[#141414] font-mono text-sm" value={newASite.domain} onChange={e => setNewASite({...newASite, domain: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t('conf_id_lbl')}</label>
                     <Input placeholder="e.g. Shoes VIP" className="rounded-none border-[#141414]" value={newASite.name} onChange={e => setNewASite({...newASite, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t('conf_api_override')}</label>
                     <Input placeholder="Leave blank to auto-generate" className="rounded-none border-[#141414] font-mono text-xs" value={newASite.api_key} onChange={e => setNewASite({...newASite, api_key: e.target.value})} />
                  </div>
                  <Button 
                    onClick={addASite} 
                    disabled={stats.aSites.length >= (stats.quotas?.aSites || 1)}
                    className="w-full rounded-none bg-red-600 hover:bg-red-700 text-white uppercase font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                     <Plus className="w-4 h-4 mr-2" /> {stats.aSites.length >= (stats.quotas?.aSites || 1) ? 'QUOTA REACHED' : t('add_a')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {stats.aSites.map((a: any) => (
                    <div key={a.id} className="p-4 border border-slate-200 group hover:border-red-300">
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <div className="font-bold text-sm uppercase">{a.name}</div>
                           <div className="text-xs font-mono text-slate-500">{a.domain}</div>
                         </div>
                         <Button variant="ghost" size="icon" onClick={() => deleteASite(a.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none h-8 w-8">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                       <div>
                         <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">API Key</div>
                         <div className="flex items-center gap-2">
                           <input type="text" readOnly value={a.api_key} className="w-full text-xs font-mono bg-slate-50 px-2 py-1.5 outline-none border border-transparent focus:border-red-200 text-slate-600" />
                           <Button size="icon" variant="outline" className={`h-7 w-7 rounded-none shrink-0 border-slate-200 transition-colors ${copiedId === a.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`} onClick={() => handleCopy(a.id, a.api_key)}>
                             {copiedId === a.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                           </Button>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {/* Site B Config */}
                <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414]">
                  <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-2 mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center text-emerald-600">
                      <ShieldCheck className="w-5 h-5 mr-3" /> {t('conf_b')}
                    </h2>
                    <div className="text-[10px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-800 px-2 py-1 flex items-center">
                      Quota: {stats.bSites.length} / {stats.quotas?.bSites || 2}
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t('safe_domain')}</label>
                       <Input placeholder="e.g. clean-shop.com" className="rounded-none border-[#141414] font-mono text-sm" value={newBSite.domain} onChange={e => setNewBSite({...newBSite, domain: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">{t('conf_id_lbl')}</label>
                       <Input placeholder="e.g. Stripe Account 1" className="rounded-none border-[#141414]" value={newBSite.name} onChange={e => setNewBSite({...newBSite, name: e.target.value})} />
                    </div>
                    <Button 
                      onClick={addBSite} 
                      disabled={stats.bSites.length >= (stats.quotas?.bSites || 2)}
                      className="w-full rounded-none bg-emerald-600 hover:bg-emerald-700 text-white uppercase font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                       <Plus className="w-4 h-4 mr-2" /> {stats.bSites.length >= (stats.quotas?.bSites || 2) ? 'QUOTA REACHED' : t('add_b')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {stats.bSites.map((b: any) => (
                      <div key={b.id} className="p-3 border border-slate-200 flex flex-col group hover:border-emerald-300">
                         <div className="flex items-start justify-between">
                           <div>
                             <div className="font-bold text-sm uppercase flex items-center">
                                {b.name}
                                <Badge variant="outline" className="ml-2 py-0 px-1 text-[10px] h-4 rounded-sm">{b.active ? t('active') : t('paused')}</Badge>
                             </div>
                             <div className="text-xs font-mono text-slate-500">{b.domain}</div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => deleteBSite(b.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none h-8 w-8">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                         {stats.pollingConfig.rule === 'weighted' && (
                           <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Weight (1-100)</label>
                             <input 
                               type="number" 
                               min="1" 
                               max="100" 
                               defaultValue={b.weight || 1}
                               onBlur={(e) => updateBSiteWeight(b.id, parseInt(e.target.value))}
                               className="w-16 h-6 text-xs text-center border border-slate-300 focus:border-emerald-500 outline-none"
                             />
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routing Rules */}
                <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414]">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center border-b-2 border-[#141414] pb-2 text-[#141414]">
                    <ArrowRightLeft className="w-5 h-5 mr-3" /> {t('routing_engine')}
                  </h2>
                  <div className="space-y-4">
                     <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t('curr_strategy')}</label>
                       <Select value={stats.pollingConfig.rule} onValueChange={(val) => changePollingRule(val)}>
                         <SelectTrigger className="w-full rounded-none border-[#141414] h-12 uppercase font-black tracking-widest">
                           <SelectValue placeholder={t('select_rule')} />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-[#141414]">
                           <SelectItem value="random" className="uppercase font-bold cursor-pointer">{t('rand_dist')}</SelectItem>
                           <SelectItem value="round_robin" className="uppercase font-bold cursor-pointer">{t('round_robin')}</SelectItem>
                           <SelectItem value="weighted" className="uppercase font-bold cursor-pointer">{t('weighted')}</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <p className="text-xs font-serif italic text-slate-500">
                       <strong className="font-sans not-italic text-[#141414]">{t('rand_dist')}:</strong> {t('rand_desc')}<br/><br/>
                       <strong className="font-sans not-italic text-[#141414]">{t('round_robin')}:</strong> {t('rr_desc')}<br/><br/>
                       <strong className="font-sans not-italic text-[#141414]">{t('weighted')}:</strong> {t('weighted_desc')}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="animate-in fade-in duration-500">
             <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414] max-w-2xl">
                <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center border-b-2 border-slate-200 pb-2 text-[#141414]">
                  <ShieldAlert className="w-5 h-5 mr-3" /> Security Settings
                </h2>

                {tenantCfg.otpEnabled ? (
                   <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-sm">
                         Two-Factor Authentication (OTP) is currently <strong className="font-bold uppercase tracking-widest text-emerald-900">Enabled</strong>.
                      </div>
                      <Button onClick={disableOtp} variant="destructive" className="rounded-none uppercase font-bold tracking-widest h-12 px-6">
                         Disable 2FA
                      </Button>
                   </div>
                ) : (
                   <div className="space-y-6">
                      <div className="p-4 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-sm leading-relaxed">
                         Two-Factor Authentication adds an extra layer of security to your account. We recommend using a TOTP app like Google Authenticator or Authy.
                      </div>
                      
                      {!qrCode ? (
                         <Button onClick={setupOtp} className="bg-[#141414] hover:bg-black text-white rounded-none uppercase tracking-widest font-bold h-12 px-6">
                           Enable 2FA
                         </Button>
                      ) : (
                         <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col sm:flex-row gap-6">
                               <img src={qrCode} alt="OTP QR Code" className="w-[180px] h-[180px] border-2 border-[#141414] shadow-[4px_4px_0_0_#141414]" />
                               <div>
                                  <h3 className="font-bold uppercase tracking-widest text-[#141414] mb-2 text-sm">1. Scan QR Code</h3>
                                  <p className="text-sm font-serif italic text-slate-500 mb-4">Open your authenticator app and scan the barcode on the left.</p>
                                  <h3 className="font-bold uppercase tracking-widest text-[#141414] mb-2 text-sm">2. Enter OTP Code</h3>
                                  <div className="flex gap-2 isolate">
                                     <Input value={setupOtpCode} onChange={e => setSetupOtpCode(e.target.value)} placeholder="000000" className="w-32 rounded-none border-2 border-[#141414] font-mono h-12 text-center text-xl tracking-widest" maxLength={6} />
                                     <Button onClick={confirmOtp} className="h-12 border-2 border-[#141414] rounded-none uppercase tracking-widest font-bold bg-[#141414] text-white hover:bg-white hover:text-black hover:border-black transition-colors w-32">
                                        Verify
                                     </Button>
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                )}
             </div>

             {/* Password Change Section */}
              <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414] max-w-2xl mt-8">
                 <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center border-b-2 border-slate-200 pb-2 text-[#141414]">
                   <Settings className="w-5 h-5 mr-3" /> {t('change_pwd')}
                 </h2>
                 
                 <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t('old_pwd')}</label>
                      <Input type="password" value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} className="rounded-none border-2 border-[#141414] h-11" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t('new_pwd')}</label>
                      <Input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="rounded-none border-2 border-[#141414] h-11" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{t('confirm_pwd')}</label>
                      <Input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="rounded-none border-2 border-[#141414] h-11" />
                    </div>
                    
                    <Button onClick={handleChangePassword} disabled={pwdLoading} className="bg-[#141414] hover:bg-black text-white rounded-none uppercase tracking-widest font-bold h-12 px-6 w-full sm:w-auto">
                        {pwdLoading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : null}
                        {t('update_pwd_btn')}
                    </Button>
                 </div>
              </div>
          </TabsContent>

          <TabsContent value="integration" className="animate-in fade-in duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Site A Integration */}
               <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414]">
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center">
                     <Network className="w-5 h-5 mr-3" /> {t('site_a_docs')}
                   </h2>
                   <Button onClick={() => downloadPlugin('vortexpay-ingress-a.zip', pluginA)} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 rounded-none h-8 text-[10px] uppercase font-bold tracking-widest px-3">
                     {t('download_plg')}
                   </Button>
                 </div>
                 <p className="text-sm font-serif italic text-slate-500 mb-6 pb-4 border-b border-slate-200">
                   {t('site_a_desc')}
                 </p>

                 <div className="space-y-6">
                   <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('req_format')} (<span className="text-[#141414]">/api/gateway/checkout</span>)</h3>
                     <pre className="bg-[#141414] text-emerald-400 p-4 font-mono text-[10px] sm:text-xs overflow-x-auto shadow-inner rounded-none mb-4">
{`{
  "api_key": "YOUR_A_SITE_KEY",
  "order_id": "wc_1029",
  "amount": 199.99,
  "currency": "USD",
  "items": ["Product Name"]
}`}
                     </pre>
                     
                     <div className="p-4 bg-slate-50 border-l-4 border-red-600 mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-2">How Does Routing Work Without a User ID?</h4>
                        <p className="text-xs font-sans text-slate-600 leading-relaxed">
                          When your A Site sends a checkout request, it includes its unique <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 text-[#141414] rounded-sm">api_key</code>. The router securely looks up which owner/tenant this A Site belongs to and automatically applies that specific user's load-balancing and routing rules. <br/><br/>No user identifier is needed in the API payload, which keeps your requests simpler and your core identity secure.
                        </p>
                     </div>
                   </div>
                   <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('resp_format')}</h3>
                     <pre className="bg-[#141414] text-emerald-400 p-4 font-mono text-[10px] sm:text-xs overflow-x-auto shadow-inner rounded-none">
{`{
  "success": true,
  "paymentUrl": "https://b-site.com/checkout?ref=sys_abc123",
  "sysOrderId": "sys_abc123"
}`}
                     </pre>
                     <p className="text-xs text-slate-500 mt-2 italic font-serif">Plugin should redirect user -&gt; paymentUrl</p>
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('sync_docs')}</h3>
                     <p className="text-xs text-slate-500 mb-3 italic font-serif">{t('sync_desc')}</p>
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t('webhook_a_format')} (<span className="text-slate-600 bg-slate-100 px-1 py-0.5">POST /wc-api/vortexpay_callback</span>)</h3>
                     <pre className="bg-slate-50 text-slate-800 border border-slate-200 p-4 font-mono text-[10px] sm:text-xs overflow-x-auto rounded-none">
{`{
  "order_id": "wc_1029",
  "sysOrderId": "sys_abc123",
  "status": "paid",      // "paid" or "failed"
  "currency": "USD",
  "amount": 199.99
}`}
                     </pre>
                   </div>
                 </div>
               </div>

               {/* Site B Integration */}
               <div className="border-2 border-[#141414] bg-white p-6 shadow-[6px_6px_0_0_#141414]">
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600 flex items-center">
                     <ShieldCheck className="w-5 h-5 mr-3" /> {t('site_b_docs')}
                   </h2>
                   <Button onClick={() => downloadPlugin('vortexpay-egress-b.zip', pluginB)} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-none h-8 text-[10px] uppercase font-bold tracking-widest px-3">
                     {t('download_plg')}
                   </Button>
                 </div>
                 <p className="text-sm font-serif italic text-slate-500 mb-6 pb-4 border-b border-slate-200">
                   {t('site_b_desc')}
                 </p>

                 <div className="space-y-6">
                   <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('webhook_format')} (<span className="text-[#141414]">/api/webhook/gateway</span>)</h3>
                     <pre className="bg-[#141414] text-emerald-400 p-4 font-mono text-[10px] sm:text-xs overflow-x-auto shadow-inner rounded-none">
{`{
  "sysOrderId": "sys_abc123",
  "status": "paid", // or "failed"
}`}
                     </pre>
                     <p className="text-xs text-slate-500 mt-2 italic font-serif">When received, the router will update its internal DB and ping Site A to mark the WooCommerce order as processing.</p>
                   </div>
                 </div>
               </div>

             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

