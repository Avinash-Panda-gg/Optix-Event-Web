const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken, generateSessionToken } = require('../utils/jwt');

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
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

    const existingUser = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A player with this Roll Number already exists.' });
    }

    const sessionToken = generateSessionToken();
    const user = await User.create({
      name: name.trim(),
      rollNumber: rollNumber.toUpperCase().trim(),
      password,
      activeSessionToken: sessionToken,
      ...getClientInfo(req),
    });

    const token = generateToken(user._id, user.role);

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'REGISTER',
      ...getClientInfo(req),
      metadata: { name: user.name },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({ success: false, message: 'Roll Number and Password are required.' });
    }

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase() }).select('+password +activeSessionToken');
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

    // ── STRICT SINGLE ACTIVE DEVICE LOCK ──
    // If team ID is already logged in on another device/browser, reject new login
    if (user.activeSessionToken) {
      await AuditLog.create({
        userId: user._id,
        rollNumber: user.rollNumber,
        action: 'SESSION_REVOKED',
        ...getClientInfo(req),
        metadata: { reason: 'Blocked concurrent login attempt while session active' },
      });
      return res.status(409).json({
        success: false,
        message: 'This Team ID / Roll Number is currently logged in on another device. Simultaneous logins are strictly prohibited.',
        code: 'ALREADY_LOGGED_IN',
      });
    }

    // Generate active session token for this device
    const sessionToken = generateSessionToken();
    user.activeSessionToken = sessionToken;
    user.lastIpAddress = getClientInfo(req).ipAddress;
    user.lastUserAgent = getClientInfo(req).userAgent;
    await user.save();

    const token = generateToken(user._id, user.role);

    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'LOGIN',
      ...getClientInfo(req),
      metadata: { status: user.status },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      sessionToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const user = req.user;
    await User.findByIdAndUpdate(user._id, { activeSessionToken: null });
    await AuditLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
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
