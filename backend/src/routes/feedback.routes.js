import express from 'express';
import { createFeedback, getMyFeedback } from '../controllers/feedback.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', optionalAuth, createFeedback);
router.get('/my', protect, getMyFeedback);

export default router;
