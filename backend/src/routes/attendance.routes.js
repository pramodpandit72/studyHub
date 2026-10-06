import { Router } from 'express';
import { getMeetingAttendance, getMyAttendance } from '../controllers/attendance.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/my', protect, getMyAttendance);
router.get('/meeting/:id', protect, getMeetingAttendance);

export default router;
