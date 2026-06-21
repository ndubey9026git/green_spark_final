const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const CarbonFootprint = require('../models/CarbonFootprint');
const DailyActivity = require('../models/DailyActivity');
const User = require('../models/User');

// Conversion factors (kg CO2)
const TRAVEL_FACTORS = {
  car: 0.18,        // kg CO2 per km
  bus: 0.08,        // kg CO2 per km
  train: 0.04,       // kg CO2 per km
  electric: 0.05,    // kg CO2 per km
  walk_cycle: 0.0    // kg CO2 per km
};

const DIET_FACTORS = {
  heavy_meat: 2.5,   // tons CO2 per year
  average_meat: 1.8, // tons CO2 per year
  vegetarian: 1.2,   // tons CO2 per year
  vegan: 0.7        // tons CO2 per year
};

const ELECTRICITY_FACTOR = 0.85; // kg CO2 per kWh
const LPG_FACTOR = 45;           // kg CO2 per cylinder
const WASTE_FACTOR = 0.5;        // kg CO2 per kg of waste

/**
 * @route   POST /api/carbon/calculate
 * @desc    Submit inputs and calculate annual carbon footprint in metric tons CO2
 * @access  Private
 */
router.post('/calculate', auth, async (req, res) => {
  try {
    const {
      travelDistance, // km per week
      vehicleType,
      electricity,    // kWh per month
      cylinders,      // LPG cylinders per month
      diet,           // heavy_meat, average_meat, vegetarian, vegan
      waste,          // kg per week
      recycleRate     // percentage (0 to 100)
    } = req.body;

    const userId = req.user.id;

    // 1. Calculate Travel (Weekly km -> Annual km -> tons CO2)
    const factor = TRAVEL_FACTORS[vehicleType] || 0;
    const travelAnnualKm = (travelDistance || 0) * 52;
    const travelEmissions = parseFloat(((travelAnnualKm * factor) / 1000).toFixed(2));

    // 2. Calculate Energy (Monthly kWh & cylinders -> Annual -> tons CO2)
    const annualKwh = (electricity || 0) * 12;
    const annualCylinders = (cylinders || 0) * 12;
    const energyEmissions = parseFloat((((annualKwh * ELECTRICITY_FACTOR) + (annualCylinders * LPG_FACTOR)) / 1000).toFixed(2));

    // 3. Diet (directly returns annual tons)
    const dietEmissions = parseFloat((DIET_FACTORS[diet] || 1.2).toFixed(2));

    // 4. Waste (Weekly waste -> Annual waste -> apply recycle reduction -> tons CO2)
    const annualWaste = (waste || 0) * 52;
    const rawWasteEmissions = annualWaste * WASTE_FACTOR;
    const reducedWasteEmissions = rawWasteEmissions * (1 - (recycleRate || 0) / 100);
    const wasteEmissions = parseFloat((reducedWasteEmissions / 1000).toFixed(2));

    // 5. Total
    const totalEmissions = parseFloat((travelEmissions + energyEmissions + dietEmissions + wasteEmissions).toFixed(2));

    // Create and save model entry
    const newFootprint = new CarbonFootprint({
      userId,
      travelEmissions,
      energyEmissions,
      wasteEmissions,
      dietEmissions,
      totalEmissions,
      inputs: {
        travelDistance,
        vehicleType,
        electricity,
        cylinders,
        diet,
        waste,
        recycleRate
      }
    });

    await newFootprint.save();

    // Generate dynamic eco-recommendations
    const recommendations = [];
    if (travelEmissions > 1.5) {
      recommendations.push({
        category: 'Travel',
        text: 'Your transport footprint is high. Consider carpooling, using public transit, or cycling to save up to 1.2 tons of CO2 annually.',
        impact: 'High'
      });
    }
    if (energyEmissions > 2.0) {
      recommendations.push({
        category: 'Energy',
        text: 'Reduce energy consumption by shifting to LED lighting and unplugging idle appliances. A simple smart power strip can save up to 0.4 tons of CO2.',
        impact: 'High'
      });
    }
    if (diet === 'heavy_meat' || diet === 'average_meat') {
      recommendations.push({
        category: 'Diet',
        text: 'Try adopting a vegetarian diet or doing "Meatless Mondays". Shifting to vegetarian meals can cut your diet emissions by 30-50%.',
        impact: 'Medium'
      });
    }
    if (wasteEmissions > 0.3) {
      recommendations.push({
        category: 'Waste',
        text: 'Boost your recycling rate above 50%. Segregating organic waste for composting cuts methane emissions significantly.',
        impact: 'Medium'
      });
    }

    res.status(201).json({
      calculation: newFootprint,
      comparisons: {
        indiaAverage: 1.9,
        globalAverage: 4.5,
        userTotal: totalEmissions,
        status: totalEmissions <= 1.9 ? 'Eco Champion' : totalEmissions <= 4.5 ? 'Average' : 'High Footprint'
      },
      recommendations
    });

  } catch (err) {
    console.error("Error in carbon calculation:", err);
    res.status(500).json({ error: 'Server error during carbon calculation.' });
  }
});

