const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { db } = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const { successResponse, errorResponse, generateId } = require('../../utils/helpers');

const router = express.Router();
router.use(authMiddleware, roleGuard('admin'));

// ===== ADMIN DASHBOARD =====
router.get('/dashboard', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalCases = db.prepare('SELECT COUNT(*) as c FROM support_cases').get().c;
  const totalProjects = db.prepare('SELECT COUNT(*) as c FROM project_groups').get().c;
  const totalScripts = db.prepare('SELECT COUNT(*) as c FROM scripts').get().c;
  const totalExecutions = db.prepare('SELECT COUNT(*) as c FROM script_executions').get().c;
  const openCases = db.prepare("SELECT COUNT(*) as c FROM support_cases WHERE status IN ('open','in_progress')").get().c;

  const usersByRole = db.prepare('SELECT role, COUNT(*) as c FROM users GROUP BY role').all();
  const recentUsers = db.prepare('SELECT id, username, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
  const recentExecutions = db.prepare(`
    SELECT se.id, se.status, se.output, se.exit_code, se.execution_time_ms, se.created_at,
           s.name as script_name, s.category, u.username
    FROM script_executions se
    JOIN scripts s ON se.script_id = s.id
    JOIN users u ON se.executed_by = u.id
    ORDER BY se.created_at DESC LIMIT 10
  `).all();

  return res.json(successResponse({
    stats: { totalUsers, totalCases, totalProjects, totalScripts, totalExecutions, openCases },
    usersByRole,
    recentUsers,
    recentExecutions,
  }));
});

// ===== USER MANAGEMENT =====
router.get('/users', (req, res) => {
  const { role, search, is_active } = req.query;
  let q = 'SELECT id, username, email, full_name, role, is_active, phone, company, last_login, created_at, updated_at FROM users WHERE 1=1';
  const p = [];
  if (role) { q += ' AND role = ?'; p.push(role); }
  if (is_active !== undefined) { q += ' AND is_active = ?'; p.push(Number(is_active)); }
  if (search) { q += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  q += ' ORDER BY created_at DESC';

  const users = db.prepare(q).all(...p);
  return res.json(successResponse(users));
});

router.put('/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const validRoles = ['customer', 'support', 'auditor', 'admin'];
  if (!validRoles.includes(role)) return res.status(400).json(errorResponse('Invalid role.'));

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json(errorResponse('User not found.'));

  if (user.id === req.user.id) return res.status(400).json(errorResponse('Cannot change your own role.'));

  db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, id);

  // Audit log
  db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, details)
    VALUES (?, ?, ?, 'role_change', 'user', ?, ?)`).run(
    generateId(), req.user.id, req.user.role, id, JSON.stringify({ from: user.role, to: role })
  );

  const updated = db.prepare('SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
  return res.json(successResponse(updated, `User role changed to ${role}.`));
});

router.put('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== 'number' || ![0, 1].includes(is_active)) return res.status(400).json(errorResponse('Invalid status.'));

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json(errorResponse('User not found.'));
  if (user.id === req.user.id) return res.status(400).json(errorResponse('Cannot change your own status.'));

  db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(is_active, id);

  db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, details)
    VALUES (?, ?, ?, 'status_change', 'user', ?, ?)`).run(
    generateId(), req.user.id, req.user.role, id, JSON.stringify({ is_active })
  );

  const updated = db.prepare('SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
  return res.json(successResponse(updated, `User ${is_active ? 'activated' : 'deactivated'}.`));
});

// ===== SCRIPTS =====
router.get('/scripts', (req, res) => {
  const { category } = req.query;
  let q = 'SELECT * FROM scripts ORDER BY name ASC';
  const p = [];
  if (category) { q = 'SELECT * FROM scripts WHERE category = ? ORDER BY name ASC'; p.push(category); }

  const scripts = db.prepare(q).all(...p);
  return res.json(successResponse(scripts));
});

