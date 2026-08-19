const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true, unique: true, min: 1, max: 5 },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['MCQ', 'Visual', 'Timed', 'Case', 'Elite'], required: true },
  timeLimit: { type: Number, default: 8 }, // minutes
  xpReward: { type: Number, default: 1000 },
  difficulty: { type: String, enum: ['Warm-up', 'Moderate', 'Intense', 'Hard', 'Elite'], required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Round', roundSchema);
