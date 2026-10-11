import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend 1: Login Form Validation & Concurrency Protection', () => {
  const validateLoginForm = (email, password) => {
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
      return { valid: false, error: 'Please enter your email address.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }

    if (!password) {
      return { valid: false, error: 'Please enter your password.' };
    }

    return { valid: true, error: null, normalizedEmail: trimmedEmail.toLowerCase() };
  };

  it('rejects empty email', () => {
    const res = validateLoginForm('', 'password123');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Please enter your email address.');
  });

  it('rejects whitespace-only email', () => {
    const res = validateLoginForm('   ', 'password123');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Please enter your email address.');
  });

  it('rejects invalid email formats', () => {
    const res1 = validateLoginForm('invalid-email', 'password123');
    assert.equal(res1.valid, false);
    assert.equal(res1.error, 'Please enter a valid email address.');

    const res2 = validateLoginForm('user@domain', 'password123');
    assert.equal(res2.valid, false);
  });

  it('rejects empty password', () => {
    const res = validateLoginForm('valid@example.com', '');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Please enter your password.');
  });

  it('accepts valid credentials and normalizes email', () => {
    const res = validateLoginForm('  User.Name@Example.Com  ', 'MySecretPass123');
    assert.equal(res.valid, true);
    assert.equal(res.error, null);
    assert.equal(res.normalizedEmail, 'user.name@example.com');
  });

  it('prevents duplicate submissions when submission lock is active', () => {
    let isSubmitting = false;
    let callCount = 0;

    const attemptSubmit = () => {
      if (isSubmitting) return 'BLOCKED';
      isSubmitting = true;
      callCount++;
      return 'SUBMITTED';
    };

    // First click
    assert.equal(attemptSubmit(), 'SUBMITTED');
    assert.equal(callCount, 1);

    // Rapid double click
    assert.equal(attemptSubmit(), 'BLOCKED');
    assert.equal(attemptSubmit(), 'BLOCKED');
    assert.equal(callCount, 1);

    // After async completion
    isSubmitting = false;
    assert.equal(attemptSubmit(), 'SUBMITTED');
    assert.equal(callCount, 2);
  });
});

describe('Frontend 2: Signup Form Validation Rules', () => {
  const validateSignupForm = ({ name, email, age, role, password }) => {
    if (!name?.trim()) return { valid: false, error: 'Name is required' };
    if (!email?.trim()) return { valid: false, error: 'Email is required' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return { valid: false, error: 'Invalid email' };

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      return { valid: false, error: 'Age must be between 10 and 120' };
    }

    if (!role) return { valid: false, error: 'Role is required' };
    if (!password || password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };

    return { valid: true, error: null };
  };

  it('validates all required signup fields and age constraints', () => {
    assert.equal(validateSignupForm({ name: '', email: 'a@b.com', age: 20, role: 'Student', password: '123456' }).valid, false);
    assert.equal(validateSignupForm({ name: 'Alex', email: 'a@b.com', age: 8, role: 'Student', password: '123456' }).valid, false);
    assert.equal(validateSignupForm({ name: 'Alex', email: 'a@b.com', age: 25, role: 'Student', password: '123' }).valid, false);
    assert.equal(validateSignupForm({ name: 'Alex', email: 'alex@example.com', age: 25, role: 'Student', password: 'password123' }).valid, true);
  });
});

describe('Frontend 3: 6-Digit OTP Box & Clipboard Paste Logic', () => {
  it('parses numeric characters from pasted text and fills 6 digits', () => {
    const parsePaste = (pastedText) => {
      const cleaned = pastedText.replace(/\D/g, '').slice(0, 6);
      const digits = ['', '', '', '', '', ''];
      for (let i = 0; i < cleaned.length; i++) {
        digits[i] = cleaned[i];
      }
      return { digits, isComplete: cleaned.length === 6 };
    };

    assert.deepEqual(parsePaste('123456'), {
      digits: ['1', '2', '3', '4', '5', '6'],
      isComplete: true,
    });

    assert.deepEqual(parsePaste('Code: 987-654!'), {
      digits: ['9', '8', '7', '6', '5', '4'],
      isComplete: true,
    });

    assert.deepEqual(parsePaste('123'), {
      digits: ['1', '2', '3', '', '', ''],
      isComplete: false,
    });
  });

  it('formats email masking correctly for security', () => {
    const maskEmail = (str) => {
      if (!str || !str.includes('@')) return str;
      const [user, domain] = str.split('@');
      if (user.length <= 2) return `${user}***@${domain}`;
      return `${user.substring(0, 2)}***${user.slice(-1)}@${domain}`;
    };

    assert.equal(maskEmail('john.doe@gmail.com'), 'jo***e@gmail.com');
    assert.equal(maskEmail('me@test.org'), 'me***@test.org');
  });
});

