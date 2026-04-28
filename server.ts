import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import nodemailer from "nodemailer";
import db from "./database.js"; // Use local sqlite db

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = 'super-secret-jwt-key';

const PLAN_QUOTAS: Record<string, { aSites: number, bSites: number }> = {
  free: { aSites: 1, bSites: 1 },
  starter: { aSites: 3, bSites: 6 },
  professional: { aSites: 30, bSites: 90 },
  pro: { aSites: 30, bSites: 90 }, // Legacy fallback
  sourcePack: { aSites: 999999, bSites: 999999 },
  enterprise: { aSites: 999999, bSites: 999999 } // Legacy fallback
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- Bootstrap Logic ---
  async function bootstrapSystem() {
    console.log("[SYSTEM] Checking for initial admin account...");
    const existingAdmin = db.prepare('SELECT * FROM tenants WHERE email = ?').get('samlau0086@gmail.com') as any;
    
    if (!existingAdmin) {
      const email = process.env.ADMIN_EMAIL || 'samlau0086@gmail.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const tempUid = 'sys_admin_' + crypto.randomBytes(3).toString('hex');
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      try {
        db.prepare(`
          INSERT INTO tenants (id, email, password, strategy, roundRobinIndex, apiKey, active, expiresAt, plan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tempUid, email, hashedPassword, 'random', 0, 'sk_admin_' + crypto.randomBytes(4).toString('hex'), 1, expiresAt, 'enterprise');
        
        console.log(`[SYSTEM] Bootstrap: Created default admin account: ${email}`);
        console.log(`[SYSTEM] Initial password set. Use .env to customize or change in panel.`);
      } catch (err) {
        console.error(`[SYSTEM] Bootstrap Error:`, err);
      }
    } else {
      console.log(`[SYSTEM] Admin account verified.`);
    }
  }
  
  await bootstrapSystem();

  // --- Email Helper ---
  async function getEmailConfig() {
    const settings = db.prepare('SELECT * FROM system_settings').all() as any[];
    const config: any = {};
    settings.forEach(s => config[s.key] = s.value);
    return config;
  }

  async function sendEmail(to: string, subject: string, text: string) {
    const config = await getEmailConfig();
    if (!config.smtp_host) {
      console.log(`[EMAIL] SMTP not configured. MOCK EMAIL to ${to}: ${subject}\n${text}`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: Number(config.smtp_port) || 587,
        secure: config.smtp_secure === 'true',
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      await transporter.sendMail({
        from: config.smtp_from || `"VortexPay" <${config.smtp_user}>`,
        to,
        subject,
        text,
      });
      console.log(`[EMAIL] Success: Sent to ${to}`);
    } catch (err) {
      console.error(`[EMAIL] Error sending to ${to}:`, err);
      throw new Error('Failed to send email');
    }
  }

  // --- Auth & Admin Gateway APIs ---
  
  app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Register attempt: ${email}`);
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let tenant = db.prepare('SELECT * FROM tenants WHERE email = ?').get(email) as any;
    if (tenant && tenant.password) {
       return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (tenant && !tenant.password) {
      // Claim legacy account
      db.prepare('UPDATE tenants SET password = ? WHERE id = ?').run(hashedPassword, tenant.id);
      console.log(`[AUTH] Legacy account claimed: ${email}`);
    } else {
      // New registration
      const tempUid = 'sys_' + crypto.randomBytes(5).toString('hex');
      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 day free trial
      
      try {
        db.prepare(`
          INSERT INTO tenants (id, email, password, strategy, roundRobinIndex, apiKey, active, expiresAt, plan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tempUid, email, hashedPassword, 'random', 0, 'sk_test_' + crypto.randomBytes(4).toString('hex'), 1, expiresAt, 'free');
        console.log(`[AUTH] Register success: ${email}`);
      } catch (err) {
        console.error(`[AUTH] Register error:`, err);
        return res.status(500).json({ error: 'Failed to create account' });
      }
    }
    
    tenant = db.prepare('SELECT * FROM tenants WHERE email = ?').get(email);
    const token = jwt.sign({ uid: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { uid: tenant.id, email: tenant.email } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt: ${email}`);
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let tenant = db.prepare('SELECT * FROM tenants WHERE email = ?').get(email) as any;
    if (!tenant) {
      console.log(`[AUTH] Login failed: User not found`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (tenant.password) {
       const isMatch = await bcrypt.compare(password, tenant.password);
       if (!isMatch) {
         console.log(`[AUTH] Login failed: Password mismatch`);
         return res.status(400).json({ error: 'Invalid credentials' });
       }
    } else {
       console.log(`[AUTH] Login failed: Legacy account`);
       return res.status(400).json({ error: 'Invalid credentials. Please register again if this is a legacy account.' });
    }
    
    if (tenant.otpEnabled) {
       console.log(`[AUTH] Login: OTP required for ${email}`);
       const tempToken = jwt.sign({ uid: tenant.id, email: tenant.email, pendingOtp: true }, JWT_SECRET, { expiresIn: '15m' });
       return res.json({ requireOtp: true, tempToken });
    }

    const token = jwt.sign({ uid: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`[AUTH] Login success: ${email}`);
    res.json({ token, user: { uid: tenant.id, email: tenant.email } });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { tempToken, code } = req.body;
    try {
      const decoded: any = jwt.verify(tempToken, JWT_SECRET);
      if (!decoded.pendingOtp) throw new Error();
      
      const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(decoded.uid) as any;
      if (!tenant || !tenant.otpEnabled || !tenant.otpSecret) return res.status(400).json({ error: 'OTP not configured correctly' });
      
      const verified = speakeasy.totp.verify({
         secret: tenant.otpSecret,
         encoding: 'base32',
         token: code
      });
      
      if (!verified) return res.status(400).json({ error: 'Invalid OTP code' });
      
      const token = jwt.sign({ uid: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { uid: tenant.id, email: tenant.email } });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`[AUTH] Forgot password request for: ${email}`);
    if (!email) return res.status(400).json({ error: 'Email required' });

    const tenant = db.prepare('SELECT * FROM tenants WHERE email = ?').get(email) as any;
    if (!tenant) {
      // Don't reveal if email exists, just return success
      return res.json({ success: true, message: 'If an account with that email exists, a reset link will be sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare('UPDATE tenants SET resetToken = ?, resetTokenExpires = ? WHERE email = ?')
      .run(resetToken, resetTokenExpires, email);

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/admin?resetToken=${resetToken}`;
    
    try {
      await sendEmail(
        email, 
        'Password Reset Request - VortexPay',
        `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`
      );
      res.json({ success: true, message: 'If an account with that email exists, a reset link has been shared with you.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const tenant = db.prepare('SELECT * FROM tenants WHERE resetToken = ? AND resetTokenExpires > ?')
      .get(token, new Date().toISOString()) as any;

    if (!tenant) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE tenants SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?')
      .run(hashedPassword, tenant.id);

    console.log(`[AUTH] Password reset success for: ${tenant.email}`);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  });

  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Verify tenant still exists in DB
      const tenant = db.prepare('SELECT id, email FROM tenants WHERE id = ?').get(decoded.uid);
      if (!tenant) {
        return res.status(401).json({ error: 'Tenant no longer exists. Please log in again.' });
      }
      
      req.user = decoded;
      next();
    } catch(e) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };

  app.post('/api/auth/change-password', requireAuth, async (req: any, res: any) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new passwords required' });

    const tenantId = req.user.uid;
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
    if (!tenant || !tenant.password) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, tenant.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect old password' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE tenants SET password = ? WHERE id = ?').run(hashedNewPassword, tenantId);

    console.log(`[AUTH] Password changed for: ${tenant.email}`);
    res.json({ success: true, message: 'Password changed successfully' });
  });

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.email !== 'samlau0086@gmail.com') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- User / Tenant APIs ---
  app.post('/api/auth/setup-otp', requireAuth, async (req: any, res: any) => {
    const tenantId = req.user.uid;
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
    // We already checked tenant existence in requireAuth, but for safety in case of race:
    if (!tenant) return res.status(401).json({ error: 'Tenant not found' });

    // Generate new secret
    const secret = speakeasy.generateSecret({ length: 20, name: `VortexPay (${tenant.email})` });
    
    // Save secret to db temporarily (or overwrite existing if unconfirmed, or just overwrite since they are requesting setup)
    db.prepare('UPDATE tenants SET otpSecret = ? WHERE id = ?').run(secret.base32, tenantId);

    const data_url = await qrcode.toDataURL(secret.otpauth_url || '');
    res.json({ secret: secret.base32, qrCode: data_url });
  });

  app.post('/api/auth/confirm-otp', requireAuth, (req: any, res: any) => {
    const { code } = req.body;
    const tenantId = req.user.uid;
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
    if (!tenant || !tenant.otpSecret) return res.status(400).json({ error: 'OTP setup not initialized' });

    const verified = speakeasy.totp.verify({
       secret: tenant.otpSecret,
       encoding: 'base32',
       token: code
    });

    if (!verified) return res.status(400).json({ error: 'Invalid OTP code' });

    db.prepare('UPDATE tenants SET otpEnabled = 1 WHERE id = ?').run(tenantId);
    res.json({ success: true });
  });

  app.post('/api/auth/disable-otp', requireAuth, (req: any, res: any) => {
    const tenantId = req.user.uid;
    db.prepare('UPDATE tenants SET otpEnabled = 0, otpSecret = NULL WHERE id = ?').run(tenantId);
    res.json({ success: true });
  });

  app.get('/api/stats', requireAuth, (req: any, res: any) => {
    const tenantId = req.user.uid;
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(401).json({ error: 'Tenant not found' });
    
    const aSites = db.prepare('SELECT * FROM a_sites WHERE tenantId = ?').all(tenantId);
    const bSites = db.prepare('SELECT * FROM b_sites WHERE tenantId = ?').all(tenantId);
    const orders = db.prepare('SELECT * FROM orders WHERE tenantId = ? ORDER BY createdAt DESC').all(tenantId);
    
    // Get active and healthy API nodes
    const activeApiNodes = db.prepare('SELECT url FROM api_nodes WHERE active = 1 AND status = ?').all('healthy').map((n: any) => n.url);

    res.json({
       tenantConfig: tenant,
       pollingConfig: { rule: (tenant as any).strategy },
       aSites,
       bSites,
       orders,
       quotas: PLAN_QUOTAS[(tenant as any).plan || 'free'],
       apiNodes: activeApiNodes
    });
  });

  app.put('/api/tenants/:id', requireAuth, (req: any, res: any) => {
    const { strategy, roundRobinIndex, expiresAt, active, plan } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    
    if (strategy !== undefined) { updates.push('strategy = ?'); values.push(strategy); }
    if (roundRobinIndex !== undefined) { updates.push('roundRobinIndex = ?'); values.push(roundRobinIndex); }
    if (expiresAt !== undefined) { updates.push('expiresAt = ?'); values.push(expiresAt); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
    if (plan !== undefined) { updates.push('plan = ?'); values.push(plan); }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  });

  app.post('/api/asites', requireAuth, (req: any, res: any) => {
    const { id, name, domain, api_key } = req.body;
    const tenantId = req.user.uid;

    const tenant = db.prepare('SELECT plan FROM tenants WHERE id = ?').get(tenantId) as any;
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM a_sites WHERE tenantId = ?').get(tenantId) as any;
    
    const quota = PLAN_QUOTAS[tenant.plan || 'free']?.aSites || 1;
    if (currentCount.count >= quota) {
      return res.status(403).json({ error: `Quota exceeded. Your current plan (${tenant.plan}) allows only ${quota} A Site(s).` });
    }

    db.prepare('INSERT INTO a_sites (id, tenantId, name, domain, api_key) VALUES (?, ?, ?, ?, ?)')
      .run(id, tenantId, name, domain, api_key);
    res.json({ success: true });
  });

  app.delete('/api/asites/:id', requireAuth, (req: any, res: any) => {
    db.prepare('DELETE FROM a_sites WHERE id = ? AND tenantId = ?').run(req.params.id, req.user.uid);
    res.json({ success: true });
  });

  app.post('/api/bsites', requireAuth, (req: any, res: any) => {
    const { id, name, domain, weight } = req.body;
    const tenantId = req.user.uid;

    const tenant = db.prepare('SELECT plan FROM tenants WHERE id = ?').get(tenantId) as any;
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM b_sites WHERE tenantId = ?').get(tenantId) as any;
    
    const quota = PLAN_QUOTAS[tenant.plan || 'free']?.bSites || 1;
    if (currentCount.count >= quota) {
      return res.status(403).json({ error: `Quota exceeded. Your current plan (${tenant.plan}) allows only ${quota} B Site(s).` });
    }

    db.prepare('INSERT INTO b_sites (id, tenantId, name, domain, active, weight) VALUES (?, ?, ?, ?, 1, ?)')
      .run(id, tenantId, name, domain, weight || 1);
    res.json({ success: true });
  });

  app.put('/api/bsites/:id', requireAuth, (req: any, res: any) => {
    const { active, weight } = req.body;
    const updates = [];
    const values = [];
    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }
    if (weight !== undefined) {
      updates.push('weight = ?');
      values.push(weight);
    }
    if (updates.length > 0) {
      values.push(req.params.id, req.user.uid);
      db.prepare(`UPDATE b_sites SET ${updates.join(', ')} WHERE id = ? AND tenantId = ?`)
        .run(...values);
    }
    res.json({ success: true });
  });

  app.delete('/api/bsites/:id', requireAuth, (req: any, res: any) => {
    db.prepare('DELETE FROM b_sites WHERE id = ? AND tenantId = ?').run(req.params.id, req.user.uid);
    res.json({ success: true });
  });

  app.post('/api/orders', requireAuth, (req: any, res: any) => {
     // For simulator usage by users
     const order = req.body;
     db.prepare(`
       INSERT INTO orders (sysOrderId, tenantId, aSiteId, aSiteOrderId, bSiteId, bSiteOrderId, amount, currency, status, syncToAStatus, syncToBStatus, createdAt, returnUrl, paymentUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     `).run(
       order.sysOrderId, req.user.uid, order.aSiteId, order.aSiteOrderId, order.bSiteId, order.bSiteOrderId, 
       order.amount, order.currency, order.status, order.syncToAStatus, order.syncToBStatus, order.createdAt, order.returnUrl || null, order.paymentUrl || null
     );
     res.json({ success: true });
  });
  
  app.put('/api/orders/:sysOrderId', requireAuth, (req: any, res: any) => {
     const status = req.body.status;
     db.prepare('UPDATE orders SET status = ? WHERE sysOrderId = ? AND tenantId = ?')
       .run(status, req.params.sysOrderId, req.user.uid);
     res.json({ success: true });
  });

  // --- Admin APIs ---
  app.get('/api/admin/tenants', requireAuth, requireAdmin, (req: any, res: any) => {
    const tenants = db.prepare('SELECT * FROM tenants').all();
    res.json(tenants);
  });

  app.post('/api/admin/tenants', requireAuth, requireAdmin, (req: any, res: any) => {
     const tempUid = 'sys_' + crypto.randomBytes(5).toString('hex');
     db.prepare(`
         INSERT INTO tenants (id, email, strategy, roundRobinIndex, apiKey, active, expiresAt, plan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       `).run(tempUid, req.body.email, req.body.strategy || 'random', req.body.roundRobinIndex || 0, req.body.apiKey || 'sk_' + crypto.randomBytes(4).toString('hex'), req.body.active ? 1 : 0, req.body.expiresAt, req.body.plan || 'free');
     res.json({ success: true });
  });

  app.delete('/api/admin/tenants/:id', requireAuth, requireAdmin, (req: any, res: any) => {
     const id = req.params.id;
     db.prepare('DELETE FROM a_sites WHERE tenantId = ?').run(id);
     db.prepare('DELETE FROM b_sites WHERE tenantId = ?').run(id);
     db.prepare('DELETE FROM orders WHERE tenantId = ?').run(id);
     db.prepare('DELETE FROM tenants WHERE id = ?').run(id);
     res.json({ success: true });
  });

  app.get('/api/admin/fraud-rules', requireAuth, requireAdmin, (req: any, res: any) => {
     const rules = db.prepare('SELECT * FROM fraud_rules ORDER BY createdAt DESC').all();
     res.json(rules);
  });

  app.post('/api/admin/fraud-rules', requireAuth, requireAdmin, (req: any, res: any) => {
     const { keyword, type, description } = req.body;
     if (!keyword) return res.status(400).json({ error: 'Keyword is required' });
     try {
       const id = 'fr_' + Math.random().toString(36).substring(2, 9);
       db.prepare('INSERT INTO fraud_rules (id, keyword, type, description, active, createdAt) VALUES (?, ?, ?, ?, 1, ?)').run(id, keyword.toLowerCase(), type || 'keyword', description || '', new Date().toISOString());
       res.json({ id, keyword, type, description, active: 1 });
     } catch (err: any) {
       res.status(500).json({ error: 'Failed to add rule (might be duplicate)' });
     }
  });

  app.delete('/api/admin/fraud-rules/:id', requireAuth, requireAdmin, (req: any, res: any) => {
     db.prepare('DELETE FROM fraud_rules WHERE id = ?').run(req.params.id);
     res.json({ success: true });
  });

  app.put('/api/admin/fraud-rules/:id/toggle', requireAuth, requireAdmin, (req: any, res: any) => {
     const { active } = req.body;
     db.prepare('UPDATE fraud_rules SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
     res.json({ success: true });
  });

  app.get('/api/admin/api-nodes', requireAuth, requireAdmin, (req: any, res: any) => {
     const nodes = db.prepare('SELECT * FROM api_nodes').all();
     res.json(nodes);
  });

  app.post('/api/admin/api-nodes', requireAuth, requireAdmin, (req: any, res: any) => {
     let { url } = req.body;
     if (!url) return res.status(400).json({ error: 'URL is required' });
     
     // Trim trailing slash for consistency
     url = url.replace(/\/+$/, '');

     try {
       const id = 'node_' + Math.random().toString(36).substring(2, 9);
       db.prepare('INSERT INTO api_nodes (id, url, active, status, last_check) VALUES (?, ?, 1, ?, ?)').run(id, url, 'pending', new Date().toISOString());
       res.json({ success: true });
     } catch (err: any) {
       res.status(500).json({ error: 'Failed to add node (might be duplicate)' });
     }
  });

  app.delete('/api/admin/api-nodes/:id', requireAuth, requireAdmin, (req: any, res: any) => {
     db.prepare('DELETE FROM api_nodes WHERE id = ?').run(req.params.id);
     res.json({ success: true });
  });

  app.put('/api/admin/api-nodes/:id/toggle', requireAuth, requireAdmin, (req: any, res: any) => {
     const { active } = req.body;
     db.prepare('UPDATE api_nodes SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
     res.json({ success: true });
  });

  app.post('/api/admin/api-nodes/:id/check', requireAuth, requireAdmin, async (req: any, res: any) => {
      const node = db.prepare('SELECT * FROM api_nodes WHERE id = ?').get(req.params.id) as any;
      if (!node) return res.status(404).json({ error: 'Node not found' });
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const checkRes = await fetch(`${node.url}/api/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const isOk = checkRes.ok;
        const status = isOk ? 'healthy' : 'error';
        const lastCheck = new Date().toISOString();
        db.prepare('UPDATE api_nodes SET status = ?, last_check = ? WHERE id = ?').run(status, lastCheck, node.id);
        res.json({ success: true, status, last_check: lastCheck });
      } catch (err) {
        const lastCheck = new Date().toISOString();
        db.prepare('UPDATE api_nodes SET status = ?, last_check = ? WHERE id = ?').run('error', lastCheck, node.id);
        res.json({ success: true, status: 'error', last_check: lastCheck });
      }
  });

  app.get('/api/admin/settings', requireAuth, requireAdmin, async (req: any, res: any) => {
     const settings = db.prepare('SELECT * FROM system_settings').all();
     res.json(settings);
  });

  app.post('/api/admin/settings', requireAuth, requireAdmin, async (req: any, res: any) => {
     const settings = req.body; // Array of {key, value}
     const insert = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
     const transaction = db.transaction((data) => {
       for (const item of data) {
         insert.run(item.key, item.value);
       }
     });
     transaction(settings);
     res.json({ success: true });
  });

  // --- Public Gateway APIs ---

  // Mock Request from A Site Plugin (WooCommerce / Custom)
  app.post('/api/gateway/checkout', (req, res) => {
    console.log('[GATEWAY] Incoming checkout request from:', req.ip);
    console.log('[GATEWAY] Request Body:', JSON.stringify(req.body));
    
    try {
      const { api_key, order_id, amount, currency, items, return_url } = req.body;
      
      if (!api_key) {
        console.error('[GATEWAY] Missing api_key in request');
        return res.status(400).json({ error: 'api_key is required' });
      }

      const aSiteRow = db.prepare('SELECT * FROM a_sites WHERE api_key = ?').get(api_key) as any;
      if (!aSiteRow) {
        console.error('[GATEWAY] Unauthorized A Site API Key:', api_key);
        return res.status(401).json({ error: 'Unauthorized A Site API Key' });
      }
      
      const tenantRow = db.prepare('SELECT * FROM tenants WHERE id = ? AND active = 1').get(aSiteRow.tenantId) as any;
      if (!tenantRow) {
        console.error('[GATEWAY] Invalid or inactive tenant for merchant ID:', aSiteRow.tenantId);
        return res.status(401).json({ error: 'Invalid or inactive tenant configuration' });
      }
      
      const isExpired = tenantRow.expiresAt && new Date(tenantRow.expiresAt).getTime() < Date.now();
      if (isExpired) {
        console.error('[GATEWAY] Tenant subscription expired for:', tenantRow.email);
        return res.status(401).json({ error: 'Tenant subscription expired' });
      }

      const activeBSites = db.prepare('SELECT * FROM b_sites WHERE tenantId = ? AND active = 1').all(tenantRow.id) as any[];
      if (activeBSites.length === 0) {
        console.error('[GATEWAY] No active B Sites available for tenant:', tenantRow.id);
        return res.status(500).json({ error: 'No active B Sites available for routing.' });
      }
      
      let bSite;
      if (tenantRow.strategy === 'round_robin') {
        let index = tenantRow.roundRobinIndex || 0;
        bSite = activeBSites[index % activeBSites.length];
        db.prepare('UPDATE tenants SET roundRobinIndex = ? WHERE id = ?').run(index + 1, tenantRow.id);
        console.log('[GATEWAY] Strategy: Round Robin. Selected B Site:', bSite.domain);
      } else if (tenantRow.strategy === 'weighted') {
        const totalWeight = activeBSites.reduce((sum, site) => sum + (site.weight || 1), 0);
        let randWeight = Math.random() * totalWeight;
        for (const site of activeBSites) {
          randWeight -= (site.weight || 1);
          if (randWeight <= 0) {
            bSite = site;
            break;
          }
        }
        if (!bSite) bSite = activeBSites[0];
        console.log('[GATEWAY] Strategy: Weighted. Selected B Site:', bSite.domain);
      } else {
        bSite = activeBSites[Math.floor(Math.random() * activeBSites.length)];
        console.log('[GATEWAY] Strategy: Random. Selected B Site:', bSite.domain);
      }
      
      const sysOrderId = 'sys_' + crypto.randomBytes(6).toString('hex');
      const bSiteOrderId = 'ext_' + crypto.randomBytes(4).toString('hex');
      
      const host = req.get('host');
      const protocol = req.protocol || 'https';
      const routerReturnUrl = `${protocol}://${host}/api/gateway/return/${sysOrderId}`;
      const routerCancelUrl = `${protocol}://${host}/api/gateway/cancel/${sysOrderId}`;
      const returnUrlParams = `&return_url=${encodeURIComponent(routerReturnUrl)}&cancel_url=${encodeURIComponent(routerCancelUrl)}`;
      const targetBUrl = `https://${bSite.domain}/?vortexpay_sys_id=${sysOrderId}&amount=${amount}${returnUrlParams}`;
      const jumpUrl = `${protocol}://${host}/api/gateway/jump/${sysOrderId}`;
      
      db.prepare(`
        INSERT INTO orders (sysOrderId, tenantId, aSiteId, aSiteOrderId, bSiteId, bSiteOrderId, amount, currency, status, syncToAStatus, syncToBStatus, createdAt, returnUrl, paymentUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sysOrderId, tenantRow.id, aSiteRow.id, String(order_id), bSite.id, bSiteOrderId, amount, currency || 'USD', 'pending', 'pending', 'pending', new Date().toISOString(), return_url || null, targetBUrl);
      
      console.log('[GATEWAY] Success. Created order:', sysOrderId, 'Redirecting to:', jumpUrl);
      res.json({ success: true, paymentUrl: jumpUrl, sysOrderId });
    } catch (err: any) {
      console.error('[GATEWAY] Critical Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Cancel handling from B Site
  app.get('/api/gateway/cancel/:sysOrderId', (req, res) => {
    try {
      const sysOrderId = req.params.sysOrderId;
      const order = db.prepare('SELECT returnUrl FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      if (order && order.returnUrl) {
         try {
           const finalUrl = new URL(order.returnUrl);
           finalUrl.searchParams.append('vortex_cancel', '1');
           for (const [key, value] of Object.entries(req.query)) {
             finalUrl.searchParams.append(key, value as string);
           }
           return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Cancelling order...</title>
              <meta charset="utf-8">
              <meta name="referrer" content="no-referrer">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta http-equiv="refresh" content="3;url=${finalUrl.toString()}">
              <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    background: #f4f5f7; 
                    color: #111827; 
                    margin: 0;
                  }
                  .container {
                    text-align: center;
                    background: white;
                    padding: 40px 32px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    max-width: 420px;
                    width: 90%;
                  }
                  .icon-box {
                    width: 64px;
                    height: 64px;
                    background-color: #f3f4f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    color: #4b5563;
                  }
                  .icon-cancel {
                    width: 32px;
                    height: 32px;
                  }
                  h1 {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 8px;
                    color: #111827;
                  }
                  p {
                    font-size: 15px;
                    font-weight: 400;
                    color: #6b7280;
                    margin: 0 0 32px;
                    line-height: 1.5;
                  }
                  .spinner {
                    width: 24px;
                    height: 24px;
                    color: #9ca3af;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                  }
                  @keyframes spin {
                    100% { transform: rotate(360deg); }
                  }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon-box">
                  <svg class="icon-cancel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <h1>Payment Cancelled</h1>
                <p>Safely returning you to your shopping cart to review your order...</p>
                <svg class="spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
            </body>
            </html>
           `);
         } catch(e) {}
      }
      res.redirect('/');
    } catch(err) {
      res.status(500).send('Error');
    }
  });

  // Return handling from B Site
  app.get('/api/gateway/return/:sysOrderId', (req, res) => {
    try {
      const sysOrderId = req.params.sysOrderId;
      const order = db.prepare('SELECT returnUrl FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      if (order && order.returnUrl) {
         try {
           const finalUrl = new URL(order.returnUrl);
           for (const [key, value] of Object.entries(req.query)) {
             finalUrl.searchParams.append(key, value as string);
           }
           
           // Return an HTML jump page that strips referer before going back to A Site
           return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Returning to store...</title>
              <meta charset="utf-8">
              <meta name="referrer" content="no-referrer">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta http-equiv="refresh" content="3;url=${finalUrl.toString()}">
              <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    background: #f4f5f7; 
                    color: #111827; 
                    margin: 0;
                  }
                  .container {
                    text-align: center;
                    background: white;
                    padding: 40px 32px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    max-width: 420px;
                    width: 90%;
                  }
                  .check-icon {
                    color: #10b981;
                    width: 56px;
                    height: 56px;
                    margin: 0 auto 20px;
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    opacity: 0;
                    transform: scale(0.5);
                  }
                  h1 {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0 0 12px;
                    color: #0f172a;
                  }
                  p {
                    font-size: 15px;
                    color: #64748b;
                    margin: 0 0 24px;
                    line-height: 1.5;
                  }
                  @keyframes popIn {
                    to { transform: scale(1); opacity: 1; }
                  }
                  .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid #10b981;
                    border-radius: 50%;
                    margin: 0 auto;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
              </style>
            </head>
            <body>
              <div class="container">
                <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h1>Transaction Complete</h1>
                <p>Securely returning you to the merchant...</p>
                <div class="spinner"></div>
              </div>
              <script>
                setTimeout(function() {
                    window.location.replace("${finalUrl.toString()}");
                }, 1800);
              </script>
            </body>
            </html>
          `);
         } catch (e) {
           return res.redirect(order.returnUrl);
         }
      }
      // If A site didn't provide a returnUrl, just show a simple success message
      res.send('Payment process completed. You may close this window.');
    } catch (err) {
      console.error('[GATEWAY] Error handling return:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  // Helper to check for blacklisted ASNs/IPs
  const checkIPBlacklist = async (ip: string) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) return false;
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,isp,org,as`);
      const data = await res.json() as any;
      if (data.status === 'success') {
        const searchStr = `${data.org || ''} ${data.as || ''} ${data.isp || ''}`.toLowerCase();
        
        // Fetch active rules from DB
        const rules = db.prepare('SELECT keyword FROM fraud_rules WHERE active = 1').all() as any[];
        const blockedKeywords = rules.map(r => r.keyword);
        
        // Fallback default rules if none are configured yet, to prevent sudden drop in protection
        if (blockedKeywords.length === 0) {
           blockedKeywords.push('paypal', 'stripe', 'google', 'amazon', 'aws', 'microsoft', 'azure', 'digitalocean', 'ovh', 'fortinet', 'palo alto', 'datacenter', 'hosting', 'alibaba', 'tencent', 'spider', 'bot');
        }

        for (const keyword of blockedKeywords) {
          if (searchStr.includes(keyword)) {
            console.log(`[Fraud Block] IP ${ip} matched keyword ${keyword}: ${searchStr}`);
            return true;
          }
        }
      }
    } catch (e) {
      console.error('IP Blacklist check failed:', e);
    }
    return false;
  };

  // Jump page to strip referer
  app.get('/api/gateway/jump/:sysOrderId', async (req, res) => {
    try {
      const sysOrderId = req.params.sysOrderId;
      const order = db.prepare('SELECT paymentUrl, amount, currency FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      
      if (!order || !order.paymentUrl) {
         return res.status(404).send('Order not found');
      }

      // IP / ASN Blacklist fraud check
      const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
      const isFraud = await checkIPBlacklist(clientIp);

      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: order.currency || 'USD'
      });
      const formattedTotal = formatter.format(order.amount || 0);

      if (isFraud) {
         return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Security Alert</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                  body { font-family: -apple-system, system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fef2f2; color: #7f1d1d; margin: 0; }
                  .container { text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; width: 90%; border: 1px solid #fecaca; }
                  .icon { color: #ef4444; width: 56px; height: 56px; margin: 0 auto 24px; }
                  h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px; }
                  p { font-size: 15px; color: #991b1b; line-height: 1.5; margin: 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h1>Suspicious Payment Request Blocked</h1>
                <p>Your connection has been flagged by our security systems as suspicious. The transaction cannot proceed.</p>
              </div>
            </body>
            </html>
         `);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Secure Checkout Processing</title>
          <meta charset="utf-8">
          <meta name="referrer" content="no-referrer">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #f8fafc; 
                color: #111827; 
                margin: 0;
              }
              .container {
                background: white;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                max-width: 400px;
                width: 90%;
                padding: 48px 32px;
                border-radius: 20px;
                text-align: center;
              }
              .shield-container {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f0fdf4;
                border-radius: 50%;
              }
              .shield-icon {
                color: #10b981;
                width: 40px;
                height: 40px;
                z-index: 2;
                transition: transform 0.5s ease;
              }
              .spinner-ring {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 3px solid #d1fae5;
                border-top-color: #10b981;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                box-sizing: border-box;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              h1 {
                font-size: 22px;
                font-weight: 700;
                margin: 0 0 12px;
                color: #111827;
              }
              .amount {
                font-size: 24px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 32px;
              }
              .status-container {
                position: relative;
                height: 24px;
                overflow: hidden;
                margin-bottom: 8px;
              }
              .status-text {
                font-size: 15px;
                color: #6b7280;
                font-weight: 500;
                position: absolute;
                width: 100%;
                text-align: center;
                transition: opacity 0.3s ease, transform 0.3s ease;
              }
              .status-text.entering {
                opacity: 0;
                transform: translateY(10px);
              }
              .status-text.active {
                opacity: 1;
                transform: translateY(0);
              }
              .status-text.exiting {
                opacity: 0;
                transform: translateY(-10px);
              }
              .encryption-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #f3f4f6;
                padding: 6px 12px;
                border-radius: 100px;
                font-size: 12px;
                font-weight: 600;
                color: #4b5563;
                margin-top: 32px;
              }
              .encryption-badge svg {
                width: 12px;
                height: 12px;
                color: #6b7280;
              }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="shield-container">
              <div class="spinner-ring" id="spinner"></div>
              <svg class="shield-icon" id="shield" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path id="check-path" d="M9 12l2 2 4-4" stroke-dasharray="20" stroke-dashoffset="20" style="transition: stroke-dashoffset 0.5s ease 0.5s;"></path>
              </svg>
            </div>
            <h1>Secure Checkout</h1>
            <div class="amount">${formattedTotal}</div>
            
            <div class="status-container" id="status-container">
              <div class="status-text active">Securing your connection...</div>
            </div>
            
            <div class="encryption-badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              256-bit TLS Encryption
            </div>
          </div>
          <script>
            const steps = [
              { text: "Securing your connection...", delay: 600 },
              { text: "Verifying merchant details...", delay: 800 },
              { text: "Analyzing risk profile...", delay: 900 },
              { text: "Processing secure token...", delay: 700 },
              { text: "Redirecting to checkout...", delay: 600, final: true }
            ];
            
            let currentStep = 0;
            const statusContainer = document.getElementById('status-container');
            const spinner = document.getElementById('spinner');
            const checkPath = document.getElementById('check-path');
            const shield = document.getElementById('shield');
            
            function updateStatus(text, isFinal) {
              const currentActive = statusContainer.querySelector('.active');
              if (currentActive) {
                currentActive.classList.replace('active', 'exiting');
                setTimeout(() => currentActive.remove(), 300);
              }
              
              const nextStatus = document.createElement('div');
              nextStatus.className = 'status-text entering';
              nextStatus.innerText = text;
              statusContainer.appendChild(nextStatus);
              
              // Trigger reflow
              void nextStatus.offsetWidth;
              nextStatus.classList.replace('entering', 'active');
              
              if (isFinal) {
                spinner.style.borderTopColor = '#d1fae5';
                spinner.style.animation = 'none';
                spinner.style.opacity = '0';
                shield.style.transform = 'scale(1.1)';
                checkPath.style.strokeDashoffset = '0';
              }
            }

            function runNextStep() {
              if (currentStep < steps.length - 1) {
                currentStep++;
                const step = steps[currentStep];
                updateStatus(step.text, step.final);
                
                let nextDelay = step.delay + (Math.floor(Math.random() * 200) - 100);
                setTimeout(runNextStep, nextDelay);
              } else {
                setTimeout(() => {
                  window.location.replace("${order.paymentUrl}");
                }, 800);
              }
            }
            
            setTimeout(runNextStep, steps[0].delay);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('[GATEWAY] Error generating jump page:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  // Mock Webhook from Payment Gateway hitting B Site
  app.post('/api/webhook/gateway', (req, res) => {
    console.log('[WEBHOOK] Received from B Site:', req.body);
    try {
      const { sysOrderId, status } = req.body; 
      const order = db.prepare('SELECT * FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      
      if(order) {
        db.prepare("UPDATE orders SET status = ?, syncToAStatus = 'syncing' WHERE sysOrderId = ?").run(status, sysOrderId);
        
        const aSite = db.prepare('SELECT * FROM a_sites WHERE id = ?').get(order.aSiteId) as any;
        if (aSite) {
          const aSiteWebhookUrl = `https://${aSite.domain}/wc-api/vortexpay_callback`;
          console.log('[WEBHOOK] Syncing to A Site:', aSiteWebhookUrl, { sysOrderId, order_id: order.aSiteOrderId, status });
          
          fetch(aSiteWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'VortexPay-Router/1.0' },
            body: JSON.stringify({
              sysOrderId: sysOrderId,
              order_id: order.aSiteOrderId,
              status: status
            })
          }).then(async r => {
             const respText = await r.text();
             console.log(`[WEBHOOK] A Site Response (${r.status}):`, respText);
             if (r.ok) {
               db.prepare("UPDATE orders SET syncToAStatus = 'synced' WHERE sysOrderId = ?").run(sysOrderId);
             } else {
               db.prepare("UPDATE orders SET syncToAStatus = 'failed' WHERE sysOrderId = ?").run(sysOrderId);
             }
          }).catch(err => {
             console.error('[WEBHOOK] Error syncing to A Site:', err.message);
             db.prepare("UPDATE orders SET syncToAStatus = 'failed' WHERE sysOrderId = ?").run(sysOrderId);
          });
        } else {
          console.error('[WEBHOOK] A Site not found for order:', sysOrderId);
        }
        
        res.json({ success: true, updated: true });
      } else {
        console.error('[WEBHOOK] Order not found for sysOrderId:', sysOrderId);
        res.status(404).json({ success: false, error: 'Order not found' });
      }
    } catch (err: any) {
      console.error('[WEBHOOK] Critical Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Mock Webhook from A Site
  app.post('/api/webhook/origin', (req, res) => {
    try {
      const { sysOrderId, status, source } = req.body; 
      if (source === 'router_sync') return res.json({ success: true, ignored: 'Prevented loop' });

      const order = db.prepare('SELECT * FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      
      if(order) {
        if (order.status === status) return res.json({ success: true, ignored: 'Status already matches' });

        db.prepare("UPDATE orders SET status = ?, syncToBStatus = 'syncing' WHERE sysOrderId = ?").run(status, sysOrderId);
        
        const bSite = db.prepare('SELECT * FROM b_sites WHERE id = ?').get(order.bSiteId) as any;
        if (bSite) {
          const bSiteWebhookUrl = `https://${bSite.domain}/wc-api/vortexpay_b_callback`;
          console.log('[WEBHOOK] Syncing to B Site:', bSiteWebhookUrl, { sysOrderId, order_id: order.bSiteOrderId, status });
          
          fetch(bSiteWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'VortexPay-Router/1.0' },
            body: JSON.stringify({
              sysOrderId: sysOrderId,
              order_id: order.bSiteOrderId,
              status: status
            })
          }).then(async r => {
             const respText = await r.text();
             console.log(`[WEBHOOK] B Site Response (${r.status}):`, respText);
             if (r.ok) {
               db.prepare("UPDATE orders SET syncToBStatus = 'synced' WHERE sysOrderId = ?").run(sysOrderId);
             } else {
               db.prepare("UPDATE orders SET syncToBStatus = 'failed' WHERE sysOrderId = ?").run(sysOrderId);
             }
          }).catch(err => {
             console.error('[WEBHOOK] Error syncing to B Site:', err.message);
             db.prepare("UPDATE orders SET syncToBStatus = 'failed' WHERE sysOrderId = ?").run(sysOrderId);
          });
        } else {
           console.error('[WEBHOOK] B Site not found for order:', sysOrderId);
        }
        
        res.json({ success: true, updated: true });
      } else {
        res.json({ success: false, error: 'Order not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Periodic API Nodes Health Check Every 1 Minute
  setInterval(async () => {
    try {
      const nodes = db.prepare('SELECT * FROM api_nodes WHERE active = 1').all() as any[];
      for (const node of nodes) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`${node.url}/api/health`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const status = res.ok ? 'healthy' : 'error';
          db.prepare('UPDATE api_nodes SET status = ?, last_check = ? WHERE id = ?').run(status, new Date().toISOString(), node.id);
        } catch (e) {
          db.prepare('UPDATE api_nodes SET status = ?, last_check = ? WHERE id = ?').run('error', new Date().toISOString(), node.id);
        }
      }
    } catch (e) {
      console.error('[SYSTEM] Error in API Node check interval', e);
    }
  }, 60000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
