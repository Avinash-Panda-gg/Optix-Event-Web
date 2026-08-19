const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  roundNumber: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }, // 'A', 'B', 'C', 'D'
  explanation: { type: String, default: '' },
  points: { type: Number, default: 100 },
  orderIndex: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