router.post('/scripts', (req, res) => {
  const { name, description, category, command, timeout, is_dangerous } = req.body;
  if (!name || !command) return res.status(400).json(errorResponse('Name and command are required.'));

  const id = generateId();
  db.prepare(`INSERT INTO scripts (id, name, description, category, command, timeout, is_dangerous, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, name, description || '', category || 'custom', command, timeout || 30, is_dangerous ? 1 : 0, req.user.id
  );

  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
  return res.status(201).json(successResponse(script, 'Script created.'));
});

router.delete('/scripts/:id', (req, res) => {
  const { id } = req.params;
  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
  if (!script) return res.status(404).json(errorResponse('Script not found.'));

  db.prepare('DELETE FROM script_executions WHERE script_id = ?').run(id);
  db.prepare('DELETE FROM scripts WHERE id = ?').run(id);
  return res.json(successResponse(null, 'Script deleted.'));
});

// ===== SCRIPT EXECUTION =====
router.post('/scripts/:id/execute', (req, res) => {
  const { id } = req.params;
  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
  if (!script) return res.status(404).json(errorResponse('Script not found.'));

  const execId = generateId();

  // Create execution record
  db.prepare(`INSERT INTO script_executions (id, script_id, executed_by, parameters, status)
    VALUES (?, ?, ?, ?, 'running')`).run(
    execId, id, req.user.id, JSON.stringify(req.body.parameters || {})
  );

  // Simulate script execution (lab environment)
  const result = simulateExecution(script);
  const execTime = Math.floor(Math.random() * 2000) + 200;

  db.prepare(`UPDATE script_executions SET status = ?, output = ?, exit_code = ?, execution_time_ms = ? WHERE id = ?`).run(
    result.exitCode === 0 ? 'completed' : 'failed', result.output, result.exitCode, execTime, execId
  );

  // Audit log
  db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, details)
    VALUES (?, ?, ?, 'execute', 'script', ?, ?)`).run(
    generateId(), req.user.id, req.user.role, id, JSON.stringify({ scriptName: script.name, status: result.exitCode === 0 ? 'completed' : 'failed' })
  );

  const execution = db.prepare(`
    SELECT se.*, s.name as script_name FROM script_executions se
    JOIN scripts s ON se.script_id = s.id WHERE se.id = ?
  `).get(execId);

  return res.json(successResponse(execution, 'Script executed.'));
});

router.get('/executions', (req, res) => {
  const { status, script_id } = req.query;
  let q = `SELECT se.*, s.name as script_name, s.category, u.username
    FROM script_executions se
    JOIN scripts s ON se.script_id = s.id
    JOIN users u ON se.executed_by = u.id WHERE 1=1`;
  const p = [];
  if (status) { q += ' AND se.status = ?'; p.push(status); }
  if (script_id) { q += ' AND se.script_id = ?'; p.push(script_id); }
  q += ' ORDER BY se.created_at DESC LIMIT 100';

  const executions = db.prepare(q).all(...p);
  return res.json(successResponse(executions));
});

