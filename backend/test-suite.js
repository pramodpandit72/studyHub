import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './src/models/User.js';
import Meeting from './src/models/Meeting.js';
import Attendance from './src/models/Attendance.js';
import Otp from './src/models/Otp.js';
import env from './src/config/env.js';
import http from 'http';

dotenv.config();
process.env.NODE_ENV = 'test';

let server;
let baseUrl;

const runTests = async () => {
  console.log('====================================================');
  console.log('       viMeet AUTOMATED QA & INTEGRATION TEST       ');
  console.log('====================================================');

  await mongoose.connect(env.MONGO_URI);
  console.log('[DB] Connected to MongoDB');

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
    // Clean test data for our test mobile numbers
    const testMobileA = '9998881111';
    const testMobileB = '9998882222';
    await User.deleteMany({ mobile: { $in: [testMobileA, testMobileB] } });
    await Otp.deleteMany({ mobile: { $in: [testMobileA, testMobileB] } });

    console.log('\n--- 1. AUTHENTICATION & ONBOARDING TESTS ---');
    // 1.1 Signup Validation: missing fields
    let res = await req('/auth/signup', 'POST', { name: 'Test' });
    assert(res.status === 400, 'Signup rejects missing fields (HTTP 400)');

    // 1.2 Signup Validation: invalid mobile
    res = await req('/auth/signup', 'POST', {
      name: 'Test',
      mobile: '123',
      age: 22,
      role: 'Student',
      password: 'password123',
    });
    assert(res.status === 400, 'Signup rejects invalid 10-digit mobile (HTTP 400)');

    // 1.3 Signup Validation: short password
    res = await req('/auth/signup', 'POST', {
      name: 'User A',
      mobile: testMobileA,
      age: 25,
      role: 'Teacher',
      password: '123',
    });
    assert(res.status === 400, 'Signup rejects passwords < 6 characters (HTTP 400)');

    // 1.4 Valid Signup User A
    res = await req('/auth/signup', 'POST', {
      name: 'Instructor Ramesh',
      mobile: testMobileA,
      age: 32,
      role: 'Teacher',
      studyOrPreparation: 'Computer Science',
      institution: 'IIT Delhi',
      experienceLevel: 'Advanced',
      password: 'password123',
    });
    assert(res.status === 201 && res.data.success, 'Valid signup succeeds for User A (HTTP 201)');

    // 1.5 Send Signup OTP for User A
    res = await req('/auth/send-otp', 'POST', { mobile: testMobileA, type: 'signup' });
    assert(res.status === 200 && res.data.success, 'Send signup OTP succeeds (HTTP 200)');
    const devOtpA = res.data.data?.devOtp;
    assert(typeof devOtpA === 'string' && devOtpA.length === 4, '4-digit OTP is generated');

    // 1.6 Verify incorrect OTP fails
    res = await req('/auth/verify-otp', 'POST', { mobile: testMobileA, otp: '0000', type: 'signup' });
    assert(res.status === 400 && !res.data.success, 'Incorrect OTP is rejected (HTTP 400)');

    // 1.7 Verify valid OTP for User A
    res = await req('/auth/verify-otp', 'POST', { mobile: testMobileA, otp: devOtpA, type: 'signup' });
    assert(res.status === 200 && res.data.data?.token, 'Correct OTP verifies User A and issues JWT');
    const tokenA = res.data.data?.token;

    // 1.8 Verify User A profile isMobileVerified is true
    const userADoc = await User.findOne({ mobile: testMobileA });
    assert(userADoc && userADoc.isMobileVerified === true, 'User A is marked isMobileVerified = true in DB');

    // 1.9 Signup User B (Participant / Student)
    res = await req('/auth/signup', 'POST', {
      name: 'Student Priya',
      mobile: testMobileB,
      age: 21,
      role: 'Student',
      studyOrPreparation: 'B.Tech',
      institution: 'NIT Warangal',
      experienceLevel: 'Intermediate',
      password: 'password456',
    });
    assert(res.status === 201, 'Valid signup succeeds for User B (HTTP 201)');

    res = await req('/auth/send-otp', 'POST', { mobile: testMobileB, type: 'signup' });
    const devOtpB = res.data.data?.devOtp;
    res = await req('/auth/verify-otp', 'POST', { mobile: testMobileB, otp: devOtpB, type: 'signup' });
    const tokenB = res.data.data?.token;
    assert(res.status === 200 && tokenB, 'User B verified with JWT');

    // 1.10 Mobile Login Flow
    res = await req('/auth/send-otp', 'POST', { mobile: testMobileA, type: 'login' });
    assert(res.status === 200, 'Send login OTP succeeds');
    const loginOtp = res.data.data?.devOtp;
    res = await req('/auth/login', 'POST', { mobile: testMobileA, otp: loginOtp });
    assert(res.status === 200 && res.data.data?.token, 'Login with mobile + OTP succeeds and returns JWT');

    // 1.11 Auth Check /api/auth/me
    res = await req('/auth/me', 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.user.name === 'Instructor Ramesh', 'Protected route /api/auth/me returns current user');

    // 1.12 Unauthorized access without token
    res = await req('/auth/me', 'GET');
    assert(res.status === 401, 'Protected route rejects requests without token (HTTP 401)');

    console.log('\n--- 2. USER PROFILE TESTS ---');
    // 2.1 Get profile
    res = await req('/users/profile', 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.user.mobile === testMobileA, 'Get profile returns correct user details');

    // 2.2 Update profile safe fields
    res = await req('/users/profile', 'put', {
      name: 'Dr. Ramesh Kumar',
      institution: 'IIT Delhi - Dept of CSE',
      themePreference: 'dark',
    }, tokenA);
    assert(res.status === 200 && res.data.data.user.name === 'Dr. Ramesh Kumar', 'Update profile successfully modifies name and institution');

    console.log('\n--- 3. MEETING LIFECYCLE & AUTHORIZATION TESTS ---');
    // 3.1 Create Scheduled Meeting
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

    // 3.2 Scheduled Meeting Start/End Time Validation (End <= Start)
    res = await req('/meetings', 'POST', {
      title: 'Invalid Meeting',
      meetingType: 'scheduled',
      startTime: futureEndDate,
      endTime: futureDate, // End before start
    }, tokenA);
    assert(res.status === 400, 'Rejects scheduled meeting when end time <= start time (HTTP 400)');

    // 3.3 Get meeting by code
    res = await req(`/meetings/code/${meetingCodeA}`, 'GET', null, tokenB);
    assert(res.status === 200 && res.data.data.meeting.title === 'Advanced Algorithms Class', 'Get meeting by 6-char code succeeds');

    // 3.4 Authorization check: User B attempts to edit User A meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { title: 'Hacked Title' }, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT update User A meeting (HTTP 403)');

    // 3.5 Authorization check: User B attempts to delete User A meeting
    res = await req(`/meetings/${meetingIdA}`, 'DELETE', null, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT delete User A meeting (HTTP 403)');

    // 3.6 Host updates meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { description: 'Updated Syllabus' }, tokenA);
    assert(res.status === 200 && res.data.data.meeting.description === 'Updated Syllabus', 'Host User A successfully updates meeting');

    // 3.7 Host joins their scheduled meeting -> triggers state transition to LIVE
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenA);
    assert(res.status === 200, 'Host joins meeting');
    const meetingAfterHostJoin = await Meeting.findById(meetingIdA);
    assert(meetingAfterHostJoin.status === 'live', 'Meeting transitions from scheduled to LIVE when host joins');

    // 3.8 Participant User B joins meeting
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenB);
    assert(res.status === 200, 'Participant User B successfully joins live meeting');

    console.log('\n--- 4. ATTENDANCE SYSTEM TESTS ---');
    // 4.1 Attendance record created for User B upon joining
    const attendanceDoc = await Attendance.findOne({ meeting: meetingIdA, user: userADoc._id });
    assert(attendanceDoc !== null && attendanceDoc.status === 'Present', 'Attendance record automatically created for Host');

    // 4.2 User B leaves meeting via API
    res = await req(`/meetings/${meetingIdA}/leave`, 'POST', null, tokenB);
    assert(res.status === 200, 'User B leaves meeting (HTTP 200)');

    // 4.3 Check leftAt is populated on User B attendance
    const userBDoc = await User.findOne({ mobile: testMobileB });
    const attB = await Attendance.findOne({ meeting: meetingIdA, user: userBDoc._id });
    assert(attB !== null && attB.leftAt !== null, 'User B attendance leftAt timestamp recorded on leave');
    assert(typeof attB.duration === 'number' && attB.duration >= 0, 'User B attendance duration calculated in minutes');

    // 4.4 Non-host User B attempts to access Host attendance summary
    res = await req(`/attendance/meeting/${meetingIdA}`, 'GET', null, tokenB);
    assert(res.status === 403, 'Non-host User B CANNOT view host attendance report (HTTP 403)');

    // 4.5 Host User A accesses attendance report
    res = await req(`/attendance/meeting/${meetingIdA}`, 'GET', null, tokenA);
    assert(res.status === 200 && res.data.data.summary.total >= 1, 'Host User A accesses attendance summary with metrics');

    // 4.6 User B checks their own personal attendance
    res = await req('/attendance/my', 'GET', null, tokenB);
    assert(res.status === 200 && Array.isArray(res.data.data.attendance), 'User B can fetch their personal attendance history');

    console.log('\n--- 5. MEETING COMPLETION & STATE IMMUTABILITY ---');
    // 5.1 Host ends meeting
    res = await req(`/meetings/${meetingIdA}/end`, 'POST', null, tokenA);
    assert(res.status === 200, 'Host successfully ends meeting (HTTP 200)');
    const endedMtg = await Meeting.findById(meetingIdA);
    assert(endedMtg.status === 'completed', 'Meeting status updated to completed');

    // 5.2 Attempt to join completed meeting
    res = await req(`/meetings/join/${meetingCodeA}`, 'POST', null, tokenB);
    assert(res.status === 400, 'Blocked from joining a completed meeting (HTTP 400)');

    // 5.3 Attempt to restart completed meeting
    res = await req(`/meetings/${meetingIdA}/start`, 'POST', null, tokenA);
    assert(res.status === 400, 'Blocked from starting an already completed meeting (HTTP 400)');

    // 5.4 Attempt to edit completed meeting
    res = await req(`/meetings/${meetingIdA}`, 'PUT', { title: 'New Title' }, tokenA);
    assert(res.status === 400, 'Blocked from updating an already completed meeting (HTTP 400)');

    console.log('\n--- 6. EDGE CASES & EXTENDED SECURITY TESTS ---');
    // 6.1 Join Non-Existent Meeting Code
    res = await req('/meetings/join/NON999', 'POST', null, tokenB);
    assert(res.status === 404, 'Joining non-existent code returns 404');

    // 6.2 Non-host attempts to admit participant
    res = await req(`/meetings/${meetingIdA}/admit`, 'POST', { userId: userBDoc._id }, tokenB);
    assert(res.status === 403, 'Non-host CANNOT admit participants (HTTP 403)');

    // 6.3 Non-host attempts to remove participant
    res = await req(`/meetings/${meetingIdA}/remove`, 'POST', { userId: userADoc._id }, tokenB);
    assert(res.status === 403, 'Non-host CANNOT remove participants (HTTP 403)');

    // 6.4 Host removes participant
    const meeting2Res = await req('/meetings', 'POST', {
      title: 'Moderation Test Room',
      meetingType: 'instant',
    }, tokenA);
    const meeting2 = meeting2Res.data.data.meeting;
    await req(`/meetings/join/${meeting2.meetingCode}`, 'POST', null, tokenB);
    res = await req(`/meetings/${meeting2._id}/remove`, 'POST', { userId: userBDoc._id }, tokenA);
    assert(res.status === 200, 'Host can remove participant (HTTP 200)');

    // 6.5 Cancel meeting flow
    await req(`/meetings/${meeting2._id}`, 'PUT', { status: 'cancelled' }, tokenA);
    res = await req(`/meetings/join/${meeting2.meetingCode}`, 'POST', null, tokenB);
    assert(res.status === 400, 'Blocked from joining cancelled meeting (HTTP 400)');

    // 6.6 Unverified user signup retry edge case
    const testMobileC = '9998883333';
    await User.deleteMany({ mobile: testMobileC });
    await req('/auth/signup', 'POST', {
      name: 'Unverified User',
      mobile: testMobileC,
      age: 20,
      role: 'Student',
      password: 'initialpassword123',
    });
    // User retries signup without having verified OTP
    res = await req('/auth/signup', 'POST', {
      name: 'Updated Unverified User',
      mobile: testMobileC,
      age: 21,
      role: 'Student',
      password: 'updatedpassword123',
    });
    assert(res.status === 200 && res.data.message.includes('updated'), 'Unverified user can retry/update signup without getting blocked');
    await User.deleteMany({ mobile: testMobileC });
    await Meeting.deleteMany({ _id: meeting2._id });

    // 7. FEEDBACK MODULE VERIFICATION
    console.log('\n--- 7. Feedback System Verification ---');
    // 7.1 Guest feedback submission
    res = await req('/feedback', 'POST', {
      rating: 'Very Good',
      category: 'Website',
      message: 'Great simple grayscale interface for non-technical users.',
      page: '/landing'
    });
    assert(res.status === 201 && res.data.success, 'Guest can submit feedback (HTTP 201)');

    // 7.2 Feedback validation error (missing rating)
    res = await req('/feedback', 'POST', {
      category: 'Website',
      message: 'Missing rating test'
    });
    assert(res.status === 400 && !res.data.success, 'Feedback without rating rejected (HTTP 400)');

    // 7.3 Authenticated feedback submission
    res = await req('/feedback', 'POST', {
      rating: 'Good',
      category: 'Meeting',
      message: 'Audio and video worked smoothly.',
      page: '/meetings'
    }, tokenA);
    assert(res.status === 201 && res.data.data.user === userADoc._id.toString(), 'Authenticated user feedback linked to user account (HTTP 201)');

    // 7.4 Get authenticated user's feedback history
    res = await req('/feedback/my', 'GET', null, tokenA);
    assert(res.status === 200 && Array.isArray(res.data.data) && res.data.data.length >= 1, 'Authenticated user can retrieve their feedback history (HTTP 200)');

    // 7.5 Unauthenticated request to /feedback/my is rejected
    res = await req('/feedback/my', 'GET');
    assert(res.status === 401, 'Guest blocked from /feedback/my without auth token (HTTP 401)');

    // Clean up test data
    await Meeting.deleteMany({ _id: meetingIdA });
    await Attendance.deleteMany({ meeting: meetingIdA });
    await User.deleteMany({ mobile: { $in: [testMobileA, testMobileB] } });
    await Otp.deleteMany({ mobile: { $in: [testMobileA, testMobileB] } });


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
