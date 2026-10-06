import { Router } from 'express';
import {
  createMeeting, getMeetings, getMeetingById, getMeetingByCode,
  updateMeeting, deleteMeeting, joinMeeting, leaveMeeting,
  startMeeting, endMeeting, getUpcoming, getHistory,
  admitParticipant, removeParticipant,
} from '../controllers/meeting.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', protect, createMeeting);
router.get('/', protect, getMeetings);
router.get('/upcoming', protect, getUpcoming);
router.get('/history', protect, getHistory);
router.get('/code/:code', protect, getMeetingByCode);
router.get('/:id', protect, getMeetingById);
router.put('/:id', protect, updateMeeting);
router.delete('/:id', protect, deleteMeeting);
router.post('/join/:code', protect, joinMeeting);
router.post('/:id/leave', protect, leaveMeeting);
router.post('/:id/start', protect, startMeeting);
router.post('/:id/end', protect, endMeeting);
router.post('/:id/admit', protect, admitParticipant);
router.post('/:id/remove', protect, removeParticipant);

export default router;
