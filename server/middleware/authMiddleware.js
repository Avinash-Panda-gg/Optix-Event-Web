const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.userId).select('+activeSessionToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // ── Single-device session check ──
    const clientSessionToken = req.headers['x-session-token'];
    if (user.activeSessionToken && clientSessionToken !== user.activeSessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Session revoked. Another device has logged in with your account.',
        code: 'SESSION_REVOKED',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

const adminMiddleware = async (req, res, next) => {
  await authMiddleware(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  });
};

module.exports = { authMiddleware, adminMiddleware };
