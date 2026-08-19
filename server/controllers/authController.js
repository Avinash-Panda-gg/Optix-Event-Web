const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken, generateSessionToken } = require('../utils/jwt');

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
  userAgent: req.headers['user-agent'] || 'unknown',
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, rollNumber, password } = req.body;

    if (!name || !rollNumber || !password) {
      return res.status(400).json({ success: false, message: 'Name, Roll Number, and Password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanRoll = rollNumber.toUpperCase().trim();
    const existingUser = await User.findOne({ rollNumber: cleanRoll });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A player with this Roll Number already exists.' });
    }

    const sessionToken = generateSessionToken();
    const clientInfo = getClientInfo(req);

    const user = await User.create({
      name: name.trim(),
      rollNumber: cleanRoll,
      password,
      activeSessionToken: sessionToken,
      lastIpAddress: clientInfo.ipAddress,
      lastUserAgent: clientInfo.userAgent,
    });

    const token = generateToken(user._id, user.role);

    try {
      await AuditLog.create({
        userId: user._id,
        rollNumber: user.rollNumber,
        action: 'REGISTER',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        metadata: { name: user.name },
      });
    } catch (auditErr) {
      console.warn('AuditLog creation warning on register:', auditErr.message);
    }

    try {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    } catch (cookieErr) {
      console.warn('Cookie set warning:', cookieErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to AnalyticsQuest.',
      token,
      sessionToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Roll Number already registered.' });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({ success: false, message: 'Roll Number and Password are required.' });
    }

    const cleanRoll = rollNumber.toUpperCase().trim();
    const user = await User.findOne({ rollNumber: cleanRoll }).select('+password +activeSessionToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Roll Number or Password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Roll Number or Password.' });
    }

    // Permanently lock completed/expired players from re-entering
    if (user.status === 'COMPLETED' || user.status === 'EXPIRED') {
      return res.status(403).json({
        success: false,
        message: 'Your game session has ended. You cannot re-enter the arena.',
        code: user.status,
        data: { totalScore: user.totalScore, totalXp: user.totalXp },
      });
    }

    const clientInfo = getClientInfo(req);

    // ── STRICT SINGLE ACTIVE DEVICE LOCK ──
    if (user.activeSessionToken) {
      try {
        await AuditLog.create({
          userId: user._id,
          rollNumber: user.rollNumber,
          action: 'SESSION_REVOKED',
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { reason: 'Blocked concurrent login attempt while session active' },
        });
      } catch (e) {}

      return res.status(409).json({
        success: false,
        message: 'This Team ID / Roll Number is currently logged in on another device. Simultaneous logins are strictly prohibited.',
        code: 'ALREADY_LOGGED_IN',
      });
    }

    // Generate active session token for this device
    const sessionToken = generateSessionToken();
    user.activeSessionToken = sessionToken;
    user.lastIpAddress = clientInfo.ipAddress;
    user.lastUserAgent = clientInfo.userAgent;
    await user.save();

    const token = generateToken(user._id, user.role);

    try {
      await AuditLog.create({
        userId: user._id,
        rollNumber: user.rollNumber,
        action: 'LOGIN',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        metadata: { status: user.status },
      });
    } catch (e) {}

    try {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      sessionToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      await User.findByIdAndUpdate(user._id, { activeSessionToken: null });
      try {
        await AuditLog.create({
          userId: user._id,
          rollNumber: user.rollNumber,
          action: 'LOGOUT',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (e) {}
    }
    res.clearCookie('token');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let timeRemaining = null;
    if (user.status === 'IN_PROGRESS' && user.gameEndTime) {
      const now = Date.now();
      const end = new Date(user.gameEndTime).getTime();
      timeRemaining = Math.max(0, Math.floor((end - now) / 1000));
    }
    return res.status(200).json({
      success: true,
      user: user.toJSON(),
      timeRemaining,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
