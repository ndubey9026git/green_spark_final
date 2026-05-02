// backend/models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','teacher','admin'], default: 'student' },
  ecoPoints: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  
  badges: { 
    type: [String], 
    default: [] 
  },

  // ✅ FIX: The "completed" field was missing from the schema.
  // This tells the database how to save the list of completed challenge IDs.
  completed: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Challenge',
    default: [],
  },

  // Daily Streak System
  streak: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null },
    loginHistory: { type: [Date], default: [] }
  }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);