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
          INSERT INTO tenants (id, email, password, strategy, roundRobinIndex, apiKey, active, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tempUid, email, hashedPassword, 'random', 0, 'sk_admin_' + crypto.randomBytes(4).toString('hex'), 1, expiresAt);
        
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      try {
        db.prepare(`
          INSERT INTO tenants (id, email, password, strategy, roundRobinIndex, apiKey, active, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tempUid, email, hashedPassword, 'random', 0, 'sk_test_' + crypto.randomBytes(4).toString('hex'), 1, expiresAt);
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

  // Auth Middleware
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
    
    res.json({
       tenantConfig: tenant,
       pollingConfig: { rule: (tenant as any).strategy },
       aSites,
       bSites,
       orders
    });
  });

  app.put('/api/tenants/:id', requireAuth, (req: any, res: any) => {
    const { strategy, roundRobinIndex, expiresAt, active } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    
    if (strategy !== undefined) { updates.push('strategy = ?'); values.push(strategy); }
    if (roundRobinIndex !== undefined) { updates.push('roundRobinIndex = ?'); values.push(roundRobinIndex); }
    if (expiresAt !== undefined) { updates.push('expiresAt = ?'); values.push(expiresAt); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  });

  app.post('/api/asites', requireAuth, (req: any, res: any) => {
    const { id, name, domain, api_key } = req.body;
    db.prepare('INSERT INTO a_sites (id, tenantId, name, domain, api_key) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.uid, name, domain, api_key);
    res.json({ success: true });
  });

  app.delete('/api/asites/:id', requireAuth, (req: any, res: any) => {
    db.prepare('DELETE FROM a_sites WHERE id = ? AND tenantId = ?').run(req.params.id, req.user.uid);
    res.json({ success: true });
  });

  app.post('/api/bsites', requireAuth, (req: any, res: any) => {
    const { id, name, domain } = req.body;
    db.prepare('INSERT INTO b_sites (id, tenantId, name, domain, active) VALUES (?, ?, ?, ?, 1)')
      .run(id, req.user.uid, name, domain);
    res.json({ success: true });
  });

  app.put('/api/bsites/:id', requireAuth, (req: any, res: any) => {
    const { active } = req.body;
    db.prepare('UPDATE b_sites SET active = ? WHERE id = ? AND tenantId = ?')
      .run(active ? 1 : 0, req.params.id, req.user.uid);
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
       INSERT INTO orders (sysOrderId, tenantId, aSiteId, aSiteOrderId, bSiteId, bSiteOrderId, amount, currency, status, syncToAStatus, syncToBStatus, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     `).run(
       order.sysOrderId, req.user.uid, order.aSiteId, order.aSiteOrderId, order.bSiteId, order.bSiteOrderId, 
       order.amount, order.currency, order.status, order.syncToAStatus, order.syncToBStatus, order.createdAt
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
         INSERT INTO tenants (id, email, strategy, roundRobinIndex, apiKey, active, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
       `).run(tempUid, req.body.email, req.body.strategy, req.body.roundRobinIndex, req.body.apiKey, req.body.active ? 1 : 0, req.body.expiresAt);
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
    try {
      const { api_key, order_id, amount, currency, items } = req.body;
      
      const aSiteRow = db.prepare('SELECT * FROM a_sites WHERE api_key = ?').get(api_key) as any;
      if (!aSiteRow) return res.status(401).json({ error: 'Unauthorized A Site API Key' });
      
      const tenantRow = db.prepare('SELECT * FROM tenants WHERE id = ? AND active = 1').get(aSiteRow.tenantId) as any;
      if (!tenantRow) return res.status(401).json({ error: 'Invalid or inactive tenant configuration' });
      
      const isExpired = tenantRow.expiresAt && new Date(tenantRow.expiresAt).getTime() < Date.now();
      if (isExpired) return res.status(401).json({ error: 'Tenant subscription expired' });

      const activeBSites = db.prepare('SELECT * FROM b_sites WHERE tenantId = ? AND active = 1').all(tenantRow.id) as any[];
      if (activeBSites.length === 0) return res.status(500).json({ error: 'No active B Sites available for routing.' });
      
      let bSite;
      if (tenantRow.strategy === 'round_robin') {
        let index = tenantRow.roundRobinIndex || 0;
        bSite = activeBSites[index % activeBSites.length];
        db.prepare('UPDATE tenants SET roundRobinIndex = ? WHERE id = ?').run(index + 1, tenantRow.id);
      } else {
        bSite = activeBSites[Math.floor(Math.random() * activeBSites.length)];
      }
      
      const sysOrderId = 'sys_' + crypto.randomBytes(6).toString('hex');
      const bSiteOrderId = 'ext_' + crypto.randomBytes(4).toString('hex');
      
      db.prepare(`
        INSERT INTO orders (sysOrderId, tenantId, aSiteId, aSiteOrderId, bSiteId, bSiteOrderId, amount, currency, status, syncToAStatus, syncToBStatus, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sysOrderId, tenantRow.id, aSiteRow.id, String(order_id), bSite.id, bSiteOrderId, amount, currency || 'USD', 'pending', 'pending', 'pending', new Date().toISOString());
      
      const paymentUrl = `https://${bSite.domain}/secure-checkout?ref=${sysOrderId}`;
      res.json({ success: true, paymentUrl, sysOrderId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Mock Webhook from Payment Gateway hitting B Site
  app.post('/api/webhook/gateway', (req, res) => {
    try {
      const { sysOrderId, status } = req.body; 
      const order = db.prepare('SELECT * FROM orders WHERE sysOrderId = ?').get(sysOrderId) as any;
      
      if(order) {
        db.prepare("UPDATE orders SET status = ?, syncToAStatus = 'syncing' WHERE sysOrderId = ?").run(status, sysOrderId);
        
        setTimeout(() => {
           db.prepare("UPDATE orders SET syncToAStatus = 'synced' WHERE sysOrderId = ?").run(sysOrderId);
        }, 1500);
        
        res.json({ success: true, updated: true });
      } else {
        res.json({ success: false, error: 'Order not found' });
      }
    } catch (err) {
      console.error(err);
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
        
        setTimeout(() => {
           db.prepare("UPDATE orders SET syncToBStatus = 'synced' WHERE sysOrderId = ?").run(sysOrderId);
        }, 1500);
        
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
