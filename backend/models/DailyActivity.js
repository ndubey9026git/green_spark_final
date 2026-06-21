const mongoose = require('mongoose');

const DailyActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  actions: {
    type: [String], // Array of completed action keys: 'walk_cycle', 'energy', 'diet', 'recycle', 'water'
    default: []
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Prevent duplicate entries for the same user on the same date
DailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyActivity', DailyActivitySchema);
