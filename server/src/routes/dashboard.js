const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const projectGroups = db.prepare('SELECT COUNT(*) as count FROM project_groups WHERE owner_id = ?').get(userId);
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM project_groups WHERE owner_id = ? AND status = 'active'").get(userId);
  const openCases = db.prepare("SELECT COUNT(*) as count FROM support_cases WHERE user_id = ? AND status IN ('open', 'in_progress')").get(userId);
  const totalResources = db.prepare('SELECT COALESCE(SUM(resource_count), 0) as total FROM project_groups WHERE owner_id = ?').get(userId);

  const recentProjects = db.prepare(`
    SELECT id, name, status, region, resource_count, updated_at
    FROM project_groups WHERE owner_id = ?
    ORDER BY updated_at DESC LIMIT 5
  `).all(userId);

  const recentCases = db.prepare(`
    SELECT id, title, status, priority, category, created_at
    FROM support_cases WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).all(userId);

  const stats = {
    projectGroups: projectGroups.count,
    activeProjects: activeProjects.count,
    openCases: openCases.count,
    totalResources: totalResources.total,
  };

  return res.json(successResponse({ stats, recentProjects, recentCases }));
});

module.exports = router;
