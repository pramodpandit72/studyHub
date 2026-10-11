import { Router } from 'express';
import {
  getMockTests,
  getMockTestById,
  createMockTest,
  deleteMockTest,
  submitMockTest,
  getAttemptResult,
  getMyAttempts,
  getSessionStatus,
  startTestSession,
  saveSessionAnswer,
  recordSessionActivity,
  resumeTestSession,
} from '../controllers/mockTest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Test discovery & management
router.get('/', protect, getMockTests);
router.post('/', protect, createMockTest);
router.get('/my-attempts', protect, getMyAttempts);
router.get('/attempt/:attemptId', protect, getAttemptResult);
router.get('/:id', protect, getMockTestById);
router.delete('/:id', protect, deleteMockTest);

// Active Test Session Management (Security, Resumes & Activity Tracking)
router.get('/:id/session/status', protect, getSessionStatus);
router.post('/:id/session/start', protect, startTestSession);
router.post('/:id/session/save-answer', protect, saveSessionAnswer);
router.post('/:id/session/activity', protect, recordSessionActivity);
router.post('/:id/session/resume', protect, resumeTestSession);

// Final Submission
router.post('/:id/submit', protect, submitMockTest);

export default router;
