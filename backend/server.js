const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 2. CORS Configuration (Including Vercel Fix) ---
// Frontend URLs that are allowed to access the backend API
const allowedOrigins = [
const mongoUri = process.env.MONGO_URI;
    // Local Development URL
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
                await new Promise(res => setTimeout(res, delayMs));
            } else {
                console.error('❌ MongoDB connection error: no more retries');
                process.exit(1);
            }
        }
    }
}
if (mongoUri) connectWithRetry(); else console.error('MONGO_URI is not set in environment variables');
    'http://localhost:3000', 
    // Vite Development URL
// Allow configuring allowed origins via environment variable ALLOWED_ORIGINS
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173';
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);
            console.error(`Error: Not allowed by CORS. Origin attempted: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
app.options('*', cors(corsOptions));

// --- 3. Middleware ---
app.use(express.json()); // Body parser for application/json

// --- 4. Route Imports ---
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve uploaded files statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
app.use('/api/carbon', carbonRoutes);
app.use('/api/ai', aiRoutes);

// --- 6. Basic Route for Health Check ---
app.get('/', (req, res) => {
    res.send('GreenSpark FullStack Backend API is running!');
});

// --- 7. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});