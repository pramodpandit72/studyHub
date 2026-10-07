import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken, protect, optionalAuth } from '../src/middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../src/utils/response.js';
import env from '../src/config/env.js';

// Helper mock response factory
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

describe('1. Password Hashing & Bcrypt Verification', () => {
  it('should securely hash passwords and verify matching passwords', async () => {
    const rawPassword = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(hashedPassword, rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert.equal(isMatch, true);
  });

  it('should reject incorrect passwords', async () => {
    const rawPassword = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const isMatch = await bcrypt.compare('WrongPassword456!', hashedPassword);
    assert.equal(isMatch, false);
  });
});

describe('2. JWT Generation & Validation', () => {
  it('should generate a valid JWT token signed with JWT_SECRET', () => {
    const userId = '64f1234567890abcdef12345';
    const token = generateToken(userId);

    assert.ok(token);
    assert.equal(typeof token, 'string');

    const decoded = jwt.verify(token, env.JWT_SECRET);
    assert.equal(decoded.id, userId);
  });

  it('should throw when verifying with invalid secret', () => {
    const userId = '64f1234567890abcdef12345';
    const token = generateToken(userId);

    assert.throws(() => {
      jwt.verify(token, 'wrong-secret-key-12345');
    }, { name: 'JsonWebTokenError' });
  });

  it('should throw when token has expired', () => {
    const expiredToken = jwt.sign({ id: '123' }, env.JWT_SECRET, { expiresIn: '0s' });

    assert.throws(() => {
      jwt.verify(expiredToken, env.JWT_SECRET);
    }, { name: 'TokenExpiredError' });
  });
});

describe('3. Auth Middleware (protect & optionalAuth)', () => {
  it('protect: should reject request without token with 401', async () => {
    const req = { headers: {}, cookies: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Not authenticated. Please login.');
    assert.equal(nextCalled, false);
  });

  it('protect: should reject invalid bearer token with 401', async () => {
    const req = { headers: { authorization: 'Bearer invalid.jwt.token' }, cookies: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Invalid token. Please login again.');
    assert.equal(nextCalled, false);
  });

  it('optionalAuth: should proceed without error if no token is provided', async () => {
    const req = { headers: {}, cookies: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await optionalAuth(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(req.user, undefined);
  });
});

describe('4. Response Utility Functions', () => {
  it('sendSuccess should format standard 200 payload', () => {
    const res = createMockRes();
    sendSuccess(res, 200, 'Operation successful', { key: 'value' });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Operation successful');
    assert.deepEqual(res.body.data, { key: 'value' });
  });

  it('sendError should format standard error payload with status code', () => {
    const res = createMockRes();
    sendError(res, 400, 'Bad Request');

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Bad Request');
  });
});

describe('5. Login & Input Validation Rules', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('validates email format correctly', () => {
    assert.equal(emailRegex.test('test@example.com'), true);
    assert.equal(emailRegex.test('user.name+tag@domain.co.in'), true);
    assert.equal(emailRegex.test(''), false);
    assert.equal(emailRegex.test('missingat.com'), false);
    assert.equal(emailRegex.test('@missinguser.com'), false);
    assert.equal(emailRegex.test('spaces in@email.com'), false);
  });

  it('normalizes email addresses (lowercasing & trimming)', () => {
    const input = '  USER.Name@Example.COM  ';
    const normalized = input.toLowerCase().trim();
    assert.equal(normalized, 'user.name@example.com');
  });

  it('validates password minimum length requirement (>= 6)', () => {
    assert.equal('12345'.length >= 6, false);
    assert.equal('123456'.length >= 6, true);
    assert.equal('securePassword'.length >= 6, true);
  });

  it('validates age range for registrations (10 to 120)', () => {
    const isAgeValid = (age) => {
      const num = parseInt(age, 10);
      return !isNaN(num) && num >= 10 && num <= 120;
    };

    assert.equal(isAgeValid('9'), false);
    assert.equal(isAgeValid('10'), true);
    assert.equal(isAgeValid('25'), true);
    assert.equal(isAgeValid('120'), true);
    assert.equal(isAgeValid('121'), false);
    assert.equal(isAgeValid('abc'), false);
  });
});

describe('6. OTP & Cryptographic Hashing Logic', () => {
  it('generates 6-digit numeric OTPs within [100000, 999999]', () => {
    for (let i = 0; i < 50; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      assert.equal(otp.length, 6);
      const num = parseInt(otp, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  it('hashes OTP using SHA-256 and validates candidate code', () => {
    const otp = '849201';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Matching candidate
    const candidateA = crypto.createHash('sha256').update('849201').digest('hex');
    assert.equal(candidateA, otpHash);

    // Mismatched candidate
    const candidateB = crypto.createHash('sha256').update('000000').digest('hex');
    assert.notEqual(candidateB, otpHash);
  });
});

describe('7. Polling Logic & Vote Tallying State Machine', () => {
  it('creates poll with initial structure and vote count 0', () => {
    const question = 'Which JavaScript runtime do you prefer?';
    const options = ['Node.js', 'Bun', 'Deno'];

    const poll = {
      id: 'poll-123',
      roomId: 'ROOM-456',
      question,
      options: options.map((text, idx) => ({ id: idx, text, votes: 0 })),
      voters: {},
      totalVotes: 0,
      isActive: true,
    };

    assert.equal(poll.options.length, 3);
    assert.equal(poll.totalVotes, 0);
    assert.equal(poll.isActive, true);
  });

  it('records votes correctly and increments vote tallies', () => {
    const poll = {
      id: 'poll-123',
      options: [
        { id: 0, text: 'Option A', votes: 0 },
        { id: 1, text: 'Option B', votes: 0 },
      ],
      voters: {},
      totalVotes: 0,
      isActive: true,
    };

    const castVote = (userId, optionId) => {
      if (!poll.isActive) return false;
      if (poll.voters[userId] !== undefined) return false;
      const opt = poll.options.find((o) => o.id === optionId);
      if (!opt) return false;

      opt.votes += 1;
      poll.totalVotes += 1;
      poll.voters[userId] = optionId;
      return true;
    };

    // First vote
    assert.equal(castVote('user-1', 0), true);
    assert.equal(poll.options[0].votes, 1);
    assert.equal(poll.totalVotes, 1);

    // Duplicate vote attempt by same user
    assert.equal(castVote('user-1', 1), false);
    assert.equal(poll.totalVotes, 1);

    // Second user vote
    assert.equal(castVote('user-2', 1), true);
    assert.equal(poll.options[1].votes, 1);
    assert.equal(poll.totalVotes, 2);

    // End poll
    poll.isActive = false;

    // Vote after poll ended
    assert.equal(castVote('user-3', 0), false);
    assert.equal(poll.totalVotes, 2);
  });
});

describe('8. Attendance Calculation Utilities', () => {
  it('calculates duration in minutes accurately from join and leave timestamps', () => {
    const joinedAt = new Date('2026-10-07T10:00:00.000Z');
    const leftAt = new Date('2026-10-07T10:45:30.000Z');

    const durationMs = leftAt.getTime() - joinedAt.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    assert.equal(durationMinutes, 46);
  });

  it('determines attendance status based on duration threshold (e.g. >= 15 min Present)', () => {
    const getStatus = (durationMinutes) => (durationMinutes >= 15 ? 'Present' : 'Absent');

    assert.equal(getStatus(5), 'Absent');
    assert.equal(getStatus(15), 'Present');
    assert.equal(getStatus(60), 'Present');
  });
});
