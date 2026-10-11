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
      const clientUrls = env.CLIENT_URL
        ? env.CLIENT_URL.split(',').map((u) => {
            let clean = u.trim().replace(/\/+$/, '');
            if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
              clean = `https://${clean}`;
            }
            return clean;
          })
        : [];
      if (
        clientUrls.includes(cleanOrigin) ||
        cleanOrigin === 'https://studyhub.online' ||
        cleanOrigin === 'https://www.studyhub.online' ||
        cleanOrigin.endsWith('.studyhub.online') ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 2e7,
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
