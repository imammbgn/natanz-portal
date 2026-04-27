const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { formatUserResponse, successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json(errorResponse('User not found.', 404));
  }
  return res.json(successResponse(formatUserResponse(user)));
});

router.put('/profile', authMiddleware, (req, res) => {
  const { full_name, email, phone, company } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(errorResponse('Invalid email format.'));
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) {
      return res.status(409).json(errorResponse('Email already in use.'));
    }
  }

  const updates = [];
  const params = [];

  if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (company !== undefined) { updates.push('company = ?'); params.push(company); }

  if (updates.length === 0) {
    return res.status(400).json(errorResponse('No fields to update.'));
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.user.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  return res.json(successResponse(formatUserResponse(user), 'Profile updated.'));
});

router.put('/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json(errorResponse('Current and new password are required.'));
  }
  if (new_password.length < 6) {
    return res.status(400).json(errorResponse('New password must be at least 6 characters.'));
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const validPassword = bcrypt.compareSync(current_password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json(errorResponse('Current password is incorrect.'));
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user.id);

  return res.json(successResponse(null, 'Password changed successfully.'));
});

module.exports = router;
