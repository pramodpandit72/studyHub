import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import env from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import mockTestRoutes from './routes/mockTest.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const clientUrls = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((u) => {
      let clean = u.trim().replace(/\/+$/, '');
      if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      return clean;
    })
  : [];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/+$/, '');
  return (
    clientUrls.includes(cleanOrigin) ||
    cleanOrigin === 'https://studyhub.online' ||
    cleanOrigin === 'https://www.studyhub.online' ||
    cleanOrigin.endsWith('.studyhub.online') ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1')
  );
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'StudyHub Backend API is live and operational.',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      meetings: '/api/meetings',
    },
  });
});

app.get('/api', (req, res) => {
  res.json({ success: true, message: 'StudyHub API root.' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'StudyHub API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/mock-tests', mockTestRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;