// ===== Script execution simulator =====
function simulateExecution(script) {
  const outputs = {
    system_health: { exitCode: 0, output: `System Health Report - ${new Date().toISOString()}\n==========================================\nCPU Usage:    ${(Math.random()*40+10).toFixed(1)}%\nMemory Usage: ${(Math.random()*50+20).toFixed(1)}%\nDisk Usage:   ${(Math.random()*60+15).toFixed(1)}%\nLoad Average: ${(Math.random()*2+0.1).toFixed(2)}\nUptime:       ${Math.floor(Math.random()*90+1)} days\nStatus:       HEALTHY` },
    list_services: { exitCode: 0, output: `Active Services:\n  [RUNNING] natanz-api      (PID: ${1000+Math.floor(Math.random()*9000)})\n  [RUNNING] natanz-worker   (PID: ${1000+Math.floor(Math.random()*9000)})\n  [RUNNING] postgresql      (PID: ${1000+Math.floor(Math.random()*9000)})\n  [RUNNING] redis           (PID: ${1000+Math.floor(Math.random()*9000)})\n  [RUNNING] nginx           (PID: ${1000+Math.floor(Math.random()*9000)})\n  [STOPPED] legacy-service  (inactive)` },
    disk_usage: { exitCode: 0, output: `Filesystem      Size  Used  Avail Use%  Mounted\n/dev/sda1       100G   42G   58G  42%   /\n/dev/sdb1       500G  187G  313G  37%   /data\n/dev/sdc1        50G    8G   42G  16%   /backup\ntmpfs            16G  1.2G   15G   8%   /tmp` },
    network_status: { exitCode: 0, output: `Network Interfaces:\n  eth0: UP  (192.168.1.10/24)  RX: ${(Math.random()*100).toFixed(1)}GB  TX: ${(Math.random()*50).toFixed(1)}GB\n  eth1: UP  (10.0.0.5/24)     RX: ${(Math.random()*200).toFixed(1)}GB  TX: ${(Math.random()*80).toFixed(1)}GB\n\nConnectivity:\n  Gateway:     REACHABLE (1ms)\n  DNS:         REACHABLE (3ms)\n  natanz.io:   REACHABLE (12ms)\n  api.natanz:  REACHABLE (8ms)` },
    process_list: { exitCode: 0, output: `  PID  %CPU  %MEM  COMMAND\n  ${1000+Math.floor(Math.random()*9000)}  ${(Math.random()*15).toFixed(1)}  ${(Math.random()*8).toFixed(1)}  node src/index.js\n  ${1000+Math.floor(Math.random()*9000)}  ${(Math.random()*10).toFixed(1)}  ${(Math.random()*5).toFixed(1)}  postgres\n  ${1000+Math.floor(Math.random()*9000)}  ${(Math.random()*5).toFixed(1)}  ${(Math.random()*3).toFixed(1)}  redis-server\n  ${1000+Math.floor(Math.random()*9000)}  ${(Math.random()*3).toFixed(1)}  ${(Math.random()*2).toFixed(1)}  nginx: worker\n  ${1000+Math.floor(Math.random()*9000)}  ${(Math.random()*2).toFixed(1)}  ${(Math.random()*1).toFixed(1)}  cron` },
    firewall_rules: { exitCode: 0, output: `Chain INPUT (policy DROP)\n  ACCEPT tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:443\n  ACCEPT tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:80\n  ACCEPT tcp  --  10.0.0.0/8  0.0.0.0/0  tcp dpt:3001\n  ACCEPT icmp --  0.0.0.0/0  0.0.0.0/0\n\nChain OUTPUT (policy ACCEPT)\n  ACCEPT all  --  0.0.0.0/0  0.0.0.0/0\n\nTotal rules: 5` },
    restart_service: { exitCode: 0, output: `Restarting service...\n[OK] Stopped natanz-worker\n[OK] Started natanz-worker (PID: ${1000+Math.floor(Math.random()*9000)})\nService restart completed successfully.` },
    clear_cache: { exitCode: 0, output: `Clearing caches...\n  Application cache: CLEARED (freed ${(Math.random()*500+100).toFixed(0)}MB)\n  Redis cache:       CLEARED (freed ${(Math.random()*200+50).toFixed(0)}MB)\n  CDN cache:         PURGED\nCache clear completed.` },
    db_backup: { exitCode: 0, output: `Starting database backup...\nBackup file: /backup/natanz_${new Date().toISOString().replace(/[:.]/g,'-')}.sql\nSize: ${(Math.random()*500+100).toFixed(1)}MB\nCompression: gzip\nDuration: ${(Math.random()*10+2).toFixed(1)}s\nStatus: COMPLETED` },
    deploy_app: { exitCode: Math.random() > 0.15 ? 0 : 1, output: Math.random() > 0.15 ? `Deploying to production...\n  [1/4] Pulling latest image...     DONE\n  [2/4] Running migrations...        DONE\n  [3/4] Updating containers...       DONE\n  [4/4] Health check...              PASSED\nDeployment completed successfully.\nVersion: v${Math.floor(Math.random()*5)+1}.${Math.floor(Math.random()*20)}.${Math.floor(Math.random()*100)}` : `Deploying to production...\n  [1/4] Pulling latest image...     DONE\n  [2/4] Running migrations...        FAILED\n  Error: Migration timeout after 30s\n  Rollback initiated... COMPLETED` },
    ssl_check: { exitCode: 0, output: `SSL Certificate Report:\n  natanz.io:       VALID (expires in ${Math.floor(Math.random()*300+30)} days)\n  api.natanz.io:   VALID (expires in ${Math.floor(Math.random()*200+20)} days)\n  portal.natanz:   VALID (expires in ${Math.floor(Math.random()*150+15)} days)\n\nProtocol: TLSv1.3\nCipher:   TLS_AES_256_GCM_SHA384` },
    log_analysis: { exitCode: 0, output: `Log Analysis (last 24h):\n  Total entries: ${Math.floor(Math.random()*10000+1000)}\n  Errors:   ${Math.floor(Math.random()*20)}\n  Warnings: ${Math.floor(Math.random()*50+5)}\n  Info:     ${Math.floor(Math.random()*8000+500)}\n\nTop errors:\n  1. Connection timeout to redis (3 occurrences)\n  2. Rate limit exceeded on /api/auth (2 occurrences)\n\nNo critical issues detected.` },
  };

  if (outputs[script.command]) {
    return outputs[script.command];
  }
  // Default for custom scripts
  return { exitCode: 0, output: `Executed: ${script.command}\nStatus: OK\nTimestamp: ${new Date().toISOString()}` };
}

