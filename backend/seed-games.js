/**
 * Seed script to populate the database with default games.
 * Run with: node seed-games.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Game = require('./models/Game');
const User = require('./models/User');

dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function seedGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get or create an admin user for uploadedBy
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating a seed admin user...');
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@greenspark.local',
        password: 'hashedpassword', // In production, use bcrypt
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Created seed admin user');
    }

    // Define default games
    const games = [
      {
        title: 'Recycle Rush',
        description: 'Sort waste items into the correct bins before time runs out! Learn about recycling, composting, and proper waste management.',
        basePoints: 15,
        maxPollutionGoal: 15,
        targetHealth: 85,
        gameDuration: 30,
        gameUrl: 'RecycleRush',
        uploadedBy: adminUser._id
      },
      {
        title: 'Eco-City Builder: 3D Mission',
        description: 'Build a sustainable city! Plant trees, clean polluted rivers, and manage resources to reach environmental goals in this 3D simulation.',
        basePoints: 25,
        maxPollutionGoal: 20,
        targetHealth: 90,
        gameDuration: 100,
        gameUrl: 'EcoCitySimulator',
        uploadedBy: adminUser._id
      },
      {
        title: 'Ecosystem Balance Simulator',
        description: 'Complete environmental challenges to maintain ecosystem balance! Plant trees, purify water, and reduce pollution to save the environment.',
        basePoints: 20,
        maxPollutionGoal: 10,
        targetHealth: 95,
        gameDuration: 60,
        gameUrl: 'EcosystemSimulator',
        uploadedBy: adminUser._id
      },
      {
        title: 'Carbon Quest',
        description: 'Complete environmental challenges to reduce carbon footprint and save the planet! Learn about renewable energy and sustainability.',
        basePoints: 20,
        maxPollutionGoal: 10,
        targetHealth: 95,
        gameDuration: 50,
        gameUrl: 'https://example.com/carbon-quest', // External game URL
        uploadedBy: adminUser._id
      },
      {
        title: 'Ocean Cleanup',
        description: 'Help clean up the ocean by collecting plastic waste and pollution. Learn about marine conservation and ocean pollution.',
        basePoints: 18,
        maxPollutionGoal: 25,
        targetHealth: 80,
        gameDuration: 60,
        gameUrl: 'https://example.com/ocean-cleanup', // External game URL
        uploadedBy: adminUser._id
      },
      {
        title: 'Renewable Energy Grid Simulator',
        description: 'Balance solar, wind, and battery storage capacities to design a 100% clean power grid under budget and stability constraints. Track LCOE, grid emissions, and prevent blackouts.',
        basePoints: 30,
        maxPollutionGoal: 0,
        targetHealth: 100,
        gameDuration: 24,
        gameUrl: 'GreenGridSandbox',
        uploadedBy: adminUser._id
      },
      {
        title: 'Direct Air Capture Simulator',
        description: 'Operate a Direct Air Capture plant. Sorbents, fan flows, heating, and power profiles must be engineered to capture CO2 net-negatively under a $150/ton cost budget.',
        basePoints: 30,
        maxPollutionGoal: 0,
        targetHealth: 100,
        gameDuration: 24,
        gameUrl: 'CarbonCaptureSandbox',
        uploadedBy: adminUser._id
      },
      {
        title: 'Waste-to-Energy Bioreactor',
        description: 'Operate a municipal anaerobic digestion plant. Settle feedstock ratios, digester temperatures, and CHP turbine outputs to maximize electricity output, offset landfill methane, and achieve positive profit.',
        basePoints: 30,
        maxPollutionGoal: 0,
        targetHealth: 100,
        gameDuration: 24,
        gameUrl: 'BioreactorSandbox',
        uploadedBy: adminUser._id
      }
    ];

    // Clear existing games (optional)
    await Game.deleteMany({});
    console.log('✅ Cleared existing games');

    // Insert games
    const createdGames = await Game.insertMany(games);
    console.log(`✅ Seeded ${createdGames.length} games:`);
    createdGames.forEach(game => {
      console.log(`  - ${game.title}`);
    });

    console.log('\n✅ Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

// Run the seeding function
seedGames();
