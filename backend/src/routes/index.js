const express = require('express');
const authRoutes = require('./auth');
const hcpRoutes = require('./hcp');
const adminRoutes = require('./admin');
const reportRoutes = require('./report');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
router.use('/auth', authRoutes);
router.use('/hcp', hcpRoutes);
router.use('/admin', adminRoutes);
router.use('/report', reportRoutes);

module.exports = router;
