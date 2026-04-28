import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, ArrowLeft, MoreVertical, Calendar, Plus, Trash2, Settings, Mail, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [tab, setTab] = useState<'tenants' | 'settings' | 'fraud' | 'api_nodes'>('tenants');
  const [newEmail, setNewEmail] = useState('');
  const [newDays, setNewDays] = useState('1');
  const [newPlan, setNewPlan] = useState('free');
  
  // Fraud state
  const [fraudRules, setFraudRules] = useState<any[]>([]);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  
  // API Nodes state
  const [apiNodes, setApiNodes] = useState<any[]>([]);
  const [newNodeUrl, setNewNodeUrl] = useState('');
  
  // Settings state
  const [smtpConfig, setSmtpConfig] = useState<Record<string, string>>({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    smtp_secure: 'false'
  });

  useEffect(() => {
    let active = true;
    const fetchIt = async () => {
      try {
        const data = await apiFetch('/admin/tenants');
        if (active) setTenants(data);
      } catch (e: any) { 
        console.error(e); 
        if (e.message.includes('Unauthorized') || e.message.includes('Tenant')) {
          window.location.reload(); // Quickest way to reset app state from deep child
        }
      }
    };
    fetchIt();
    const int = setInterval(fetchIt, 3000);
    return () => { active = false; clearInterval(int); };
  }, []);

  useEffect(() => {
    if (tab === 'settings') {
      apiFetch('/admin/settings').then(data => {
        const config: Record<string, string> = {};
        data.forEach((s: any) => config[s.key] = s.value);
        setSmtpConfig(prev => ({ ...prev, ...config }));
      }).catch(e => toast.error('Failed to load settings'));
    } else if (tab === 'fraud') {
       apiFetch('/admin/fraud-rules').then(data => {
          setFraudRules(data);
       }).catch(e => toast.error('Failed to load fraud rules'));
    } else if (tab === 'api_nodes') {
       apiFetch('/admin/api-nodes').then(data => {
          setApiNodes(data);
       }).catch(e => toast.error('Failed to load API nodes'));
    }
  }, [tab]);

  const addApiNode = async () => {
    if (!newNodeUrl) return;
    try {
      await apiFetch('/admin/api-nodes', {
         method: 'POST',
         body: JSON.stringify({ url: newNodeUrl })
      });
      setNewNodeUrl('');
      toast.success('API Node added');
      apiFetch('/admin/api-nodes').then(setApiNodes);
    } catch (e) {
      toast.error('Failed to add node');
    }
  };

  const deleteApiNode = async (id: string) => {
    try {
      await apiFetch(`/admin/api-nodes/${id}`, { method: 'DELETE' });
      setApiNodes(apiNodes.filter(n => n.id !== id));
    } catch (e) {
      toast.error('Failed to delete node');
    }
  };

  const toggleApiNode = async (id: string, active: boolean) => {
    try {
      await apiFetch(`/admin/api-nodes/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ active: !active }) });
      setApiNodes(apiNodes.map(n => n.id === id ? { ...n, active: !n.active ? 1 : 0 } : n));
    } catch (e) {
      toast.error('Failed to toggle node');
    }
  };

  const checkApiNode = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/api-nodes/${id}/check`, { method: 'POST' });
      toast.info(`Node status: ${res.status}`);
      setApiNodes(apiNodes.map(n => n.id === id ? { ...n, status: res.status, last_check: res.last_check } : n));
    } catch (e) {
      toast.error('Failed to check node');
    }
  };

  const addFraudRule = async () => {
     if (!newRuleKeyword) return;
     try {
       const res = await apiFetch('/admin/fraud-rules', {
          method: 'POST',
          body: JSON.stringify({ keyword: newRuleKeyword, description: newRuleDesc, type: 'keyword' })
       });
       setFraudRules([res, ...fraudRules]);
       setNewRuleKeyword('');
       setNewRuleDesc('');
       toast.success('Rule added');
     } catch(e) {
       toast.error('Failed to add rule (might be a duplicate)');
     }
  };

  const deleteFraudRule = async (id: string) => {
     try {
       await apiFetch(`/admin/fraud-rules/${id}`, { method: 'DELETE' });
       setFraudRules(fraudRules.filter(r => r.id !== id));
     } catch (e) {
       toast.error('Failed to delete rule');
     }
  };

  const toggleFraudRule = async (id: string, active: boolean) => {
     try {
       await apiFetch(`/admin/fraud-rules/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ active: !active }) });
       setFraudRules(fraudRules.map(r => r.id === id ? { ...r, active: !r.active ? 1 : 0 } : r));
     } catch (e) {
       toast.error('Failed to toggle rule');
     }
  };

  const saveSettings = async () => {
    try {
      const payload = Object.entries(smtpConfig).map(([key, value]) => ({ key, value }));
      await apiFetch('/admin/settings', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('System settings updated');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const updateExpiry = async (id: string, days: number) => {
    const tenant = tenants.find(t => t.id === id);
    const currentExpiry = tenant?.expiresAt ? new Date(tenant.expiresAt).getTime() : Date.now();
    const newExpiry = new Date(currentExpiry + days * 24 * 60 * 60 * 1000).toISOString();
    await apiFetch(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ expiresAt: newExpiry, active: true }) });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await apiFetch(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ active: !currentStatus }) });
  };

  const updatePlan = async (id: string, plan: string) => {
    await apiFetch(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ plan }) });
  };

  const addTenant = async () => {
    if (!newEmail) return;
    const expiresAt = new Date(Date.now() + parseInt(newDays) * 24 * 60 * 60 * 1000).toISOString();
    await apiFetch('/admin/tenants', {
       method: 'POST',
       body: JSON.stringify({
         email: newEmail,
         strategy: 'random',
         roundRobinIndex: 0,
         apiKey: 'sk_test_' + Math.random().toString(36).substring(2, 10),
         active: true,
         expiresAt,
         plan: newPlan
       })
    });
    setNewEmail('');
  };

  const deleteTenant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant and all their sites?')) return;
    await apiFetch(`/admin/tenants/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans">
      <header className="bg-white border-b-2 border-[#141414] p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
           <Button variant="ghost" size="icon" onClick={onBack} className="mr-4 hover:bg-[#141414] hover:text-white rounded-none">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="bg-[#141414] text-white w-8 h-8 flex items-center justify-center mr-3 rounded-sm">
             <ShieldCheck className="w-5 h-5" />
           </div>
            <div className="bg-[#141414] text-white w-8 h-8 flex items-center justify-center mr-3 rounded-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-[#141414]">SaaS Admin</h1>
              <div className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-widest">Superuser Dashboard</div>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 border border-slate-200">
             <button onClick={() => setTab('tenants')} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${tab === 'tenants' ? 'bg-[#141414] text-white' : 'text-slate-500 hover:text-black'}`}>
                Tenants
             </button>
             <button onClick={() => setTab('fraud')} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${tab === 'fraud' ? 'bg-[#141414] text-white' : 'text-slate-500 hover:text-black'}`}>
                Fraud Protection
             </button>
             <button onClick={() => setTab('api_nodes')} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${tab === 'api_nodes' ? 'bg-[#141414] text-white' : 'text-slate-500 hover:text-black'}`}>
                API Nodes
             </button>
             <button onClick={() => setTab('settings')} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${tab === 'settings' ? 'bg-[#141414] text-white' : 'text-slate-500 hover:text-black'}`}>
                System Settings
             </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 space-y-6">
          {tab === 'tenants' && (
            <>
              <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6 mb-6">
                 <h2 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2" /> Add New Tenant
                 </h2>
                 <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Email / Identifier</label>
                      <Input 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)} 
                        placeholder="user@example.com"
                        className="rounded-none border-2 border-[#141414]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Initial Trial</label>
                      <Select value={newDays} onValueChange={setNewDays}>
                         <SelectTrigger className="w-[150px] rounded-none border-2 border-[#141414]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-2 border-[#141414]">
                           <SelectItem value="7">7 Days</SelectItem>
                           <SelectItem value="14">14 Days</SelectItem>
                           <SelectItem value="30">30 Days</SelectItem>
                           <SelectItem value="365">1 Year</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Plan</label>
                      <Select value={newPlan} onValueChange={setNewPlan}>
                         <SelectTrigger className="w-[120px] rounded-none border-2 border-[#141414]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-2 border-[#141414]">
                           <SelectItem value="free">Free Trial</SelectItem>
                           <SelectItem value="starter">Starter</SelectItem>
                           <SelectItem value="professional">Professional</SelectItem>
                           <SelectItem value="sourcePack">Source Pack</SelectItem>
                           <SelectItem value="pro">Pro (Legacy)</SelectItem>
                           <SelectItem value="enterprise">Enterprise (Legacy)</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addTenant} className="bg-[#141414] hover:bg-black text-white rounded-none uppercase font-bold tracking-widest h-10 px-8">
                       Create Tenant
                    </Button>
                 </div>
              </div>

              <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6">
                 <h2 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" /> Tenant Management
                 </h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="bg-[#141414] text-white">
                        <tr>
                          <th className="p-3 font-bold uppercase tracking-wider">Tenant / Email</th>
                          <th className="p-3 font-bold uppercase tracking-wider">Plan</th>
                          <th className="p-3 font-bold uppercase tracking-wider">Status</th>
                          <th className="p-3 font-bold uppercase tracking-wider">Expiry Date</th>
                          <th className="p-3 font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]">
                         {tenants.map(tenant => {
                            const isExpired = tenant.expiresAt && new Date(tenant.expiresAt).getTime() < Date.now();
                            const statusStr = tenant.active ? (isExpired ? 'EXPIRED' : 'ACTIVE') : 'DISABLED';
                            
                            return (
                              <tr key={tenant.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-3">
                                  <div className="font-bold text-[14px] font-sans">{tenant.email}</div>
                                  <div className="text-[10px] text-slate-500 mt-1">ID: {tenant.id}</div>
                                </td>
                                <td className="p-3">
                                   <Select value={tenant.plan || 'free'} onValueChange={(val: string) => updatePlan(tenant.id, val)}>
                                     <SelectTrigger className="w-[110px] h-8 text-[10px] rounded-none border-[#141414] uppercase font-bold">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-none border-2 border-[#141414]">
                                       <SelectItem value="free">Free Trial</SelectItem>
                                       <SelectItem value="starter">Starter</SelectItem>
                                       <SelectItem value="professional">Professional</SelectItem>
                                       <SelectItem value="sourcePack">Source Pack</SelectItem>
                                       <SelectItem value="pro">Pro (Legacy)</SelectItem>
                                       <SelectItem value="enterprise">Enterprise (Legacy)</SelectItem>
                                     </SelectContent>
                                   </Select>
                                </td>
                                <td className="p-3">
                                   <span className={`px-2 py-1 text-[10px] uppercase font-bold ${statusStr === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                     {statusStr}
                                   </span>
                                </td>
                                <td className="p-3 text-xs">
                                   {tenant.expiresAt ? new Date(tenant.expiresAt).toLocaleDateString() + ' ' + new Date(tenant.expiresAt).toLocaleTimeString() : 'No expiry set'}
                                </td>
                                <td className="p-3 flex gap-2 justify-end">
                                   <Select onValueChange={(val: string) => updateExpiry(tenant.id, parseInt(val))}>
                                     <SelectTrigger className="w-[110px] h-8 text-[10px] rounded-none border-[#141414] uppercase font-bold">
                                       <SelectValue placeholder="Add Time" />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-none border-2 border-[#141414]">
                                       <SelectItem value="7">+7 Days</SelectItem>
                                       <SelectItem value="30">+30 Days</SelectItem>
                                       <SelectItem value="365">+1 Year</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="h-8 rounded-none border-[#141414] text-[10px] uppercase font-bold w-[70px]"
                                     onClick={() => toggleStatus(tenant.id, !!tenant.active)}
                                   >
                                     {tenant.active ? 'Disable' : 'Enable'}
                                   </Button>
                                   <Button 
                                     variant="destructive" 
                                     size="icon" 
                                     className="h-8 w-8 rounded-none"
                                     onClick={() => deleteTenant(tenant.id)}
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                </td>
                              </tr>
                            );
                         })}
                      </tbody>
                    </table>
                 </div>
              </div>
            </>
          )}
          {tab === 'fraud' && (
             <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                   <ShieldCheck className="w-6 h-6 text-red-600" />
                   <h2 className="text-xl font-black uppercase tracking-tighter">Fraud Protection Rules</h2>
                </div>
                
                <div className="flex gap-4 items-end mb-8 bg-slate-50 p-4 border-2 border-dashed border-slate-200">
                   <div className="flex-1">
                     <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Match Keyword / ASN / IP</label>
                     <Input 
                       value={newRuleKeyword} 
                       onChange={e => setNewRuleKeyword(e.target.value)} 
                       placeholder="e.g. paypal, stripe, AWS"
                       className="rounded-none border-2 border-[#141414]"
                     />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs font-bold uppercase tracking-widest mb-2 block">Description (Optional)</label>
                     <Input 
                       value={newRuleDesc} 
                       onChange={e => setNewRuleDesc(e.target.value)} 
                       placeholder="e.g. Block automated datacenters"
                       className="rounded-none border-2 border-[#141414]"
                     />
                   </div>
                   <Button onClick={addFraudRule} className="bg-[#141414] hover:bg-black text-white rounded-none uppercase font-bold tracking-widest h-10 px-8">
                      Add Rule
                   </Button>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm font-mono">
                     <thead className="bg-[#141414] text-white">
                       <tr>
                         <th className="p-3 font-bold uppercase tracking-wider">Keyword</th>
                         <th className="p-3 font-bold uppercase tracking-wider">Description</th>
                         <th className="p-3 font-bold uppercase tracking-wider">Status</th>
                         <th className="p-3 font-bold uppercase tracking-wider text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#141414]">
                        {fraudRules.map(rule => (
                          <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-red-600">{rule.keyword}</td>
                            <td className="p-3 text-slate-500 text-xs">{rule.description || '-'}</td>
                            <td className="p-3">
                               <span className={`px-2 py-1 text-[10px] uppercase font-bold ${rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                                 {rule.active ? 'Active (Blocking)' : 'Disabled'}
                               </span>
                            </td>
                            <td className="p-3 flex gap-2 justify-end">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-8 rounded-none border-[#141414] text-[10px] uppercase font-bold"
                                 onClick={() => toggleFraudRule(rule.id, !!rule.active)}
                               >
                                 {rule.active ? 'Disable' : 'Enable'}
                               </Button>
                               <Button 
                                 variant="destructive" 
                                 size="icon" 
                                 className="h-8 w-8 rounded-none"
                                 onClick={() => deleteFraudRule(rule.id)}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                            </td>
                          </tr>
                        ))}
                        {fraudRules.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-500 text-xs uppercase font-bold">
                              No active fraud rules. The system will fall back to safe defaults (paypal, stripe, aws, etc).
                            </td>
                          </tr>
                        )}
                     </tbody>
                   </table>
                </div>
             </div>
          )}
          {tab === 'api_nodes' && (
             <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                   <Settings className="w-6 h-6 text-purple-600" />
                   <h2 className="text-xl font-black uppercase tracking-tighter">API Nodes Management</h2>
                </div>
                <div className="bg-slate-50 p-4 border-2 border-[#141414] border-dashed mb-8">
                   <div className="flex gap-4 items-end">
                      <div className="flex-1">
                         <label className="text-xs font-bold uppercase tracking-widest mb-2 block">New Node URL</label>
                         <Input 
                            placeholder="e.g. https://api1.vortexpay.io" 
                            className="rounded-none border-2 border-[#141414] h-10 font-mono" 
                            value={newNodeUrl} 
                            onChange={e => setNewNodeUrl(e.target.value)} 
                         />
                      </div>
                      <Button onClick={addApiNode} className="bg-[#141414] hover:bg-black text-white rounded-none uppercase font-bold tracking-widest h-10 px-8">
                         <Plus className="w-4 h-4 mr-2" /> Add Node
                      </Button>
                   </div>
                </div>
                
                <div className="border border-slate-200 bg-white">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-[#141414] text-white">
                       <tr>
                         <th className="p-3 font-bold uppercase tracking-wider">Node URL</th>
                         <th className="p-3 font-bold uppercase tracking-wider">Status</th>
                         <th className="p-3 font-bold uppercase tracking-wider">Last Check</th>
                         <th className="p-3 font-bold uppercase tracking-wider text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {apiNodes.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 font-mono text-sm">No API nodes configured</td>
                           </tr>
                        ) : apiNodes.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50">
                             <td className="p-3 font-mono text-xs">{n.url}</td>
                             <td className="p-3">
                               <div className="flex items-center gap-2">
                                 <span className={`w-2 h-2 rounded-full ${n.status === 'healthy' ? 'bg-emerald-500' : n.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                 <span className="uppercase text-[10px] font-bold tracking-widest text-slate-600">{n.status}</span>
                               </div>
                             </td>
                             <td className="p-3 text-xs text-slate-500 font-mono">
                               {n.last_check ? new Date(n.last_check).toLocaleString() : 'Never'}
                             </td>
                             <td className="p-3 text-right">
                               <Button variant="ghost" size="sm" onClick={() => checkApiNode(n.id)} className="h-8 rounded-none text-xs mr-2 font-bold uppercase tracking-widest text-slate-500 hover:text-[#141414]">
                                 Check Now
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => toggleApiNode(n.id, n.active === 1)} className={`h-8 rounded-none text-xs mr-2 font-bold uppercase tracking-widest ${n.active ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-[#141414] hover:bg-slate-100'}`}>
                                 {n.active ? 'Active' : 'Paused'}
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => deleteApiNode(n.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none h-8 w-8">
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>
          )}
          {tab === 'settings' && (
             <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_0_#141414] p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                   <Mail className="w-6 h-6 text-indigo-600" />
                   <h2 className="text-xl font-black uppercase tracking-tighter">Email (SMTP) Configuration</h2>
                </div>
                
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">SMTP Host</label>
                        <Input 
                          value={smtpConfig.smtp_host} 
                          onChange={e => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} 
                          placeholder="smtp.example.com"
                          className="rounded-none border-2 border-[#141414]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">SMTP Port</label>
                        <Input 
                          value={smtpConfig.smtp_port} 
                          onChange={e => setSmtpConfig({...smtpConfig, smtp_port: e.target.value})} 
                          placeholder="587"
                          className="rounded-none border-2 border-[#141414]"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">SMTP Username</label>
                        <Input 
                          value={smtpConfig.smtp_user} 
                          onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} 
                          placeholder="user@example.com"
                          className="rounded-none border-2 border-[#141414]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">SMTP Password</label>
                        <Input 
                          type="password"
                          value={smtpConfig.smtp_pass} 
                          onChange={e => setSmtpConfig({...smtpConfig, smtp_pass: e.target.value})} 
                          placeholder="••••••••"
                          className="rounded-none border-2 border-[#141414]"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">From Name/Email</label>
                        <Input 
                          value={smtpConfig.smtp_from} 
                          onChange={e => setSmtpConfig({...smtpConfig, smtp_from: e.target.value})} 
                          placeholder='"VortexPay" <no-reply@vortexpay.io>'
                          className="rounded-none border-2 border-[#141414]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure (SSL/TLS)</label>
                        <Select value={smtpConfig.smtp_secure} onValueChange={(val) => setSmtpConfig({...smtpConfig, smtp_secure: val})}>
                           <SelectTrigger className="rounded-none border-2 border-[#141414]">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-none border-2 border-[#141414]">
                             <SelectItem value="true">Enable SSL (465)</SelectItem>
                             <SelectItem value="false">Disable / STARTTLS (587)</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                   </div>

                   <div className="pt-4 border-t-2 border-slate-100 flex justify-end">
                      <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-none uppercase font-bold tracking-widest h-12 px-10">
                         <Save className="w-5 h-5 mr-2" /> Save System Settings
                      </Button>
                   </div>
                </div>
                
                <div className="mt-8 p-4 bg-slate-50 border-2 border-dashed border-slate-200">
                   <p className="text-[10px] text-slate-400 font-mono italic">
                      Note: These settings are global across the entire VortexPay routing system. If left blank, system will default to terminal logging/simulation mode.
                   </p>
                </div>
             </div>
          )}
        </main>
    </div>
  );
}
