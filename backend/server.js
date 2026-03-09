require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const raceRoutes = require('./routes/race');
const leaderboardRoutes = require('./routes/leaderboard');
const setupSocket = require('./sockets/raceSocket');

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [clientUrl, 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/race', raceRoutes);
app.use('/api', leaderboardRoutes);

// Setup Socket.IO
setupSocket(io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 TypeRacing server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌐 CORS allowed: ${clientUrl}`);
});
