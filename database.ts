import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Init schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    strategy TEXT,
    roundRobinIndex INTEGER,
    apiKey TEXT,
    active INTEGER DEFAULT 1,
    otpSecret TEXT,
    otpEnabled INTEGER DEFAULT 0,
    expiresAt TEXT
  );

  CREATE TABLE IF NOT EXISTS a_sites (
    id TEXT PRIMARY KEY,
    tenantId TEXT,
    name TEXT,
    domain TEXT,
    api_key TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY(tenantId) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS b_sites (
    id TEXT PRIMARY KEY,
    tenantId TEXT,
    name TEXT,
    domain TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY(tenantId) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    sysOrderId TEXT PRIMARY KEY,
    tenantId TEXT,
    aSiteId TEXT,
    aSiteOrderId TEXT,
    bSiteId TEXT,
    bSiteOrderId TEXT,
    amount REAL,
    currency TEXT,
    status TEXT,
    syncToAStatus TEXT,
    syncToBStatus TEXT,
    createdAt TEXT,
    returnUrl TEXT,
    paymentUrl TEXT,
    FOREIGN KEY(tenantId) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS fraud_rules (
    id TEXT PRIMARY KEY,
    keyword TEXT UNIQUE,
    type TEXT,
    description TEXT,
    active INTEGER DEFAULT 1,
    createdAt TEXT
  );
`);

const safeAlter = (query: string) => {
  try { db.exec(query); } catch(e) { }
};

safeAlter('ALTER TABLE tenants ADD COLUMN password TEXT');
safeAlter('ALTER TABLE tenants ADD COLUMN otpSecret TEXT');
safeAlter('ALTER TABLE tenants ADD COLUMN otpEnabled INTEGER DEFAULT 0');

safeAlter('ALTER TABLE tenants ADD COLUMN resetToken TEXT');
safeAlter('ALTER TABLE tenants ADD COLUMN resetTokenExpires TEXT');

safeAlter('ALTER TABLE orders ADD COLUMN returnUrl TEXT');
safeAlter('ALTER TABLE orders ADD COLUMN paymentUrl TEXT');

export default db;
