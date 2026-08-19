const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Round = require('../models/Round');
const { generateToken, generateSessionToken } = require('../utils/jwt');

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;
    const user = await User.findOne({ rollNumber: rollNumber?.toUpperCase(), role: 'admin' })
      .select('+password +activeSessionToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const sessionToken = generateSessionToken();
    user.activeSessionToken = sessionToken;
    await user.save();

    const token = generateToken(user._id, user.role);

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'ADMIN_LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token,
      sessionToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalPlayers = await User.countDocuments({ role: 'player' });
    const activePlayers = await User.countDocuments({ role: 'player', status: 'IN_PROGRESS' });
    const completedPlayers = await User.countDocuments({ role: 'player', status: 'COMPLETED' });
    const expiredPlayers = await User.countDocuments({ role: 'player', status: 'EXPIRED' });
    const notStarted = await User.countDocuments({ role: 'player', status: 'NOT_STARTED' });

    // Drop-off per round
    const dropoff = {};
    for (let r = 1; r <= 5; r++) {
      dropoff[`round${r}`] = await Submission.countDocuments({ roundNumber: r });
    }

    // Avg completion time
    const completedWithSubs = await Submission.aggregate([
      { $group: { _id: '$userId', firstSub: { $min: '$submittedAt' }, lastSub: { $max: '$submittedAt' } } },
    ]);

    let avgCompletionMinutes = 0;
    if (completedWithSubs.length > 0) {
      const times = await Promise.all(
        completedWithSubs.map(async (s) => {
          const u = await User.findById(s._id).select('gameStartTime');
          if (!u?.gameStartTime) return 0;
          return (new Date(s.lastSub) - new Date(u.gameStartTime)) / 1000 / 60;
        })
      );
      avgCompletionMinutes = times.reduce((a, b) => a + b, 0) / times.length;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalPlayers,
        activePlayers,
        completedPlayers,
        expiredPlayers,
        notStarted,
        avgCompletionTime: Math.round(avgCompletionMinutes * 10) / 10,
        dropoff,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/players
exports.getPlayers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { role: 'player' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const players = await User.find(query)
      .sort({ totalScore: -1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .select('name rollNumber status totalScore totalXp roundsCompleted currentRound lastIpAddress gameStartTime gameEndTime createdAt');

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      players,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.userId) query.userId = req.query.userId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name rollNumber');

    const total = await AuditLog.countDocuments(query);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/leaderboard
exports.getFullLeaderboard = async (req, res) => {
  try {
    const players = await User.find({ role: 'player' })
      .sort({ totalScore: -1, gameStartTime: 1 })
      .select('name rollNumber totalScore totalXp roundsCompleted status gameStartTime createdAt');

    const leaderboard = players.map((p, i) => ({
      rank: i + 1,
      name: p.name,
      rollNumber: p.rollNumber,
      totalScore: p.totalScore,
      totalXp: p.totalXp,
      roundsCompleted: p.roundsCompleted.length,
      status: p.status,
      gameStartTime: p.gameStartTime,
    }));

    if (req.query.format === 'csv') {
      const header = 'Rank,Name,Roll Number,Score,XP,Rounds Completed,Status\n';
      const rows = leaderboard
        .map((p) => `${p.rank},"${p.name}",${p.rollNumber},${p.totalScore},${p.totalXp},${p.roundsCompleted},${p.status}`)
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leaderboard_optix.csv');
      return res.send(header + rows);
    }

    return res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/player/:id/reset
exports.resetPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await User.findById(id);

    if (!player || player.role === 'admin') {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    await User.findByIdAndUpdate(id, {
      status: 'NOT_STARTED',
      gameStartTime: null,
      gameEndTime: null,
      totalScore: 0,
      totalXp: 0,
      currentRound: 1,
      roundsCompleted: [],
      activeSessionToken: null,
    });

    await Submission.deleteMany({ userId: id });

    await AuditLog.create({
      userId: req.user._id,
      rollNumber: req.user.rollNumber,
      action: 'PLAYER_RESET',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { resetPlayerId: id, resetPlayerRollNumber: player.rollNumber },
    });

    return res.status(200).json({
      success: true,
      message: `Player ${player.rollNumber} has been fully reset.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    return res.status(200).json({ success: true, question });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/questions
exports.getQuestions = async (req, res) => {
  try {
    const { roundNumber } = req.query;
    const query = roundNumber ? { roundNumber: parseInt(roundNumber) } : {};
    const questions = await Question.find(query)
      .sort({ roundNumber: 1, orderIndex: 1 })
      .populate('roundId', 'title roundNumber');
    return res.status(200).json({ success: true, questions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
