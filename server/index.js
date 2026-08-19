require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──
// Configure CORS origins from env `CLIENT_URL` (comma-separated) or fall back to localhost
const clientOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: clientOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));

// ── Core Middleware ──
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AnalyticsQuest API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// ── Production Static Assets (Render Single-Service Hosting) ──
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── DB + Server Start ──
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MONGO_URI environment variable is missing!');
} else {
  console.log('🔄 Connecting to MongoDB Atlas...');
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ MongoDB Atlas connected successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB Atlas connection error:', err.message);
    });
}

app.listen(PORT, () => {
  console.log(`🚀 AnalyticsQuest Server running on port ${PORT}`);
  console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
