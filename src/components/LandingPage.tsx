import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  Network,
  CreditCard,
  Lock,
  Languages,
  Cpu,
  Layers,
  HelpCircle,
  MessageSquare,
  Activity,
  History,
  ShoppingCart,
  MonitorPlay,
  Repeat,
  PackageOpen
} from 'lucide-react';
import { motion } from 'motion/react';

const translations = {
  zh: {
    navFeatures: '功能特性',
    navSolutions: '解决方案',
    navPricing: '价格方案',
    login: '登录',
    getStarted: '立即开始',
    heroBadge: '下一代支付分流专家',
    heroTitle: '全自动 A/B 轮询',
    heroTitleHighlight: '资金隔离分发',
    heroTitleSystem: '系统',
    heroSub: '为高频业务设计的路由网关。通过多维度轮询算法分摊风险压力，内置核心隔离隔离层，确保每一笔交易都安全、可控、透明。',
    heroBtnDeploy: '免费部署测试',
    heroBtnDemo: '查看演示视频',
    featuresTitle: '专为复杂业务环境打造',
    featuresSub: '集成多种核心能力，助您在全球业务中保持稳定与安全',
    routingTitle: '多级智能路由',
    routingDesc: '内置四种负载均衡算法，可根据站点权重、当前各网关水位线实时分发请求，彻底告警「单点爆破」风险。',
    isolationTitle: '银行级核心隔离',
    isolationDesc: '独创的 A/B 隔离架构。业务端无需对接支付 API，通过 VortexPay 路由层实现完全解耦，保护您的资金结算端隐私。',
    dashboardTitle: '全链路实时大盘',
    dashboardDesc: '毫秒级更新的资金流向视图。完美支持跨币种汇总分析，让您对全球各业务线的进出账情况了如指掌。',
    solutionsTitle: '简单三步，',
    solutionsTitleSub: '构建您的私有支付网关池',
    step1Title: '部署 VortexPay 路由内核',
    step1Desc: '通过一键脚本或 Docker 部署至您的私有服务器，拥有完全的控制权。',
    step2Title: '接入业务 A 站 & 支付 B 站',
    step2Desc: '安装我们提供的专有插件，秒级同步站点状态与 API 鉴权。',
    step3Title: '开启自动化风控轮询',
    step3Desc: '配置分流权重，系统将根据您的规则自动调配流量，确保持续盈利。',
    pricingTitle: '针对不同规模的定价',
    pricingSub: '支持独立服务器授权及 SaaS 订阅模式',
    freeTrial: '免费计划 / Free Trial',
    starter: '入门版 / Starter',
    professional: '企业版 / Professional',
    sourcePack: '源码授权 / Source Pack',
    mo: '/ 月',
    once: '/ 一次性',
    freeFeatures: ['免费试用时长全功能7天', '限制最高 1 个 A 站接入', '基础轮询策略', '标准接入文档支持'],
    starterFeatures: ['支持最多 5 个 A 站接入', '无限 B 站网关数量', '基础轮询策略', '专属技术支持'],
    proFeatures: ['支持最多 25 个 A 站接入', '无限 B 站网关数量', '高级 Round-Robin 算法', '7*24 小时专属技术响应'],
    sourceFeatures: ['100% 完整源代码', '私有化二次开发权', '去中心化无限节点部署', '终身技术指导'],
    mostPopular: '最受欢迎 🔥',
    coreRecommend: '核心推荐',
    contactManager: '联系客服经理',
    statsTitle: '深受全球 2,000+ 企业信赖',
    stat1Label: '日均处理交易',
    stat1Value: '500k+',
    stat2Label: '系统结算成功率',
    stat2Value: '99.98%',
    stat3Label: '全球节点覆盖',
    stat3Value: '18',
    archTitle: '底层架构级的双重防护',
    archSub: '我们不只是做分流，我们重新定义了支付安全边界',
    archPoint1Title: '请求伪装层',
    archPoint1Desc: '自动剥离业务端敏感信息，通过动态指纹模拟真实交易环境。',
    archPoint2Title: '分布式结算核验',
    archPoint2Desc: '每一笔资金变动都经过 3 个独立节点共识核验，确保账目永远准确。',
    faqTitle: '常见问题解答',
    faqQ1: 'VortexPay 是否需要安装在我的服务器上？',
    faqA1: '是的，我们支持私有化部署。您可以选择使用我们的 SaaS 版本，也可以购买源码部署在您自己的独立服务器上，以获得最高级别的数据安全性。',
    faqQ2: '如何保证分流的比例是准确的？',
    faqA2: '内置的调度器采用滑动窗口算法，能够根据您设置的权重比例（如 30:70）进行精确的心跳分发，误差率控制在 0.1% 以内。',
    faqQ3: '如果 B 站网关响应慢会发生什么？',
    faqA3: '系统会自动检测网关延迟及健康状态。一旦响应时间超过阈值，该节点将被自动降级或移出轮询池，直到恢复正常。',
    industriesTitle: '无缝接入多种高潜力行业',
    industriesSub: '从独立站到虚拟物品，我们为您提供最坚实的支付路由保障',
    indEcom: '跨境独立站 / 特货',
    indEcomDesc: '支持各类全球化电商、特货及敏感商品站群模式。',
    indDigital: '数字虚拟产品',
    indDigitalDesc: '软件授权、游戏充值、加密货币等无物流发货业务。',
    indSub: '内容订阅服务',
    indSubDesc: '视频平台、创作者赞助、付费社群会员等高频复购场景。',
    indDrop: 'Dropshipping',
    indDropDesc: '灵活应对发货周期长、客诉率波动大的直发货模式。',
    ctaTitle: '准备好升级您的支付基建了吗？',
    ctaSub: '立即加入 VortexPay，体验前所未有的稳定与自由。',
    ctaBtn: '开始免费试用',
    footerTerms: '使用协议',
    footerPrivacy: '隐私政策',
    footerContact: '联系我们',
    syncSuccess: '同步成功'
  },
  en: {
    navFeatures: 'Features',
    navSolutions: 'Solutions',
    navPricing: 'Pricing',
    login: 'Login',
    getStarted: 'Get Started',
    heroBadge: 'Next-Gen Payment Routing Expert',
    heroTitle: 'Automated A/B Polling',
    heroTitleHighlight: 'Fund Isolation',
    heroTitleSystem: 'System',
    heroSub: 'Routing gateway designed for high-frequency business. Share risk pressure through multi-dimensional polling algorithms, built-in core isolation layer to ensure every transaction is safe, controllable, and transparent.',
    heroBtnDeploy: 'Free Deployment Test',
    heroBtnDemo: 'Watch Demo',
    featuresTitle: 'Built for Complex Environments',
    featuresSub: 'Integrated core capabilities to keep your global business stable and secure',
    routingTitle: 'Multi-level Smart Routing',
    routingDesc: 'Built-in four load balancing algorithms, real-time distribution based on site weight and gateway levels, eliminating "single point" risks.',
    isolationTitle: 'Bank-grade Isolation',
    isolationDesc: 'Original A/B isolation architecture. No direct payment API integration needed for business sites, fully decoupled via VortexPay routing layer.',
    dashboardTitle: 'Real-time Analytics',
    dashboardDesc: 'Millisecond-level fund flow updates. Perfect multi-currency analysis support, keeping you informed about all global business lines.',
    solutionsTitle: 'Three Simple Steps,',
    solutionsTitleSub: 'Build Your Private Payment Pool',
    step1Title: 'Deploy VortexPay Core',
    step1Desc: 'Deploy to your private server via one-click script or Docker with full control.',
    step2Title: 'Connect Business & Payment Sites',
    step2Desc: 'Install our proprietary plugins to sync site status and API authentication in seconds.',
    step3Title: 'Start Automated Routing',
    step3Desc: 'Configure weights and rules; the system automatically allocates traffic to ensure continuous profit.',
    pricingTitle: 'Pricing for Every Scale',
    pricingSub: 'Supports standalone server licensing and SaaS subscription models',
    freeTrial: 'Free Trial',
    starter: 'Starter Plan',
    professional: 'Professional Plan',
    sourcePack: 'Source Code License',
    mo: '/ mo',
    once: '/ once',
    freeFeatures: ['7-Day Full Feature Trial', 'Limited to 1 Business Site', 'Basic Polling Strategy', 'Standard Documentation Support'],
    starterFeatures: ['Up to 5 Business Sites', 'Unlimited Payment Gateways', 'Basic Polling Strategy', 'Dedicated Support'],
    proFeatures: ['Up to 25 Business Sites', 'Unlimited Payment Gateways', 'Advanced Round-Robin', '24/7 Priority Support'],
    sourceFeatures: ['100% Full Source Code', 'Private Customization Rights', 'Unlimited Node Deployment', 'Lifetime Technical Guidance'],
    mostPopular: 'MOST POPULAR 🔥',
    coreRecommend: 'Recommended',
    contactManager: 'Contact Manager',
    statsTitle: 'Trusted by 2,000+ Businesses Globally',
    stat1Label: 'Daily Transactions',
    stat1Value: '500k+',
    stat2Label: 'Settlement Success Rate',
    stat2Value: '99.98%',
    stat3Label: 'Global Node Coverage',
    stat3Value: '18',
    archTitle: 'Architecture-Level Protection',
    archSub: 'We don\'t just route; we redefine the security boundary.',
    archPoint1Title: 'Request Masking Layer',
    archPoint1Desc: 'Automatically strip sensitive data and simulate real environments via dynamic fingerprinting.',
    archPoint2Title: 'Distributed Verification',
    archPoint2Desc: 'Every fund movement is verified by 3 independent nodes to ensure accuracy.',
    faqTitle: 'Frequently Asked Questions',
    faqQ1: 'Do I need to install VortexPay on my own server?',
    faqA1: 'Yes, we support private deployment. You can use our SaaS version or purchase the source code to deploy on your own independent servers for maximum data security.',
    faqQ2: 'How do you guarantee accurate routing ratios?',
    faqA2: 'Our built-in scheduler uses a sliding window algorithm to ensure precise heartbeat distribution (e.g., 30:70) with an error margin under 0.1%.',
    faqQ3: 'What happens if a gateway responds slowly?',
    faqA3: 'The system automatically monitors latency and health. If response time exceeds a threshold, the node is downgraded or removed from the pool until it recovers.',
    industriesTitle: 'Seamlessly Integrated with High-Potential Industries',
    industriesSub: 'From independent stores to virtual goods, we provide the most solid payment routing guarantee.',
    indEcom: 'Global E-Commerce',
    indEcomDesc: 'Supports global e-commerce, special categories, and store network models.',
    indDigital: 'Digital & Virtual Goods',
    indDigitalDesc: 'Software licenses, game top-ups, API billing without physical shipping.',
    indSub: 'Content Subscriptions',
    indSubDesc: 'Video platforms, creator sponsorships, and paid community memberships.',
    indDrop: 'Dropshipping',
    indDropDesc: 'Flexibly handle long shipping cycles and fluctuating dispute rates in dropshipping models.',
    ctaTitle: 'Ready to upgrade your payment infrastructure?',
    ctaSub: 'Join VortexPay today for unprecedented stability and freedom.',
    ctaBtn: 'Start Free Trial',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerContact: 'Contact Us',
    syncSuccess: 'Sync Success'
  }
};

