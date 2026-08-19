const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  rollNumber: { type: String, default: null },
  action: {
    type: String,
    enum: [
      'LOGIN', 'LOGOUT', 'REGISTER', 'SESSION_REVOKED',
      'ROUND_START', 'ROUND_SUBMIT', 'GAME_STARTED',
      'GAME_EXPIRED', 'ADMIN_LOGIN', 'PLAYER_RESET',
    ],
    required: true,
  },
  ipAddress: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
