const express = require('express');
const { db } = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const { successResponse, errorResponse, generateId } = require('../../utils/helpers');

const router = express.Router();

// All auditor routes require auth + auditor role
router.use(authMiddleware);
router.use(roleGuard('auditor', 'admin'));

// ===== Auditor Dashboard Stats =====
router.get('/dashboard', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
  const totalCases = db.prepare('SELECT COUNT(*) as count FROM support_cases').get();
  const openCases = db.prepare("SELECT COUNT(*) as count FROM support_cases WHERE status IN ('open', 'in_progress')").get();
  const resolvedCases = db.prepare("SELECT COUNT(*) as count FROM support_cases WHERE status = 'resolved'").get();
  const totalProjectGroups = db.prepare('SELECT COUNT(*) as count FROM project_groups').get();

  const casesByCategory = db.prepare(`
    SELECT category, COUNT(*) as count FROM support_cases GROUP BY category ORDER BY count DESC
  `).all();

  const casesByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM support_cases GROUP BY status ORDER BY count DESC
  `).all();

  const usersByRole = db.prepare(`
    SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC
  `).all();

  const recentCases = db.prepare(`
    SELECT sc.id, sc.title, sc.status, sc.priority, sc.category, sc.created_at,
           u.username, u.full_name, u.email
    FROM support_cases sc
    JOIN users u ON sc.user_id = u.id
    ORDER BY sc.created_at DESC LIMIT 10
  `).all();

  return res.json(successResponse({
    stats: {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalCases: totalCases.count,
      openCases: openCases.count,
      resolvedCases: resolvedCases.count,
      totalProjectGroups: totalProjectGroups.count,
    },
    charts: { casesByCategory, casesByStatus, usersByRole },
    recentCases,
  }));
});

// ===== All Support Cases (with user info) =====
router.get('/cases', (req, res) => {
  const { status, priority, category, search, user_id } = req.query;

  let query = `
    SELECT sc.*, u.username, u.full_name, u.email, u.role as user_role
    FROM support_cases sc
    JOIN users u ON sc.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND sc.status = ?'; params.push(status); }
  if (priority) { query += ' AND sc.priority = ?'; params.push(priority); }
  if (category) { query += ' AND sc.category = ?'; params.push(category); }
  if (user_id) { query += ' AND sc.user_id = ?'; params.push(user_id); }
  if (search) {
    query += ' AND (sc.title LIKE ? OR sc.description LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY sc.created_at DESC';
  const cases = db.prepare(query).all(...params);

  return res.json(successResponse(cases));
});

// ===== Single Case Detail (with messages and user info) =====
router.get('/cases/:id', (req, res) => {
  const { id } = req.params;

  const supportCase = db.prepare(`
    SELECT sc.*, u.username, u.full_name, u.email, u.role as user_role
    FROM support_cases sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.id = ?
  `).get(id);

  if (!supportCase) {
    return res.status(404).json(errorResponse('Case not found.', 404));
  }

  const messages = db.prepare(`
    SELECT cm.*, u.username, u.full_name, u.role
    FROM case_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.case_id = ?
    ORDER BY cm.created_at ASC
  `).all(id);

  // Log the audit view
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id)
      VALUES (?, ?, ?, 'view', 'support_case', ?)
    `).run(generateId(), req.user.id, req.user.role, id);
  } catch (e) { /* ignore log errors */ }

  return res.json(successResponse({ ...supportCase, messages }));
});

// ===== All Users List =====
router.get('/users', (req, res) => {
  const { role, search, is_active } = req.query;

  let query = 'SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at FROM users WHERE 1=1';
  const params = [];

  if (role) { query += ' AND role = ?'; params.push(role); }
  if (is_active !== undefined) { query += ' AND is_active = ?'; params.push(is_active); }
  if (search) {
    query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const users = db.prepare(query).all(...params);

  return res.json(successResponse(users));
});

// ===== User Detail with their cases =====
router.get('/users/:id', (req, res) => {
  const { id } = req.params;

  const user = db.prepare(`
    SELECT id, username, email, full_name, role, phone, company, is_active, last_login, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  if (!user) {
    return res.status(404).json(errorResponse('User not found.', 404));
  }

  const userCases = db.prepare(`
    SELECT id, title, status, priority, category, created_at, updated_at
    FROM support_cases WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(id);

  const userProjects = db.prepare(`
    SELECT id, name, status, region, environment, created_at
    FROM project_groups WHERE owner_id = ?
    ORDER BY created_at DESC
  `).all(id);

  return res.json(successResponse({ ...user, cases: userCases, projects: userProjects }));
});

// ===== Audit Logs =====
router.get('/logs', (req, res) => {
  const { action, target_type, actor_id } = req.query;

  let query = `
    SELECT al.*, u.username, u.full_name, u.role as actor_role_name
    FROM audit_logs al
    JOIN users u ON al.actor_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (action) { query += ' AND al.action = ?'; params.push(action); }
  if (target_type) { query += ' AND al.target_type = ?'; params.push(target_type); }
  if (actor_id) { query += ' AND al.actor_id = ?'; params.push(actor_id); }

  query += ' ORDER BY al.created_at DESC LIMIT 200';
  const logs = db.prepare(query).all(...params);

  return res.json(successResponse(logs));
});

module.exports = router;
