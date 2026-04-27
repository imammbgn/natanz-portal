require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./config/database');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const projectGroupRoutes = require('./routes/projectGroups');
const supportRoutes = require('./routes/support');
const userRoutes = require('./routes/user');
const auditorRoutes = require('./routes/auditor');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/project-groups', projectGroupRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auditor', auditorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Natanz Cloud Management Portal', version: '1.0.0' });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[Natanz Cloud] Server running on http://localhost:${PORT}`);
  console.log(`[Natanz Cloud] Environment: ${process.env.NODE_ENV || 'development'}`);
});
