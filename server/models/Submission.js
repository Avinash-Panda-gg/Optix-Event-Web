const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  roundNumber: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedAnswer: { type: String, default: null }, // 'A','B','C','D' or null for skipped
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
  }],
  scoreAwarded: { type: Number, default: 0 },
  xpAwarded: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number, default: 0 }, // seconds
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
