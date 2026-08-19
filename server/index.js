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
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://optix-event-web.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || clientOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
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

// ── Clean & Parse MONGO_URI ──
const rawUri = process.env.MONGO_URI || '';
const mongoUri = rawUri.replace(/^["']|["']$/g, '').trim();
const rawDirectUri = process.env.MONGO_URI_DIRECT || '';
const mongoUriDirect = rawDirectUri.replace(/^["']|["']$/g, '').trim();

// ── Connect & Auto-Retry DB Connection ──
let isConnecting = false;
let lastConnectionError = null;
let useDirect = false; // tracks whether SRV failed and we should use direct URI

async function connectMongoDB() {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  const uri = (useDirect && mongoUriDirect) ? mongoUriDirect : mongoUri;
  if (!uri) { console.error('❌ No MONGO_URI configured!'); return; }

  isConnecting = true;
  console.log(`🔄 Connecting to MongoDB${useDirect ? ' (direct, bypassing DNS SRV)' : ' Atlas'}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    isConnecting = false;
    lastConnectionError = null;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    isConnecting = false;
    lastConnectionError = err.message;
    console.error('❌ MongoDB connection error:', err.message);

    // If SRV DNS lookup failed, switch to direct connection string
    if (!useDirect && mongoUriDirect && err.message.includes('querySrv')) {
      console.log('⚡ DNS SRV blocked — switching to direct connection string...');
      useDirect = true;
    }
    console.log('🔄 Retrying MongoDB connection in 3 seconds...');
    setTimeout(connectMongoDB, 3000);
  }
}

connectMongoDB();

// ── Database Connection Guard Middleware ──
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();

  if (mongoose.connection.readyState !== 1) {
    connectMongoDB();
    return res.status(503).json({
      success: false,
      message: lastConnectionError
        ? `MongoDB Connection Error: ${lastConnectionError}`
        : 'Database is connecting. Please retry in 3 seconds.',
    });
  }
  next();
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// ── Production Static Assets (Render Single-Service Hosting) ──
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath, {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

app.listen(PORT, () => {
  console.log(`🚀 AnalyticsQuest Server running on port ${PORT}`);
  console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
