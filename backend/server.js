const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- 1. Database Connection with retry ---
const mongoUri = process.env.MONGO_URI;
async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoUri, { autoIndex: false });
      console.log('✅ MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error('❌ MongoDB connection error: no more retries');
        process.exit(1);
      }
    }
  }
}
if (mongoUri) connectWithRetry(); else console.error('MONGO_URI is not set in environment variables');

// --- 2. CORS Configuration ---
const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$|^\s+|\s+$/g, '');
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173';
const allowedOrigins = allowedOriginsEnv
  .split(',')
  .map((s) => normalizeOrigin(s))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve uploaded files statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. Middleware ---
app.use(express.json());

// --- 4. Route Imports ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const assignmentsRoutes = require('./routes/assignments');
const challengesRoutes = require('./routes/challenges');
const gamesRoutes = require('./routes/games');
const leaderboardRoutes = require('./routes/leaderboard');
const learnRoutes = require('./routes/learn');
const mediaRoutes = require('./routes/media');
const notificationRoutes = require('./routes/notifications');
const carbonRoutes = require('./routes/carbon');
const aiRoutes = require('./routes/ai');

// --- 5. Route Mounting ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/game', gamesRoutes); // backward compatibility
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/ai', aiRoutes);

// --- 6. Basic Route for Health Check ---
app.get('/', (req, res) => res.send('GreenSpark FullStack Backend API is running!'));

// --- 7. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
