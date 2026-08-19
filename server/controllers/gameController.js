const User = require('../models/User');
const Round = require('../models/Round');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const AuditLog = require('../models/AuditLog');

const GAME_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// POST /api/game/start
exports.startGame = async (req, res) => {
  try {
    const user = req.user;

    if (user.status === 'IN_PROGRESS') {
      const timeRemaining = Math.max(
        0,
        Math.floor((new Date(user.gameEndTime).getTime() - Date.now()) / 1000)
      );
      return res.status(200).json({
        success: true,
        message: 'Game already in progress.',
        timeRemaining,
        gameStartTime: user.gameStartTime,
        gameEndTime: user.gameEndTime,
      });
    }

    if (user.status === 'COMPLETED' || user.status === 'EXPIRED') {
      return res.status(403).json({
        success: false,
        message: 'Game already ended.',
        code: user.status,
      });
    }

    const now = new Date();
    const gameEndTime = new Date(now.getTime() + GAME_DURATION_MS);

    await User.findByIdAndUpdate(user._id, {
      status: 'IN_PROGRESS',
      gameStartTime: now,
      gameEndTime,
      currentRound: 1,
    });

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'GAME_STARTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { gameStartTime: now, gameEndTime },
    });

    return res.status(200).json({
      success: true,
      message: 'Game started! You have 30 minutes. Good luck!',
      gameStartTime: now,
      gameEndTime,
      timeRemaining: GAME_DURATION_MS / 1000,
    });
  } catch (error) {
    console.error('Start game error:', error);
    return res.status(500).json({ success: false, message: 'Server error starting game.' });
  }
};

