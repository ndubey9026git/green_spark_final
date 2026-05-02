const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- 1. Database Connection ---
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 2. CORS Configuration (Including Vercel Fix) ---
// Frontend URLs that are allowed to access the backend API
const allowedOrigins = [
    // Permanent Vercel Alias (Public URL)
    'https://green-spark-full-stack.vercel.app',
    // Specific Vercel Deployment URL (Temporary URL that caused the error)
    'https://green-spark-full-stack-5hmhglll3.vercel.app', 
    // Local Development URL
    'http://localhost:3000', 
    // Vite Development URL
    'http://localhost:5173',
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`Error: Not allowed by CORS. Origin attempted: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 204
};

// Enable CORS for all routes
app.use(cors(corsOptions));
// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// --- 3. Middleware ---
app.use(express.json()); // Body parser for application/json

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

// --- 5. Route Mounting ---
// All API endpoints are prefixed with '/api'
app.use('/api/auth', authRoutes); // Login/Register (Always public)
app.use('/api/admin', adminRoutes); // Admin Panel access
app.use('/api/teacher', teacherRoutes); // Teacher Panel access
app.use('/api/student', studentRoutes); // Student Panel access
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/game', gamesRoutes); // backward compatibility
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationRoutes);

// --- 6. Basic Route for Health Check ---
app.get('/', (req, res) => {
    res.send('GreenSpark FullStack Backend API is running!');
});

// --- 7. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});