export const LandingPage = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = (key: keyof typeof translations['zh']) => translations[lang][key];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "VortexPay",
    "operatingSystem": "Web, Private Server",
    "applicationCategory": "FintechApplication",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "39",
      "priceCurrency": "USD"
    },
    "description": translations[lang].heroSub
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">VortexPay</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">{t('navFeatures')}</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">{t('navSolutions')}</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t('navPricing')}</a>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
               <button 
                 onClick={() => setLang('zh')}
                 className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${lang === 'zh' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 中文
               </button>
               <button 
                 onClick={() => setLang('en')}
                 className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${lang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 EN
               </button>
            </div>
            <Button variant="ghost" className="font-bold text-slate-700 md:block hidden" onClick={() => window.location.href = '/admin'}>
              {t('login')}
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg shadow-indigo-100" onClick={() => window.location.href = '/admin'}>
              {t('getStarted')} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl animate-pulse"></div>
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-6 tracking-widest uppercase border border-indigo-100">
              {t('heroBadge')}
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
              {t('heroTitle')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{t('heroTitleHighlight')}</span>{t('heroTitleSystem')}
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-500 mb-10 leading-relaxed">
              {t('heroSub')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-14 px-10 text-lg font-bold shadow-xl shadow-indigo-200" onClick={() => window.location.href = '/admin'}>
                {t('heroBtnDeploy')}
              </Button>
              <Button size="lg" variant="outline" className="border-slate-200 hover:bg-slate-100 h-14 px-10 text-lg font-bold rounded-full">
                {t('heroBtnDemo')}
              </Button>
            </div>
            
            <div className="mt-20 relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
               <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-2">
                  <img src="https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=1200&h=600" alt="Dashboard Preview" className="rounded-xl w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats & Trust Section */}
      <section className="pb-24 pt-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-400 text-sm font-bold mb-12 uppercase tracking-widest">{t('statsTitle')}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe Payment Logo" className="h-8" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal Payment Logo" className="h-8" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Visa_2014_logo_detail.svg" alt="Visa Card Logo" className="h-8" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard Card Logo" className="h-8" />
          </div>
          
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
             <div className="space-y-2">
                <div className="text-4xl font-black text-slate-900">{t('stat1Value')}</div>
                <div className="text-slate-500 font-medium">{t('stat1Label')}</div>
             </div>
             <div className="space-y-2">
                <div className="text-4xl font-black text-indigo-600">{t('stat2Value')}</div>
                <div className="text-slate-500 font-medium">{t('stat2Label')}</div>
             </div>
             <div className="space-y-2">
                <div className="text-4xl font-black text-slate-900">{t('stat3Value')}</div>
                <div className="text-slate-500 font-medium">{t('stat3Label')}</div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('featuresTitle')}</h2>
            <p className="text-slate-500 font-medium">{t('featuresSub')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-colors border border-slate-100 group">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('routingTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('routingDesc')}
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-colors border border-slate-100 group">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('isolationTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('isolationDesc')}
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-colors border border-slate-100 group">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('dashboardTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('dashboardDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('industriesTitle')}</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">{t('industriesSub')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                 <ShoppingCart className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-3">{t('indEcom')}</h3>
               <p className="text-slate-500 text-sm leading-relaxed">{t('indEcomDesc')}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                 <MonitorPlay className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-3">{t('indDigital')}</h3>
               <p className="text-slate-500 text-sm leading-relaxed">{t('indDigitalDesc')}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                 <Repeat className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-3">{t('indSub')}</h3>
               <p className="text-slate-500 text-sm leading-relaxed">{t('indSubDesc')}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
               <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                 <PackageOpen className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-3">{t('indDrop')}</h3>
               <p className="text-slate-500 text-sm leading-relaxed">{t('indDropDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / How it works */}
      <section id="solutions" className="py-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-black text-slate-900 mb-8 leading-tight">
                {t('solutionsTitle')}<br />
                {t('solutionsTitleSub')}
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{t('step1Title')}</h4>
                    <p className="text-slate-500 text-sm">{t('step1Desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{t('step2Title')}</h4>
                    <p className="text-slate-500 text-sm">{t('step2Desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{t('step3Title')}</h4>
                    <p className="text-slate-500 text-sm">{t('step3Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-x-2 flex">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">ROUTING_ENGINE_V2_ACTIVE</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center"><Server className="w-4 h-4 text-indigo-400" /></div>
                         <div className="text-sm font-bold text-white">Ingress: GlobalSiteA.com</div>
                      </div>
                      <div className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase">Inbound</div>
                    </div>
                    
                    <div className="py-2 flex justify-center">
                       <ArrowRight className="w-6 h-6 text-indigo-500 rotate-90" />
                    </div>

                    <div className="flex gap-4">
                      <div className="w-1/2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                         <div className="text-[10px] font-bold text-emerald-400 mb-2">TARGET_B1 (35%)</div>
                         <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[70%]" />
                         </div>
                      </div>
                      <div className="w-1/2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                         <div className="text-[10px] font-bold text-blue-400 mb-2">TARGET_B2 (65%)</div>
                         <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[40%]" />
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
               {/* Floating elements */}
               <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce delay-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold">{t('syncSuccess')}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Callback push: 200 OK</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Architecture Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L100 0" stroke="currentColor" strokeWidth="0.1" />
              <path d="M0 0 L100 100" stroke="currentColor" strokeWidth="0.1" />
           </svg>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{t('archTitle')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('archSub')}</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-8">
                <div className="flex gap-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Cpu className="w-6 h-6 text-indigo-600" />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{t('archPoint1Title')}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('archPoint1Desc')}</p>
                   </div>
                </div>
                <div className="flex gap-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Layers className="w-6 h-6 text-blue-600" />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{t('archPoint2Title')}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{t('archPoint2Desc')}</p>
                   </div>
                </div>
             </div>
             
             <div className="relative p-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                   <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">Node_Consensus_Monitor</span>
                </div>
                <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                            <span className="text-xs font-mono text-slate-600">NODE_00{i}_HEALTH</span>
                         </div>
                         <div className="text-[10px] font-bold text-emerald-600 uppercase">Verified</div>
                      </div>
                   ))}
                </div>
                <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map(i => (
                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                      ))}
                   </div>
                   <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase italic">Secure Cluster Active</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">{t('pricingTitle')}</h2>
          <p className="text-slate-400 mb-16 max-w-xl mx-auto italic">{t('pricingSub')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <Card className="bg-slate-800 border-slate-700 text-white rounded-3xl overflow-hidden hover:scale-105 transition-transform">
               <CardContent className="p-10 text-left">
                  <div className="text-zinc-400 font-bold mb-4 uppercase tracking-widest text-xs">{t('freeTrial')}</div>
                  <div className="text-4xl font-black mb-6">$0<span className="text-lg font-medium text-slate-500"> {t('mo')}</span></div>
                  <ul className="space-y-4 mb-10 text-slate-300 text-sm">
                    {t('freeFeatures').map((f, i) => (
                      <li key={i} className={`flex items-center gap-2`}><CheckCircle2 className="w-4 h-4 text-zinc-400" /> {f}</li>
                    ))}
                  </ul>
                  <Button className="w-full bg-slate-700 text-white border-none h-12 font-bold rounded-xl hover:bg-slate-600">{t('getStarted')}</Button>
               </CardContent>
             </Card>

             <Card className="bg-slate-800 border-slate-700 text-white rounded-3xl overflow-hidden hover:scale-105 transition-transform">
               <CardContent className="p-10 text-left">
                  <div className="text-indigo-400 font-bold mb-4 uppercase tracking-widest text-xs">{t('starter')}</div>
                  <div className="text-4xl font-black mb-6">$39<span className="text-lg font-medium text-slate-500"> {t('mo')}</span></div>
                  <ul className="space-y-4 mb-10 text-slate-300 text-sm">
                    {t('starterFeatures').map((f, i) => (
                      <li key={i} className={`flex items-center gap-2 ${i === 3 ? 'opacity-30' : ''}`}><CheckCircle2 className="w-4 h-4 text-indigo-400" /> {f}</li>
                    ))}
                  </ul>
                  <Button className="w-full bg-white text-slate-900 border-none h-12 font-bold rounded-xl hover:bg-slate-100">{t('getStarted')}</Button>
               </CardContent>
             </Card>

             <Card className="bg-indigo-600 border-indigo-500 text-white rounded-3xl overflow-hidden scale-110 shadow-2xl z-10">
               <div className="bg-white text-indigo-600 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('mostPopular')}</div>
               <CardContent className="p-10 text-left">
                  <div className="text-white/80 font-bold mb-4 uppercase tracking-widest text-xs">{t('professional')}</div>
                  <div className="text-4xl font-black mb-6">$59<span className="text-lg font-medium text-white/50"> {t('mo')}</span></div>
                  <ul className="space-y-4 mb-10 text-white/90 text-sm">
                    {t('proFeatures').map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-200" /> {f}</li>
                    ))}
                  </ul>
                  <Button className="w-full bg-white text-indigo-600 border-none h-12 font-bold rounded-xl hover:bg-slate-100">{t('coreRecommend')}</Button>
               </CardContent>
             </Card>

             <Card className="bg-slate-800 border-slate-700 text-white rounded-3xl overflow-hidden hover:scale-105 transition-transform">
               <CardContent className="p-10 text-left">
                  <div className="text-indigo-400 font-bold mb-4 uppercase tracking-widest text-xs">{t('sourcePack')}</div>
                  <div className="text-4xl font-black mb-6">$499<span className="text-lg font-medium text-slate-500"> {t('once')}</span></div>
                  <ul className="space-y-4 mb-10 text-slate-300 text-sm">
                     {t('sourceFeatures').map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> {f}</li>
                    ))}
                  </ul>
                  <Button className="w-full border-white/20 border-2 bg-transparent text-white h-12 font-bold rounded-xl hover:bg-white/10">{t('contactManager')}</Button>
               </CardContent>
             </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
         <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black text-slate-900 mb-4">{t('faqTitle')}</h2>
               <div className="w-16 h-1.5 bg-indigo-600 mx-auto rounded-full" />
            </div>
            
            <div className="space-y-8">
               <div className="group">
                  <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-3">
                     <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                     {t('faqQ1')}
                  </h4>
                  <p className="text-slate-500 text-sm pl-8 border-l-2 border-slate-100 group-hover:border-indigo-600 transition-colors">
                     {t('faqA1')}
                  </p>
               </div>
               <div className="group">
                  <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-3">
                     <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                     {t('faqQ2')}
                  </h4>
                  <p className="text-slate-500 text-sm pl-8 border-l-2 border-slate-100 group-hover:border-indigo-600 transition-colors">
                     {t('faqA2')}
                  </p>
               </div>
               <div className="group">
                  <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-3">
                     <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                     {t('faqQ3')}
                  </h4>
                  <p className="text-slate-500 text-sm pl-8 border-l-2 border-slate-100 group-hover:border-indigo-600 transition-colors">
                     {t('faqA3')}
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-indigo-600 translate-y-1/2 rounded-[100%] scale-150 blur-3xl opacity-20" />
         <div className="max-w-4xl mx-auto px-6 text-center relative">
            <div className="inline-flex p-3 bg-indigo-50 rounded-2xl mb-8">
               <Zap className="w-8 h-8 text-indigo-600 fill-current" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
               {t('ctaTitle')}
            </h2>
            <p className="text-xl text-slate-500 mb-10">
               {t('ctaSub')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-16 px-12 text-xl font-bold shadow-2xl shadow-indigo-200" onClick={() => window.location.href = '/admin'}>
                  {t('ctaBtn')}
               </Button>
               <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <MessageSquare className="w-5 h-5" />
                  <span>咨询技术顾问</span>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 text-white p-1 rounded-md">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">VortexPay</span>
           </div>
           
           <div className="flex items-center space-x-8 text-slate-400 text-xs font-semibold">
              <a href="#" className="hover:text-slate-900">{t('footerTerms')}</a>
              <a href="#" className="hover:text-slate-900">{t('footerPrivacy')}</a>
              <a href="#" className="hover:text-slate-900">{t('footerContact')}</a>
           </div>

           <div className="text-slate-400 text-xs font-mono">
              © 2026 VORTEXPAY CORE SYSTEM. AUTHENTICATED GATEWAY.
           </div>
        </div>
      </footer>
    </div>
  );
};

