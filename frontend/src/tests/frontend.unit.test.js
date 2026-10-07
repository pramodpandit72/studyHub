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
