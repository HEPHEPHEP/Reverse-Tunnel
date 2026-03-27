import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './database/db';
import { TunnelServer } from './tunnel/TunnelServer';
import authRoutes from './routes/auth';
import tunnelRoutes from './routes/tunnels';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080');
const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requests ohne Origin (z.B. curl, Server-to-Server) erlauben
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} nicht erlaubt (CORS)`));
  },
}));
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tunnels', tunnelRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = createServer(app);

// Initialize tunnel server
const tunnelServer = new TunnelServer(server);

// Start server
server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Reverse Tunnel Server                    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🌐 WebUI available at http://localhost:${WEB_PORT}`);
  console.log(`🔌 Tunnel WebSocket: ws://localhost:${PORT}/tunnel`);
  console.log('');
  console.log('📝 API Endpoints:');
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/tunnels`);
  console.log(`   POST   /api/tunnels`);
  console.log(`   GET    /api/users (admin)`);
  console.log('');
  console.log('✨ Ready to accept connections!');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
