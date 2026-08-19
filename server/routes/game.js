const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authMiddleware } = require('../middleware/authMiddleware');
const gameTimerMiddleware = require('../middleware/gameTimerMiddleware');

// All game routes require authentication
router.use(authMiddleware);

router.post('/start', gameTimerMiddleware, gameController.startGame);
router.get('/status', gameController.getStatus);
router.get('/rounds', gameTimerMiddleware, gameController.getRounds);
router.get('/rounds/:roundId/questions', gameTimerMiddleware, gameController.getQuestions);
router.post('/rounds/:roundId/submit', gameTimerMiddleware, gameController.submitRound);
router.get('/leaderboard', gameController.getLeaderboard);

module.exports = router;
