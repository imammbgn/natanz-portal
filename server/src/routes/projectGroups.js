const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateId, successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { status, search } = req.query;

  let query = 'SELECT * FROM project_groups WHERE owner_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY updated_at DESC';
  const groups = db.prepare(query).all(...params);

  return res.json(successResponse(groups));
});

router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const group = db.prepare('SELECT * FROM project_groups WHERE id = ? AND owner_id = ?').get(id, userId);
  if (!group) {
    return res.status(404).json(errorResponse('Project group not found.', 404));
  }

  const cases = db.prepare(`
    SELECT id, title, status, priority, category, created_at
    FROM support_cases WHERE project_group_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(id);

  return res.json(successResponse({ ...group, cases }));
});

router.post('/', authMiddleware, (req, res) => {
  const { name, description, region, environment, tags } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json(errorResponse('Project group name is required.'));
  }

  const id = generateId();

  try {
    db.prepare(`
      INSERT INTO project_groups (id, name, description, owner_id, region, environment, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      description || '',
      req.user.id,
      region || 'id-jakarta-1',
      environment || 'production',
      JSON.stringify(tags || [])
    );

    const group = db.prepare('SELECT * FROM project_groups WHERE id = ?').get(id);
    return res.status(201).json(successResponse(group, 'Project group created successfully.'));
  } catch (err) {
    return res.status(500).json(errorResponse('Failed to create project group.', 500));
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const existing = db.prepare('SELECT * FROM project_groups WHERE id = ? AND owner_id = ?').get(id, userId);
  if (!existing) {
    return res.status(404).json(errorResponse('Project group not found.', 404));
  }

  const { name, description, status, region, environment, tags } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (region !== undefined) { updates.push('region = ?'); params.push(region); }
  if (environment !== undefined) { updates.push('environment = ?'); params.push(environment); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }

  if (updates.length === 0) {
    return res.status(400).json(errorResponse('No fields to update.'));
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE project_groups SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const group = db.prepare('SELECT * FROM project_groups WHERE id = ?').get(id);
  return res.json(successResponse(group, 'Project group updated.'));
});

router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const existing = db.prepare('SELECT * FROM project_groups WHERE id = ? AND owner_id = ?').get(id, userId);
  if (!existing) {
    return res.status(404).json(errorResponse('Project group not found.', 404));
  }

  db.prepare('DELETE FROM project_groups WHERE id = ?').run(id);
  return res.json(successResponse(null, 'Project group deleted.'));
});

module.exports = router;
