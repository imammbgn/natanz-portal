const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../data/natanz.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'support', 'auditor', 'admin')),
      avatar_url TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      region TEXT DEFAULT 'id-jakarta-1',
      environment TEXT DEFAULT 'production',
      tags TEXT DEFAULT '[]',
      resource_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS support_cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('general', 'technical', 'billing', 'account', 'security', 'service')),
      user_id TEXT NOT NULL,
      assigned_to TEXT,
      project_group_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (project_group_id) REFERENCES project_groups(id)
    );

    CREATE TABLE IF NOT EXISTS case_messages (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES support_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'system',
      command TEXT NOT NULL,
      parameters TEXT DEFAULT '[]',
      timeout INTEGER DEFAULT 30,
      is_dangerous INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS script_executions (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL,
      executed_by TEXT NOT NULL,
      parameters TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed', 'timeout')),
      output TEXT DEFAULT '',
      exit_code INTEGER,
      execution_time_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (script_id) REFERENCES scripts(id),
      FOREIGN KEY (executed_by) REFERENCES users(id)
    );
  `);

  seedDefaultAccounts();
  seedDefaultScripts();
}

function seedDefaultAccounts() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'auditor' LIMIT 1").get();
  if (existing) return;

  try {
    const auditorHash = bcrypt.hashSync('Auditor@2026\u0021', 12);
    db.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?, 'auditor')
    `).run('auditor-00000000-0000-0000-0000-000000000001', 'auditor.natanz', 'auditor@natanz.io', auditorHash, 'Natanz Auditor');

    const adminHash = bcrypt.hashSync('Admin@2026\u0021', 12);
    db.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?, 'admin')
    `).run('admin-00000000-0000-0000-0000-000000000001', 'admin.natanz', 'admin@natanz.io', adminHash, 'Natanz Administrator');

    console.log('[Natanz Cloud] Seeded default accounts:');
    console.log('  Auditor - auditor.natanz / Auditor@2026!');
    console.log('  Admin   - admin.natanz / Admin@2026!');
  } catch (err) {
    console.error('[Natanz Cloud] Seed error:', err.message);
  }
}

function seedDefaultScripts() {
  const existing = db.prepare("SELECT id FROM scripts LIMIT 1").get();
  if (existing) return;

  const adminId = 'admin-00000000-0000-0000-0000-000000000001';
  const scripts = [
    { name: 'System Health Check', description: 'Check CPU, memory, disk, and overall system health', category: 'monitoring', command: 'system_health', is_dangerous: 0 },
    { name: 'Network Status', description: 'Check network interfaces, connectivity, and latency', category: 'network', command: 'network_status', is_dangerous: 0 },
    { name: 'Service Status', description: 'List all running services and their current status', category: 'system', command: 'list_services', is_dangerous: 0 },
    { name: 'Disk Usage', description: 'Show disk usage across all mounted volumes', category: 'monitoring', command: 'disk_usage', is_dangerous: 0 },
    { name: 'Log Analysis', description: 'Analyze recent system logs for errors and warnings', category: 'monitoring', command: 'log_analysis', is_dangerous: 0 },
  ];

  const insert = db.prepare(`
    INSERT INTO scripts (id, name, description, category, command, is_dangerous, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const { generateId } = require('../utils/helpers');
  for (const s of scripts) {
    insert.run(generateId(), s.name, s.description, s.category, s.command, s.is_dangerous, adminId);
  }

  console.log(`[Natanz Cloud] Seeded ${scripts.length} default scripts.`);
}

module.exports = { db, initDatabase };
