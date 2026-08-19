const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
  activeSessionToken: { type: String, default: null },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
    default: 'NOT_STARTED',
  },
  gameStartTime: { type: Date, default: null },
  gameEndTime: { type: Date, default: null },
  totalScore: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  currentRound: { type: Number, default: 1, min: 1, max: 5 },
  roundsCompleted: [{ type: Number }],
  lastIpAddress: { type: String, default: null },
  lastUserAgent: { type: String, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.activeSessionToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