// ===== SANDBOXED CONSOLE (child_process isolation) =====
router.post('/console/run', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json(errorResponse('Code is required.'));
  }
  if (code.length > 10000) {
    return res.status(400).json(errorResponse('Code too long. Max 10000 chars.'));
  }

  const startTime = Date.now();

  // Spawn worker sebagai process terpisah.
  // Kenapa child_process, bukan inline vm?
  // - Kalau worker crash (segfault dari type confusion), server tetap jalan
  // - Resource isolation: memory/CPU terpisah dari Express process
  // - Player gak bisa crash server dan affect player lain
  const workerPath = path.join(__dirname, '..', '..', 'worker.js');
  const child = spawn('node', [workerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 12000,    // OS-level kill kalau node gak respond
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });

  // Kirim code ke worker via stdin
  child.stdin.write(JSON.stringify({ code }));
  child.stdin.end();

  child.on('close', (exitCode, signal) => {
    const execTime = Date.now() - startTime;

    // Worker crash (segfault, OOM, dll)
    if (signal === 'SIGKILL' || exitCode === null) {
      db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, details)
        VALUES (?, ?, ?, 'console_run', 'script', ?)`).run(
        generateId(), req.user.id, req.user.role,
        JSON.stringify({ code: code.slice(0, 300), execTime, success: false, crash: true })
      );
      return res.json(successResponse({
        output: `Process terminated (signal: ${signal || 'SIGKILL'})\nExecution timeout or memory exceeded.`,
        error: true,
        executionTime: execTime,
      }));
    }

    // Parse output dari worker
    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      // Worker output bukan JSON — kemungkinan uncaught error
      result = {
        output: stderr || stdout || 'Unknown error',
        error: true,
        executionTime: execTime,
      };
    }

    // Audit log
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, details)
      VALUES (?, ?, ?, 'console_run', 'script', ?)`).run(
      generateId(), req.user.id, req.user.role,
      JSON.stringify({ code: code.slice(0, 300), execTime, success: !result.error })
    );

    return res.json(successResponse({
      output: result.output,
      error: result.error,
      executionTime: execTime,
    }));
  });
});

module.exports = router;
