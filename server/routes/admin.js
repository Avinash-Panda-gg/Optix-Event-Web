const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/authMiddleware');

router.post('/login', adminController.adminLogin);
router.get('/stats', adminMiddleware, adminController.getStats);
router.get('/players', adminMiddleware, adminController.getPlayers);
router.get('/audit-logs', adminMiddleware, adminController.getAuditLogs);
router.get('/leaderboard', adminMiddleware, adminController.getFullLeaderboard);
router.post('/player/:id/reset', adminMiddleware, adminController.resetPlayer);
router.put('/questions/:id', adminMiddleware, adminController.updateQuestion);
router.get('/questions', adminMiddleware, adminController.getQuestions);

module.exports = router;
