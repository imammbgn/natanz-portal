const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateId, formatUserResponse, successResponse, errorResponse } = require('../utils/helpers');

const router = express.Router();

const JWT_OPTIONS = {
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  issuer: process.env.JWT_ISSUER || 'natanz-cloud-portal',
  algorithm: 'HS256',
};

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    JWT_OPTIONS
  );
}

router.post('/register', (req, res) => {
  const { username, email, password, full_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json(errorResponse('Username, email, and password are required.'));
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json(errorResponse('Username must be 3-30 characters.'));
  }
  if (password.length < 8) {
    return res.status(400).json(errorResponse('Password must be at least 8 characters.'));
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(errorResponse('Invalid email format.'));
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(409).json(errorResponse('Username or email already exists.'));
  }

  const id = generateId();
  const password_hash = bcrypt.hashSync(password, 12);

  try {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `).run(id, username, email, password_hash, full_name || username);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const token = generateToken(user);

    return res.status(201).json(successResponse({ token, user: formatUserResponse(user) }, 'Registration successful.'));
  } catch (err) {
    return res.status(500).json(errorResponse('Registration failed. Please try again.', 500));
  }
});

router.post('/login', (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json(errorResponse('Login identifier and password are required.'));
  }

  const user = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1').get(login, login);
  if (!user) {
    return res.status(401).json(errorResponse('Invalid credentials.'));
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json(errorResponse('Invalid credentials.'));
  }

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  const token = generateToken(user);

  return res.json(successResponse({ token, user: formatUserResponse(user) }, 'Login successful.'));
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json(errorResponse('User not found.', 404));
  }
  return res.json(successResponse(formatUserResponse(user)));
});

module.exports = router;
