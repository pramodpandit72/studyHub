import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './src/models/User.js';
import SignupVerification from './src/models/SignupVerification.js';
import Meeting from './src/models/Meeting.js';
import Attendance from './src/models/Attendance.js';
import env from './src/config/env.js';
import http from 'http';

dotenv.config();
process.env.NODE_ENV = 'test';

let server;
let baseUrl;

const runTests = async () => {
  console.log('====================================================');
  console.log('    viMeet AUTH (EMAIL OTP SIGNUP) & TEST SUITE     ');
  console.log('====================================================');

  await mongoose.connect(env.MONGO_URI, { dbName: 'vimeet' });
  console.log(`[DB] Connected to MongoDB database: ${mongoose.connection.name}`);

  try {
    const usersCol = mongoose.connection.collection('users');
    const indexes = await usersCol.indexes();
    if (indexes.some((idx) => idx.name === 'mobile_1')) {
      await usersCol.dropIndex('mobile_1');
      console.log('[DB] Dropped legacy unique index mobile_1');
    }
  } catch {}

  // Start server on an ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
  console.log(`[HTTP] Test server listening on port ${port}`);

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      testPassed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      testFailed++;
    }
  };

  const req = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  };

  try {
    const testEmailA = 'ramesh.instructor@example.com';
    const testEmailB = 'priya.student@example.com';

    // Clean up test data
    await User.deleteMany({
      email: { $in: [testEmailA, testEmailB] },
    });
    await SignupVerification.deleteMany({
      email: { $in: [testEmailA, testEmailB] },
    });

    console.log('\n--- 1. SIGNUP & EMAIL OTP VERIFICATION TESTS ---');
    // 1.1 Signup Validation: missing fields
    let res = await req('/auth/signup', 'POST', { name: 'Test User' });
    assert(res.status === 400, 'Signup rejects missing required fields (HTTP 400)');

    // 1.2 Signup Validation: invalid email format
    res = await req('/auth/signup', 'POST', {
      name: 'Test User',
      email: 'invalid-email',
      age: 22,
      role: 'Student',
      password: 'password123',
    });
    assert(res.status === 400, 'Signup rejects invalid email format (HTTP 400)');

    // 1.3 Signup Validation: short password
    res = await req('/auth/signup', 'POST', {
      name: 'User A',
      email: testEmailA,
      age: 25,
      role: 'Teacher',
      password: '123',
    });
    assert(res.status === 400, 'Signup rejects passwords < 6 characters (HTTP 400)');

    // 1.4 Valid Signup Initiation for User A (Sends 4-digit OTP via EmailJS)
    res = await req('/auth/signup', 'POST', {
      name: 'Instructor Ramesh',
      email: testEmailA,
      age: 32,
      role: 'Teacher',
      studyOrPreparation: 'Computer Science',
      institution: 'IIT Delhi',
      experienceLevel: 'Advanced',
      password: 'password123',
    });
    assert(res.status === 200 && res.data.success && res.data.data?.sent, 'Signup initiation sends 4-digit OTP to email (HTTP 200)');
    const devOtpA = res.data.data?.devOtp;
    assert(typeof devOtpA === 'string' && devOtpA.length === 4, '4-digit OTP generated for verification');

    // 1.5 Verify User account does NOT exist in DB prior to OTP verification
    const unverifiedUserDoc = await User.findOne({ email: testEmailA });
    assert(unverifiedUserDoc === null, 'User account is NOT created in DB before OTP is verified');

    // 1.6 Attempting to login before OTP verification fails
    res = await req('/auth/login', 'POST', { email: testEmailA, password: 'password123' });
    assert(res.status === 401, 'Login fails for unverified user (HTTP 401)');

    // 1.7 Verify OTP with incorrect code fails
    res = await req('/auth/signup/verify', 'POST', { email: testEmailA, otp: '0000' });
    assert(res.status === 400 && !res.data.success, 'Verify signup OTP rejects incorrect OTP (HTTP 400)');

    // 1.8 Verify OTP with valid 4-digit code creates account
    res = await req('/auth/signup/verify', 'POST', { email: testEmailA, otp: devOtpA });
    assert(res.status === 201 && res.data.success && res.data.data?.user?.email === testEmailA, 'Verify signup OTP activates account and creates User (HTTP 201)');

    // 1.9 User is now in DB and SignupVerification record is removed
    const createdUserDoc = await User.findOne({ email: testEmailA });
    assert(createdUserDoc !== null && createdUserDoc.email === testEmailA, 'User is now stored in database');
    const pendingRecord = await SignupVerification.findOne({ email: testEmailA });
    assert(pendingRecord === null, 'Pending signup verification record is cleaned up');

    // 1.10 Duplicate email signup rejected
    res = await req('/auth/signup', 'POST', {
      name: 'Duplicate Email User',
      email: testEmailA,
      age: 24,
      role: 'Student',
      password: 'password123',
    });
    assert(res.status === 400 && res.data.message.includes('email'), 'Signup rejects already registered email (HTTP 400)');

    // 1.11 Signup User B (Student) with Email OTP verification
    res = await req('/auth/signup', 'POST', {
      name: 'Student Priya',
      email: testEmailB,
      age: 21,
      role: 'Student',
      studyOrPreparation: 'B.Tech',
      institution: 'NIT Warangal',
      experienceLevel: 'Intermediate',
      password: 'password456',
    });
    assert(res.status === 200 && res.data.data?.sent, 'Signup initiates for User B');
    const devOtpB = res.data.data?.devOtp;
    res = await req('/auth/signup/verify', 'POST', { email: testEmailB, otp: devOtpB });
    assert(res.status === 201 && res.data.data?.user, 'User B verified and created in DB (HTTP 201)');

    console.log('\n--- 2. EMAIL + PASSWORD LOGIN TESTS ---');
    // 2.1 Login missing email or password
    res = await req('/auth/login', 'POST', { email: testEmailA });
    assert(res.status === 400, 'Login rejects missing password (HTTP 400)');

    // 2.2 Login with unregistered email
    res = await req('/auth/login', 'POST', { email: 'unknown@example.com', password: 'password123' });
    assert(res.status === 401, 'Login rejects unregistered email (HTTP 401)');

    // 2.3 Login with incorrect password
    res = await req('/auth/login', 'POST', { email: testEmailA, password: 'wrongpassword' });
    assert(res.status === 401, 'Login rejects incorrect password (HTTP 401)');

    // 2.4 Login User A with valid Email + Password
    res = await req('/auth/login', 'POST', { email: testEmailA, password: 'password123' });
    assert(res.status === 200 && res.data.data?.token && res.data.data?.user?.email === testEmailA, 'User A login succeeds with email + password (HTTP 200)');
    let tokenA = res.data.data?.token;

    // 2.5 Login User B with valid Email + Password
    res = await req('/auth/login', 'POST', { email: testEmailB, password: 'password456' });
    assert(res.status === 200 && res.data.data?.token, 'User B login succeeds with email + password (HTTP 200)');
    const tokenB = res.data.data?.token;

    // 2.6 Auth Check /api/auth/me
    res = await req('/auth/me', 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.user.name === 'Instructor Ramesh', 'Protected route /api/auth/me returns current user');

    // 2.7 Unauthorized access without token
    res = await req('/auth/me', 'GET');
    assert(res.status === 401, 'Protected route rejects requests without token (HTTP 401)');

    console.log('\n--- 3. FORGOT PASSWORD (EMAILJS RECOVERY) TESTS ---');
    // 3.1 Forgot password without email
    res = await req('/auth/forgot-password', 'POST', {});
    assert(res.status === 400, 'Forgot password rejects empty request (HTTP 400)');

    // 3.2 Forgot password for unknown email
    res = await req('/auth/forgot-password', 'POST', { email: 'notfound@example.com' });
    assert(res.status === 404, 'Forgot password returns 404 for unknown email');

    // 3.3 Forgot password for User A
    res = await req('/auth/forgot-password', 'POST', { email: testEmailA });
    assert(res.status === 200 && res.data.success, 'Forgot password initiates successfully for User A (HTTP 200)');
    const devResetCode = res.data.data?.devCode;
    assert(typeof devResetCode === 'string' && devResetCode.length === 6, '6-digit secure reset code generated');

    // 3.4 Verify reset code with invalid code
    res = await req('/auth/verify-reset-code', 'POST', { email: testEmailA, code: '000000' });
    assert(res.status === 400, 'Verify reset code rejects incorrect code (HTTP 400)');

    // 3.5 Verify reset code with valid code
    res = await req('/auth/verify-reset-code', 'POST', { email: testEmailA, code: devResetCode });
    assert(res.status === 200 && res.data.success, 'Verify reset code succeeds with valid code (HTTP 200)');

    // 3.6 Reset password with short password
    res = await req('/auth/reset-password', 'POST', {
      email: testEmailA,
      code: devResetCode,
      newPassword: '123',
    });
    assert(res.status === 400, 'Reset password rejects passwords < 6 characters (HTTP 400)');

    // 3.7 Reset password with valid new password
    const newPasswordA = 'brandNewPassword2026';
    res = await req('/auth/reset-password', 'POST', {
      email: testEmailA,
      code: devResetCode,
      newPassword: newPasswordA,
    });
    assert(res.status === 200 && res.data.success, 'Reset password updates password successfully (HTTP 200)');

    // 3.8 Login with old password fails
    res = await req('/auth/login', 'POST', { email: testEmailA, password: 'password123' });
    assert(res.status === 401, 'Login with old password now fails (HTTP 401)');

    // 3.9 Login with new password succeeds
    res = await req('/auth/login', 'POST', { email: testEmailA, password: newPasswordA });
    assert(res.status === 200 && res.data.data?.token, 'Login with new updated password succeeds (HTTP 200)');
    tokenA = res.data.data?.token;

    // 3.10 Attempting to reuse same reset code fails
    res = await req('/auth/reset-password', 'POST', {
      email: testEmailA,
      code: devResetCode,
      newPassword: 'anotherPassword',
    });
    assert(res.status === 400, 'Reusing expired/cleared reset code is rejected (HTTP 400)');

    console.log('\n--- 4. USER PROFILE TESTS ---');
    // 4.1 Get profile
    res = await req('/users/profile', 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.user.email === testEmailA, 'Get profile returns correct user details with email');

    // 4.2 Update profile safe fields
    res = await req('/users/profile', 'PUT', {
      name: 'Dr. Ramesh Kumar',
      institution: 'IIT Delhi - Dept of CSE',
      themePreference: 'dark',
    }, tokenA);
    assert(res.status === 200 && res.data.data.user.name === 'Dr. Ramesh Kumar', 'Update profile successfully modifies name and institution');

    console.log('\n--- 5. MEETING LIFECYCLE & AUTHORIZATION TESTS ---');
    // 5.1 Create Scheduled Meeting
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const futureEndDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    res = await req('/meetings', 'POST', {
      title: 'Advanced Algorithms Class',
      description: 'Graph Theory & Dynamic Programming',
      meetingType: 'scheduled',
      startTime: futureDate,
      endTime: futureEndDate,
      maxParticipants: 40,
      waitingRoom: false,
    }, tokenA);
    assert(res.status === 201 && res.data.data.meeting.meetingCode, 'Host creates scheduled meeting (HTTP 201)');
    const meetingA = res.data.data.meeting;
    const meetingCodeA = meetingA.meetingCode;
    const meetingIdA = meetingA._id;

    // 5.2 Scheduled Meeting Start/End Time Validation (End <= Start)
    res = await req('/meetings', 'POST', {
      title: 'Invalid Meeting',
      meetingType: 'scheduled',
      startTime: futureEndDate,
      endTime: futureDate,
    }, tokenA);
    assert(res.status === 400, 'Rejects scheduled meeting when end time <= start time (HTTP 400)');

    // 5.3 Get meeting by code
    res = await req(`/meetings/code/${meetingCodeA}`, 'GET', null, tokenB);
    assert(res.status === 200 && res.data.data.meeting.title === 'Advanced Algorithms Class', 'Get meeting by 6-char code succeeds');

    // 5.4 Authorization check: User B attempts to edit User A meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { title: 'Hacked Title' }, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT update User A meeting (HTTP 403)');

    // 5.5 Authorization check: User B attempts to delete User A meeting
    res = await req(`/meetings/${meetingIdA}`, 'DELETE', null, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT delete User A meeting (HTTP 403)');

    // 5.6 Host updates meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { description: 'Updated Syllabus' }, tokenA);
    assert(res.status === 200 && res.data.data.meeting.description === 'Updated Syllabus', 'Host User A successfully updates meeting');

    // 5.7 Host joins their scheduled meeting -> triggers state transition to LIVE
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenA);
    assert(res.status === 200, 'Host joins meeting');
    const meetingAfterHostJoin = await Meeting.findById(meetingIdA);
    assert(meetingAfterHostJoin.status === 'live', 'Meeting transitions from scheduled to LIVE when host joins');

    // 5.8 Participant User B joins meeting
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenB);
    assert(res.status === 200, 'Participant User B successfully joins live meeting');

    console.log('\n--- 6. ATTENDANCE SYSTEM TESTS ---');
    // 6.1 Attendance record created for User A upon joining
    const userADoc = await User.findOne({ email: testEmailA });
    const attendanceDoc = await Attendance.findOne({ meeting: meetingIdA, user: userADoc._id });
    assert(attendanceDoc !== null && attendanceDoc.status === 'Present', 'Attendance record automatically created for Host');

    // 6.2 User B leaves meeting via API
    res = await req(`/meetings/${meetingIdA}/leave`, 'POST', null, tokenB);
    assert(res.status === 200, 'User B leaves meeting (HTTP 200)');

    // 6.3 Check leftAt is populated on User B attendance
    const userBDoc = await User.findOne({ email: testEmailB });
    const attB = await Attendance.findOne({ meeting: meetingIdA, user: userBDoc._id });
    assert(attB !== null && attB.leftAt !== null, 'User B attendance leftAt timestamp recorded on leave');
    assert(typeof attB.duration === 'number' && attB.duration >= 0, 'User B attendance duration calculated in minutes');

    // 6.4 Non-host User B attempts to access Host attendance summary
    res = await req(`/attendance/meeting/${meetingIdA}`, 'GET', null, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT view host attendance report (HTTP 403)');

    // 6.5 Host User A accesses attendance report
    res = await req(`/attendance/meeting/${meetingIdA}`, 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.summary.total >= 1, 'Host User A accesses attendance summary with metrics');

    // 6.6 User B checks their own personal attendance
    res = await req('/attendance/my', 'GET', null, tokenB);
    assert(res.status === 200 && Array.isArray(res.data.data.attendance), 'User B can fetch their personal attendance history');

    console.log('\n--- 7. MEETING COMPLETION & STATE IMMUTABILITY ---');
    // 7.1 Host ends meeting
    res = await req(`/meetings/${meetingIdA}/end`, 'POST', null, tokenA);
    assert(res.status === 200, 'Host successfully ends meeting (HTTP 200)');
    const endedMtg = await Meeting.findById(meetingIdA);
    assert(endedMtg.status === 'completed', 'Meeting status updated to completed');

    // 7.2 Attempt to join completed meeting
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenB);
    assert(res.status === 400, 'Blocked from joining a completed meeting (HTTP 400)');

    // 7.3 Attempt to restart completed meeting
    res = await req(`/meetings/${meetingIdA}/start`, 'POST', null, tokenA);
    assert(res.status === 400, 'Blocked from starting an already completed meeting (HTTP 400)');

    // 7.4 Attempt to edit completed meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { title: 'New Title' }, tokenA);
    assert(res.status === 400, 'Blocked from updating an already completed meeting (HTTP 400)');

    // Clean up test data
    await Meeting.deleteMany({ _id: meetingIdA });
    await Attendance.deleteMany({ meeting: meetingIdA });
    await User.deleteMany({
      email: { $in: [testEmailA, testEmailB] },
    });
    await SignupVerification.deleteMany({
      email: { $in: [testEmailA, testEmailB] },
    });

    console.log('\n====================================================');
    console.log(`TOTAL RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log('====================================================');

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runTests();