describe('Frontend 4: Forgot Password Validation Rules', () => {
  const validateResetPassword = (newPassword, confirmPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { valid: false, error: 'New password must be at least 6 characters.' };
    }
    if (newPassword !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match.' };
    }
    return { valid: true, error: null };
  };

  it('validates password matching and length', () => {
    assert.equal(validateResetPassword('short', 'short').valid, false);
    assert.equal(validateResetPassword('pass1234', 'pass5678').valid, false);
    assert.equal(validateResetPassword('securePass1', 'securePass1').valid, true);
  });
});

describe('Frontend 5: Meeting Status and Time Formatting', () => {
  it('formats meeting countdown and elapsed time accurately', () => {
    const formatDuration = (totalSeconds) => {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    assert.equal(formatDuration(0), '00:00');
    assert.equal(formatDuration(65), '01:05');
    assert.equal(formatDuration(3600), '60:00');
  });

  it('determines if meeting code is valid (6 alphanumeric characters)', () => {
    const isMeetingCodeValid = (code) => /^[A-Z0-9]{6}$/i.test((code || '').trim());

    assert.equal(isMeetingCodeValid('A1B2C3'), true);
    assert.equal(isMeetingCodeValid('xyz999'), true);
    assert.equal(isMeetingCodeValid('12345'), false);
    assert.equal(isMeetingCodeValid('1234567'), false);
    assert.equal(isMeetingCodeValid('AB-123'), false);
  });
});

describe('Frontend 6: Dynamic Multi-User Video Grid Layout Calculation', () => {
  const getGridClass = (remoteParticipantsCount) => {
    const totalTiles = 1 + remoteParticipantsCount;
    if (totalTiles === 1) return 'grid-cols-1';
    if (totalTiles === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalTiles <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (totalTiles <= 6) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  it('calculates correct responsive grid CSS classes for any number of participants', () => {
    assert.equal(getGridClass(0), 'grid-cols-1'); // 1 local tile
    assert.equal(getGridClass(1), 'grid-cols-1 md:grid-cols-2'); // 2 tiles
    assert.equal(getGridClass(3), 'grid-cols-1 sm:grid-cols-2'); // 4 tiles
    assert.equal(getGridClass(5), 'grid-cols-2 lg:grid-cols-3'); // 6 tiles
    assert.equal(getGridClass(8), 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'); // 9 tiles
  });
});

describe('Frontend 7: Screen Sharing Presentation Mode & Filmstrip Filtering', () => {
  it('correctly filters presenter out of filmstrip to prevent duplicate tile & audio echo', () => {
    const participants = [
      { socketId: 'sock-A', userId: 'user-A', name: 'User A' },
      { socketId: 'sock-B', userId: 'user-B', name: 'User B' },
      { socketId: 'sock-C', userId: 'user-C', name: 'User C' },
    ];

    const currentUserId = 'user-A';
    const activeScreenShare = { socketId: 'sock-B', user: { name: 'User B' } };

    const remoteParticipants = participants.filter((p) => p.userId !== currentUserId);
    assert.equal(remoteParticipants.length, 2);

    const filmstripParticipants = remoteParticipants.filter(
      (p) => !activeScreenShare || activeScreenShare.socketId !== p.socketId
    );

    // sock-B is presenting, so only sock-C appears in the camera filmstrip
    assert.equal(filmstripParticipants.length, 1);
    assert.equal(filmstripParticipants[0].socketId, 'sock-C');
  });
});

describe('Frontend 8: Real-Time Poll Notification Trigger Logic', () => {
  it('triggers notification banner only for non-host participants when poll is active and panel is closed', () => {
    const shouldShowNotification = ({ activePoll, isHost, isPollOpen }) => {
      return Boolean(activePoll?.isActive && !isHost && !isPollOpen);
    };

    // Host should NOT see floating banner (they are already in control)
    assert.equal(
      shouldShowNotification({ activePoll: { isActive: true }, isHost: true, isPollOpen: false }),
      false
    );

    // Participant with panel open should NOT see banner
    assert.equal(
      shouldShowNotification({ activePoll: { isActive: true }, isHost: false, isPollOpen: true }),
      false
    );

    // Participant with panel closed receives real-time notification
    assert.equal(
      shouldShowNotification({ activePoll: { isActive: true }, isHost: false, isPollOpen: false }),
      true
    );

    // Closed/Ended poll does not trigger notification
    assert.equal(
      shouldShowNotification({ activePoll: { isActive: false }, isHost: false, isPollOpen: false }),
      false
    );
  });
});

describe('Frontend 9: Chat File Sharing Classification & Payload Logic', () => {
  const getFileTypeInfo = (file) => {
    if (!file) return { category: 'file', label: 'FILE' };
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
      return { category: 'image', label: 'IMG' };
    }
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return { category: 'pdf', label: 'PDF' };
    }
    if (
      type.includes('msword') ||
      type.includes('wordprocessingml') ||
      /\.(docx?)$/i.test(name)
    ) {
      return { category: 'word', label: 'DOC' };
    }
    return { category: 'file', label: 'FILE' };
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  it('correctly classifies image files (PNG, JPG, WEBP)', () => {
    assert.equal(getFileTypeInfo({ name: 'diagram.png', type: 'image/png' }).category, 'image');
    assert.equal(getFileTypeInfo({ name: 'photo.JPEG', type: 'image/jpeg' }).category, 'image');
    assert.equal(getFileTypeInfo({ name: 'graphic.webp', type: '' }).category, 'image');
  });

  it('correctly classifies PDF files', () => {
    assert.equal(getFileTypeInfo({ name: 'lecture_notes.pdf', type: 'application/pdf' }).category, 'pdf');
    assert.equal(getFileTypeInfo({ name: 'syllabus.pdf', type: '' }).label, 'PDF');
  });

  it('correctly classifies Word documents (.doc and .docx)', () => {
    assert.equal(getFileTypeInfo({ name: 'assignment.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).category, 'word');
    assert.equal(getFileTypeInfo({ name: 'project_report.doc', type: 'application/msword' }).category, 'word');
    assert.equal(getFileTypeInfo({ name: 'notes.DOCX', type: '' }).label, 'DOC');
  });

  it('correctly formats file sizes into human-readable strings', () => {
    assert.equal(formatFileSize(0), '0 B');
    assert.equal(formatFileSize(500), '500 B');
    assert.equal(formatFileSize(1024), '1 KB');
    assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.5 MB');
  });

  it('validates file size within 10MB threshold', () => {
    const MAX_SIZE = 10 * 1024 * 1024;
    const isFileValid = (size) => size <= MAX_SIZE;

    assert.equal(isFileValid(2 * 1024 * 1024), true); // 2 MB is allowed
    assert.equal(isFileValid(10 * 1024 * 1024), true); // 10 MB is allowed
    assert.equal(isFileValid(11 * 1024 * 1024), false); // 11 MB is rejected
  });

  it('normalizes chat message payload with both text and file attachment', () => {
    const normalizePayload = (content, file = null) => {
      let textContent = '';
      let fileData = null;
      if (typeof content === 'object' && content !== null) {
        textContent = content.text || content.content || content.message || '';
        fileData = content.file || file || null;
      } else {
        textContent = content || '';
        fileData = file || null;
      }
      return {
        message: textContent.trim(),
        file: fileData,
        hasContent: Boolean(textContent.trim() || fileData),
      };
    };

    // Text only
    const res1 = normalizePayload('Hello world');
    assert.equal(res1.message, 'Hello world');
    assert.equal(res1.file, null);
    assert.equal(res1.hasContent, true);

    // File only
    const fileObj = { name: 'report.docx', size: 1024, type: 'application/msword', dataUrl: 'data:...' };
    const res2 = normalizePayload({ text: '', file: fileObj });
    assert.equal(res2.message, '');
    assert.deepEqual(res2.file, fileObj);
    assert.equal(res2.hasContent, true);

    // Text + File
    const res3 = normalizePayload({ text: 'Please find attached', file: fileObj });
    assert.equal(res3.message, 'Please find attached');
    assert.deepEqual(res3.file, fileObj);
    assert.equal(res3.hasContent, true);

    // Empty
    const res4 = normalizePayload('');
    assert.equal(res4.hasContent, false);
  });
});

