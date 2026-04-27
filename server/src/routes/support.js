const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateId, successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/cases', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { status, priority, category } = req.query;

  let query = 'SELECT * FROM support_cases WHERE user_id = ?';
  const params = [userId];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (category) { query += ' AND category = ?'; params.push(category); }

  query += ' ORDER BY created_at DESC';
  const cases = db.prepare(query).all(...params);

  return res.json(successResponse(cases));
});

router.get('/cases/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const supportCase = db.prepare('SELECT * FROM support_cases WHERE id = ? AND user_id = ?').get(id, userId);
  if (!supportCase) {
    return res.status(404).json(errorResponse('Support case not found.', 404));
  }

  const messages = db.prepare(`
    SELECT cm.*, u.username, u.full_name, u.role
    FROM case_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.case_id = ?
    ORDER BY cm.created_at ASC
  `).all(id);

  return res.json(successResponse({ ...supportCase, messages }));
});

router.post('/cases', authMiddleware, (req, res) => {
  const { title, description, priority, category, project_group_id } = req.body;

  if (!title || !description) {
    return res.status(400).json(errorResponse('Title and description are required.'));
  }

  const id = generateId();

  try {
    db.prepare(`
      INSERT INTO support_cases (id, title, description, priority, category, user_id, project_group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, priority || 'medium', category || 'general', req.user.id, project_group_id || null);

    const supportCase = db.prepare('SELECT * FROM support_cases WHERE id = ?').get(id);
    return res.status(201).json(successResponse(supportCase, 'Support case created.'));
  } catch (err) {
    return res.status(500).json(errorResponse('Failed to create support case.', 500));
  }
});

router.post('/cases/:id/messages', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json(errorResponse('Message is required.'));
  }

  const supportCase = db.prepare('SELECT * FROM support_cases WHERE id = ? AND user_id = ?').get(id, userId);
  if (!supportCase) {
    return res.status(404).json(errorResponse('Support case not found.', 404));
  }

  const msgId = generateId();
  db.prepare(`
    INSERT INTO case_messages (id, case_id, user_id, message)
    VALUES (?, ?, ?, ?)
  `).run(msgId, id, userId, message.trim());

  db.prepare("UPDATE support_cases SET updated_at = datetime('now') WHERE id = ?").run(id);

  const msg = db.prepare(`
    SELECT cm.*, u.username, u.full_name, u.role
    FROM case_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.id = ?
  `).get(msgId);

  return res.status(201).json(successResponse(msg, 'Message sent.'));
});

module.exports = router;
