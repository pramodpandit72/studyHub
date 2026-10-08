import { Router } from 'express';
import {
  getMockTests,
  getMockTestById,
  submitMockTest,
  getAttemptResult,
  getMyAttempts,
} from '../controllers/mockTest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getMockTests);
router.get('/my-attempts', protect, getMyAttempts);
router.get('/attempt/:attemptId', protect, getAttemptResult);
router.get('/:id', protect, getMockTestById);
router.post('/:id/submit', protect, submitMockTest);

export default router;