/**
 * @route   GET /api/carbon/history
 * @desc    Get calculation history for the logged-in user
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const history = await CarbonFootprint.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    console.error("Error fetching carbon history:", err);
    res.status(500).json({ error: 'Server error while fetching history.' });
  }
});

/**
 * @route   GET /api/carbon/today
 * @desc    Get user\'s daily activity log for today
 * @access  Private
 */
router.get('/today', auth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const activity = await DailyActivity.findOne({ userId: req.user.id, date: todayStr });
    res.json(activity || { date: todayStr, actions: [], pointsEarned: 0 });
  } catch (err) {
    console.error("Error fetching daily activities:", err);
    res.status(500).json({ error: 'Server error fetching today\'s logs.' });
  }
});

/**
 * @route   POST /api/carbon/track-daily
 * @desc    Log today\'s completed sustainable actions and award Eco Points
 * @access  Private
 */
router.post('/track-daily', auth, async (req, res) => {
  try {
    const { actions } = req.body; // e.g., ['walk_cycle', 'recycle']
    if (!Array.isArray(actions)) {
      return res.status(400).json({ message: 'Actions must be an array of keys.' });
    }

    const userId = req.user.id;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Calculate points: 5 points per action, capped at 20 points total per day
    const rawPoints = actions.length * 5;
    const newPointsEarned = Math.min(20, rawPoints);

    // Find if daily activity already logged for today
    let dailyLog = await DailyActivity.findOne({ userId, date: todayStr });
    let pointDifference = newPointsEarned;

    if (dailyLog) {
      // If already logged, calculate difference in points to adjust user profile
      pointDifference = newPointsEarned - dailyLog.pointsEarned;
      dailyLog.actions = actions;
      dailyLog.pointsEarned = newPointsEarned;
      await dailyLog.save();
    } else {
      // Create new daily log entry
      dailyLog = new DailyActivity({
        userId,
        date: todayStr,
        actions,
        pointsEarned: newPointsEarned
      });
      await dailyLog.save();
    }

    // Award points directly to user schema
    const user = await User.findById(userId);
    user.ecoPoints = Math.max(0, (user.ecoPoints || 0) + pointDifference);

    // Dynamic Badge unlocking check
    const BADGES = [
      { name: "Eco Starter", threshold: 50 },
      { name: "Eco Hero", threshold: 100 },
      { name: "Eco Champion", threshold: 200 },
    ];
    const unlockedBadges = [...(user.badges || [])];
    BADGES.forEach(badge => {
      if (user.ecoPoints >= badge.threshold && !unlockedBadges.includes(badge.name)) {
        unlockedBadges.push(badge.name);
      }
    });
    user.badges = unlockedBadges;

    // Check streak updates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.streak && user.streak.lastLoginDate) {
      const lastLogin = new Date(user.streak.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        user.streak.currentStreak += 1;
        user.streak.longestStreak = Math.max(user.streak.longestStreak, user.streak.currentStreak);
      } else if (daysDiff > 1) {
        user.streak.currentStreak = 1;
      }
    } else {
      user.streak = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: new Date(),
        loginHistory: [new Date()]
      };
    }
    user.streak.lastLoginDate = new Date();

    await user.save();

    res.json({
      message: `Habits logged successfully! Earned ${pointDifference >= 0 ? '+' : ''}${pointDifference} Eco Points.`,
      pointsEarned: newPointsEarned,
      totalPoints: user.ecoPoints,
      streak: user.streak,
      badges: user.badges,
      dailyLog
    });

  } catch (err) {
    console.error("Error tracking daily green actions:", err);
    res.status(500).json({ error: 'Server error while tracking daily actions.' });
  }
});

module.exports = router;
