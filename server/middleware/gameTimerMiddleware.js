const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const gameTimerMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Allow NOT_STARTED users through (they need to call /start)
    if (user.status === 'NOT_STARTED') {
      return next();
    }

    if (user.status === 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Your game is already completed.',
        code: 'GAME_COMPLETED',
        data: { totalScore: user.totalScore, totalXp: user.totalXp },
      });
    }

    if (user.status === 'EXPIRED') {
      return res.status(403).json({
        success: false,
        message: 'Your 30-minute window has expired.',
        code: 'GAME_EXPIRED',
        data: { totalScore: user.totalScore, totalXp: user.totalXp },
      });
    }

    // ── Absolute server-side timer check ──
    if (user.status === 'IN_PROGRESS' && user.gameEndTime) {
      const now = Date.now();
      const endTime = new Date(user.gameEndTime).getTime();

      if (now > endTime) {
        // Lock the player permanently
        await User.findByIdAndUpdate(user._id, {
          status: 'EXPIRED',
          activeSessionToken: null,
        });

        await AuditLog.create({
          userId: user._id,
          rollNumber: user.rollNumber,
          action: 'GAME_EXPIRED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            gameEndTime: user.gameEndTime,
            expiredAt: new Date(),
            totalScore: user.totalScore,
          },
        });

        return res.status(403).json({
          success: false,
          message: 'Time is up! Your 30-minute window has expired.',
          code: 'GAME_EXPIRED',
          data: { totalScore: user.totalScore, totalXp: user.totalXp },
        });
      }
    }

    next();
  } catch (error) {
    console.error('Game timer middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = gameTimerMiddleware;
