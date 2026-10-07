import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { setupMeetingSocket } from './socket/meeting.socket.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      const clientUrlClean = env.CLIENT_URL ? env.CLIENT_URL.replace(/\/+$/, '') : '';
      if (
        cleanOrigin === clientUrlClean ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1') ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupMeetingSocket(io);

const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`StudyHub server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
};

start();