// GET /api/game/status
exports.getStatus = async (req, res) => {
  try {
    const user = req.user;

    let timeRemaining = null;
    if (user.status === 'IN_PROGRESS' && user.gameEndTime) {
      const now = Date.now();
      const end = new Date(user.gameEndTime).getTime();
      timeRemaining = Math.max(0, Math.floor((end - now) / 1000));
    }

    // Live rank calculation
    const betterPlayers = await User.countDocuments({
      role: 'player',
      totalScore: { $gt: user.totalScore },
    });
    const estimatedRank = betterPlayers + 1;

    return res.status(200).json({
      success: true,
      status: user.status,
      timeRemaining,
      gameStartTime: user.gameStartTime,
      gameEndTime: user.gameEndTime,
      totalScore: user.totalScore,
      totalXp: user.totalXp,
      currentRound: user.currentRound,
      roundsCompleted: user.roundsCompleted,
      estimatedRank,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/game/rounds
exports.getRounds = async (req, res) => {
  try {
    const user = req.user;
    const rounds = await Round.find({ isActive: true }).sort({ roundNumber: 1 });

    const roundsData = rounds.map((r) => ({
      _id: r._id,
      roundNumber: r.roundNumber,
      title: r.title,
      description: r.description,
      type: r.type,
      timeLimit: r.timeLimit,
      xpReward: r.xpReward,
      difficulty: r.difficulty,
      isUnlocked: r.roundNumber === 1 || user.roundsCompleted.includes(r.roundNumber - 1),
      isCompleted: user.roundsCompleted.includes(r.roundNumber),
    }));

    return res.status(200).json({ success: true, rounds: roundsData });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/game/rounds/:roundId/questions
exports.getQuestions = async (req, res) => {
  try {
    const user = req.user;
    const { roundId } = req.params;

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ success: false, message: 'Round not found.' });
    }

    // Sequential unlock check
    const isFirstRound = round.roundNumber === 1;
    const prevRoundCompleted = user.roundsCompleted.includes(round.roundNumber - 1);
    if (!isFirstRound && !prevRoundCompleted) {
      return res.status(403).json({ success: false, message: 'Complete the previous round first.' });
    }

    if (user.roundsCompleted.includes(round.roundNumber)) {
      return res.status(403).json({ success: false, message: 'You have already completed this round.' });
    }

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'ROUND_START',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { roundNumber: round.roundNumber, roundTitle: round.title },
    });

    // Strip correctAnswer from player response
    const questions = await Question.find({ roundId })
      .sort({ orderIndex: 1 })
      .select('-correctAnswer -explanation');

    return res.status(200).json({
      success: true,
      round: {
        _id: round._id,
        roundNumber: round.roundNumber,
        title: round.title,
        type: round.type,
        xpReward: round.xpReward,
        difficulty: round.difficulty,
        timeLimit: round.timeLimit,
      },
      questions,
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/game/rounds/:roundId/submit
exports.submitRound = async (req, res) => {
  try {
    const user = req.user;
    const { roundId } = req.params;
    const { answers, timeTaken } = req.body;

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ success: false, message: 'Round not found.' });
    }

    // Idempotency — prevent double submission
    if (user.roundsCompleted.includes(round.roundNumber)) {
      return res.status(409).json({ success: false, message: 'Round already submitted.' });
    }

    // Sequential unlock validation
    const isFirstRound = round.roundNumber === 1;
    const prevRoundCompleted = user.roundsCompleted.includes(round.roundNumber - 1);
    if (!isFirstRound && !prevRoundCompleted) {
      return res.status(403).json({ success: false, message: 'Complete the previous round first.' });
    }

    // ── Server-side grading ──
    const questions = await Question.find({ roundId }).sort({ orderIndex: 1 });
    let scoreAwarded = 0;

    const gradedAnswers = questions.map((q) => {
      const userAnswer = (answers || []).find((a) => a.questionId === q._id.toString());
      const selected = userAnswer?.selectedAnswer || null;
      const isCorrect = selected !== null && selected.toUpperCase() === q.correctAnswer.toUpperCase();
      const pointsAwarded = isCorrect ? q.points : 0;
      scoreAwarded += pointsAwarded;
      return { questionId: q._id, selectedAnswer: selected, isCorrect, pointsAwarded };
    });

    const xpAwarded = round.xpReward;

    await Submission.create({
      userId: user._id,
      roundId,
      roundNumber: round.roundNumber,
      answers: gradedAnswers,
      scoreAwarded,
      xpAwarded,
      timeTaken: timeTaken || 0,
    });

    // Update user atomically
    const updatedRoundsCompleted = [...user.roundsCompleted, round.roundNumber];
    const isGameComplete = updatedRoundsCompleted.length >= 5;

    await User.findByIdAndUpdate(user._id, {
      $inc: { totalScore: scoreAwarded, totalXp: xpAwarded },
      $addToSet: { roundsCompleted: round.roundNumber },
      currentRound: Math.min(round.roundNumber + 1, 5),
      ...(isGameComplete ? { status: 'COMPLETED' } : {}),
    });

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'ROUND_SUBMIT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        roundNumber: round.roundNumber,
        scoreAwarded,
        xpAwarded,
        totalCorrect: gradedAnswers.filter((a) => a.isCorrect).length,
        totalQuestions: questions.length,
      },
    });

    return res.status(200).json({
      success: true,
      message: isGameComplete
        ? 'Congratulations! You have completed all 5 rounds!'
        : `Round ${round.roundNumber} complete! +${scoreAwarded} pts · +${xpAwarded} XP`,
      scoreAwarded,
      xpAwarded,
      gradedAnswers,
      isGameComplete,
      nextRound: isGameComplete ? null : round.roundNumber + 1,
    });
  } catch (error) {
    console.error('Submit round error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting round.' });
  }
};

// GET /api/game/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const players = await User.find({ role: 'player' })
      .sort({ totalScore: -1, gameStartTime: 1 })
      .limit(10)
      .select('name rollNumber totalScore totalXp roundsCompleted status');

    const leaderboard = players.map((p, i) => ({
      rank: i + 1,
      name: p.name,
      rollNumber: p.rollNumber,
      totalScore: p.totalScore,
      totalXp: p.totalXp,
      roundsCompleted: p.roundsCompleted.length,
      status: p.status,
    }));

    return res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
