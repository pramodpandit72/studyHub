import Meeting from '../models/Meeting.js';
import { generateMeetingCode } from '../utils/generateCode.js';

const meetingService = {
  async generateUniqueMeetingCode() {
    let code;
    let exists = true;
    while (exists) {
      code = generateMeetingCode();
      exists = await Meeting.findOne({ meetingCode: code }).lean();
    }
    return code;
  },

  getStatusLabel(meeting) {
    const now = new Date();
    if (meeting.status === 'cancelled') return 'Cancelled';
    if (meeting.status === 'completed') return 'Completed';
    if (meeting.status === 'live') return 'Live';
    if (meeting.startTime > now) return 'Scheduled';
    return meeting.status;
  },
};

export default meetingService;
