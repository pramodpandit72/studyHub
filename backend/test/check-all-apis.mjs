import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from '../src/app.js';
import User from '../src/models/User.js';
import SignupVerification from '../src/models/SignupVerification.js';
import Meeting from '../src/models/Meeting.js';
import Attendance from '../src/models/Attendance.js';
import Feedback from '../src/models/Feedback.js';
import MockTest from '../src/models/MockTest.js';
import MockTestAttempt from '../src/models/MockTestAttempt.js';
import env from '../src/config/env.js';

dotenv.config();
process.env.NODE_ENV = 'test';

let server;
let baseUrl;

const runComprehensiveApiChecks = async () => {
  console.log('================================================================');
  console.log('       STUDYHUB COMPLETE 100% API ENDPOINT AUDIT & CHECKER      ');
  console.log('================================================================');

  await mongoose.connect(env.MONGO_URI, { dbName: 'studyhub' });
  console.log(`[DB] Connected to MongoDB: ${mongoose.connection.name}`);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`[HTTP] Live test server listening on port ${port}\n`);

  const results = [];

  const recordResult = (category, method, endpoint, description, passed, status, detail = '') => {
    results.push({ category, method, endpoint, description, passed, status, detail });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${mark} [${method}] ${endpoint} - ${description} (HTTP ${status}) ${detail ? `| ${detail}` : ''}`);
  };

  const req = async (path, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  };

  // Test state
  const testHostEmail = 'api_audit_host@example.com';
  const testStudentEmail = 'api_audit_student@example.com';
  let hostToken = null;
  let studentToken = null;
  let hostUser = null;
  let studentUser = null;
  let createdMeeting = null;
  let createdMockTest = null;
  let activeSessionAttempt = null;

  try {
    // Clean up preexisting audit fixtures
    await User.deleteMany({ email: { $in: [testHostEmail, testStudentEmail] } });
    await SignupVerification.deleteMany({ email: { $in: [testHostEmail, testStudentEmail] } });
    await Feedback.deleteMany({ message: /API Audit Test/i });

    // =========================================================================
    // 1. SYSTEM / HEALTH ENDPOINTS
    // =========================================================================
    console.log('\n--- 1. SYSTEM / HEALTH APIS ---');
    {
      const res1 = await req('/', 'GET');
      recordResult('System', 'GET', '/', 'Root status endpoint', res1.status === 200 && res1.data.success === true, res1.status, res1.data.message);

      const res2 = await req('/api', 'GET');
      recordResult('System', 'GET', '/api', 'API Root endpoint', res2.status === 200 && res2.data.success === true, res2.status, res2.data.message);

      const res3 = await req('/api/health', 'GET');
      recordResult('System', 'GET', '/api/health', 'Health check endpoint', res3.status === 200 && res3.data.success === true, res3.status, res3.data.message);
    }

    // =========================================================================
    // 2. AUTHENTICATION APIS (/api/auth)
    // =========================================================================
    console.log('\n--- 2. AUTHENTICATION APIS (/api/auth) ---');
    {
      // 2.1 POST /api/auth/signup (Initiate Signup for Host)
      const resSignup = await req('/api/auth/signup', 'POST', {
        name: 'Audit Host Teacher',
        email: testHostEmail,
        age: 35,
        role: 'Teacher',
        studyOrPreparation: 'Computer Science',
        institution: 'Audit University',
        experienceLevel: 'Advanced',
        password: 'password123',
      });
      const hostDevOtp = resSignup.data.data?.devOtp;
      recordResult('Auth', 'POST', '/api/auth/signup', 'Initiate user signup (sends OTP)', resSignup.status === 200 && !!hostDevOtp, resSignup.status);

      // 2.2 POST /api/auth/signup/resend-otp (Enforce cooldown vs resend)
      // Fast resend hits 429 cooldown
      const resResendCooldown = await req('/api/auth/signup/resend-otp', 'POST', { email: testHostEmail });
      recordResult('Auth', 'POST', '/api/auth/signup/resend-otp', 'Enforces 60s cooldown limit', resResendCooldown.status === 429, resResendCooldown.status);

      // Bypass cooldown in DB to test successful resend
      await SignupVerification.updateOne({ email: testHostEmail }, { $set: { lastResendAt: new Date(Date.now() - 70000) } });
      const resResendSuccess = await req('/api/auth/signup/resend-otp', 'POST', { email: testHostEmail });
      const newDevOtp = resResendSuccess.data.data?.devOtp;
      recordResult('Auth', 'POST', '/api/auth/signup/resend-otp', 'Resend OTP succeeds after cooldown window', resResendSuccess.status === 200 && !!newDevOtp, resResendSuccess.status);

      // 2.3 POST /api/auth/signup/verify (Verify OTP & Complete Signup)
      const resVerify = await req('/api/auth/signup/verify', 'POST', { email: testHostEmail, otp: newDevOtp });
      recordResult('Auth', 'POST', '/api/auth/signup/verify', 'Verify signup OTP and create user in DB', resVerify.status === 201 && resVerify.data.data?.user?.email === testHostEmail, resVerify.status);

      // Sign up and verify student user as well
      const resStudentSignup = await req('/api/auth/signup', 'POST', {
        name: 'Audit Student Priya',
        email: testStudentEmail,
        age: 20,
        role: 'Student',
        studyOrPreparation: 'Engineering',
        institution: 'NIT Tech',
        experienceLevel: 'Intermediate',
        password: 'password123',
      });
      const studentOtp = resStudentSignup.data.data?.devOtp;
      await req('/api/auth/signup/verify', 'POST', { email: testStudentEmail, otp: studentOtp });

      // 2.4 POST /api/auth/login (Host Login)
      const resLoginHost = await req('/api/auth/login', 'POST', { email: testHostEmail, password: 'password123' });
      hostToken = resLoginHost.data.data?.token;
      hostUser = resLoginHost.data.data?.user;
      recordResult('Auth', 'POST', '/api/auth/login', 'Login with valid email + password', resLoginHost.status === 200 && !!hostToken, resLoginHost.status);

      // Student Login
      const resLoginStudent = await req('/api/auth/login', 'POST', { email: testStudentEmail, password: 'password123' });
      studentToken = resLoginStudent.data.data?.token;
      studentUser = resLoginStudent.data.data?.user;

      // 2.5 POST /api/auth/forgot-password
      const resForgot = await req('/api/auth/forgot-password', 'POST', { email: testHostEmail });
      const resetCode = resForgot.data.data?.devCode;
      recordResult('Auth', 'POST', '/api/auth/forgot-password', 'Request password reset code', resForgot.status === 200 && !!resetCode, resForgot.status);

      // 2.6 POST /api/auth/verify-reset-code
      const resVerifyReset = await req('/api/auth/verify-reset-code', 'POST', { email: testHostEmail, code: resetCode });
      recordResult('Auth', 'POST', '/api/auth/verify-reset-code', 'Verify password reset code', resVerifyReset.status === 200 && resVerifyReset.data.success === true, resVerifyReset.status);

      // 2.7 POST /api/auth/reset-password
      const resReset = await req('/api/auth/reset-password', 'POST', { email: testHostEmail, code: resetCode, newPassword: 'newHostPassword2026' });
      recordResult('Auth', 'POST', '/api/auth/reset-password', 'Set new password with validated code', resReset.status === 200 && resReset.data.success === true, resReset.status);

      // Re-login with new password to refresh token
      const resRelogin = await req('/api/auth/login', 'POST', { email: testHostEmail, password: 'newHostPassword2026' });
      hostToken = resRelogin.data.data?.token;

      // 2.8 GET /api/auth/me (Protected current user session)
      const resMe = await req('/api/auth/me', 'GET', null, hostToken);
      recordResult('Auth', 'GET', '/api/auth/me', 'Fetch current authenticated user profile', resMe.status === 200 && resMe.data.data?.user?.email === testHostEmail, resMe.status);

      // 2.9 POST /api/auth/logout
      const resLogout = await req('/api/auth/logout', 'POST', null, hostToken);
      recordResult('Auth', 'POST', '/api/auth/logout', 'Log out authenticated user', resLogout.status === 200 && resLogout.data.success === true, resLogout.status);
    }

    // =========================================================================
    // 3. USER PROFILE APIS (/api/users)
    // =========================================================================
    console.log('\n--- 3. USER PROFILE APIS (/api/users) ---');
    {
      // 3.1 GET /api/users/profile
      const resGetProf = await req('/api/users/profile', 'GET', null, hostToken);
      recordResult('User', 'GET', '/api/users/profile', 'Get user profile information', resGetProf.status === 200 && resGetProf.data.data?.user?.email === testHostEmail, resGetProf.status);

      // 3.2 PUT /api/users/profile
      const resUpdateProf = await req('/api/users/profile', 'PUT', {
        name: 'Dr. Audit Host Teacher Updated',
        institution: 'Global Advanced University',
        themePreference: 'dark',
      }, hostToken);
      recordResult('User', 'PUT', '/api/users/profile', 'Update profile metadata and preferences', resUpdateProf.status === 200 && resUpdateProf.data.data?.user?.name === 'Dr. Audit Host Teacher Updated', resUpdateProf.status);
    }

    // =========================================================================
    // 4. MEETING APIS (/api/meetings)
    // =========================================================================
    console.log('\n--- 4. MEETING LIFECYCLE & COLLABORATION APIS (/api/meetings) ---');
    {
      const startIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      // 4.1 POST /api/meetings (Create)
      const resCreateMtg = await req('/api/meetings', 'POST', {
        title: 'Full API Verification Meeting',
        description: 'Testing all meeting controller actions',
        meetingType: 'scheduled',
        startTime: startIso,
        endTime: endIso,
        maxParticipants: 50,
        waitingRoom: true,
      }, hostToken);
      createdMeeting = resCreateMtg.data.data?.meeting;
      recordResult('Meeting', 'POST', '/api/meetings', 'Host creates new meeting', resCreateMtg.status === 201 && !!createdMeeting?.meetingCode, resCreateMtg.status);

      const mtgId = createdMeeting._id;
      const mtgCode = createdMeeting.meetingCode;

      // 4.2 GET /api/meetings (List meetings for current user)
      const resListMtg = await req('/api/meetings', 'GET', null, hostToken);
      recordResult('Meeting', 'GET', '/api/meetings', 'List meetings hosted/attended by user', resListMtg.status === 200 && Array.isArray(resListMtg.data.data?.meetings), resListMtg.status);

      // 4.3 GET /api/meetings/upcoming
      const resUpcoming = await req('/api/meetings/upcoming', 'GET', null, hostToken);
      recordResult('Meeting', 'GET', '/api/meetings/upcoming', 'List upcoming scheduled meetings', resUpcoming.status === 200 && Array.isArray(resUpcoming.data.data?.meetings), resUpcoming.status);

      // 4.4 GET /api/meetings/history
      const resHistory = await req('/api/meetings/history', 'GET', null, hostToken);
      recordResult('Meeting', 'GET', '/api/meetings/history', 'List completed meeting history', resHistory.status === 200 && Array.isArray(resHistory.data.data?.meetings), resHistory.status);

      // 4.5 GET /api/meetings/code/:code
      const resByCode = await req(`/api/meetings/code/${mtgCode}`, 'GET', null, studentToken);
      recordResult('Meeting', 'GET', `/api/meetings/code/:code`, 'Get meeting summary by 6-char code', resByCode.status === 200 && resByCode.data.data?.meeting?.meetingCode === mtgCode, resByCode.status);

      // 4.6 GET /api/meetings/:id
      const resById = await req(`/api/meetings/${mtgId}`, 'GET', null, hostToken);
      recordResult('Meeting', 'GET', `/api/meetings/:id`, 'Get meeting details by ID', resById.status === 200 && resById.data.data?.meeting?._id === mtgId, resById.status);

      // 4.7 PUT /api/meetings/:id
      const resUpdateMtg = await req(`/api/meetings/${mtgId}`, 'PUT', { description: 'Updated Verification Description' }, hostToken);
      recordResult('Meeting', 'PUT', `/api/meetings/:id`, 'Host updates meeting details', resUpdateMtg.status === 200 && resUpdateMtg.data.data?.meeting?.description === 'Updated Verification Description', resUpdateMtg.status);

      // 4.8 POST /api/meetings/:id/start
      const resStartMtg = await req(`/api/meetings/${mtgId}/start`, 'POST', null, hostToken);
      recordResult('Meeting', 'POST', `/api/meetings/:id/start`, 'Host explicitly starts meeting (transitions to live)', resStartMtg.status === 200 && resStartMtg.data.data?.meeting?.status === 'live', resStartMtg.status);

      // 4.9 POST /api/meetings/join/:code (Host joins)
      const resHostJoin = await req(`/api/meetings/join/${mtgCode}`, 'POST', null, hostToken);
      recordResult('Meeting', 'POST', `/api/meetings/join/:code`, 'Host joins live meeting', resHostJoin.status === 200, resHostJoin.status);

      // Student joins (goes to waiting room because waitingRoom: true)
      const resStudentJoin = await req(`/api/meetings/join/${mtgCode}`, 'POST', null, studentToken);
      recordResult('Meeting', 'POST', `/api/meetings/join/:code`, 'Participant enters waiting room when enabled', resStudentJoin.status === 200 && resStudentJoin.data.data?.waiting === true, resStudentJoin.status);

      // 4.10 POST /api/meetings/:id/admit (Host admits student)
      const resAdmit = await req(`/api/meetings/${mtgId}/admit`, 'POST', { userId: studentUser._id }, hostToken);
      recordResult('Meeting', 'POST', `/api/meetings/:id/admit`, 'Host admits participant from waiting room', resAdmit.status === 200 && resAdmit.data.success === true, resAdmit.status);

      // 4.11 POST /api/meetings/:id/remove (Host removes participant)
      const resRemove = await req(`/api/meetings/${mtgId}/remove`, 'POST', { userId: studentUser._id }, hostToken);
      recordResult('Meeting', 'POST', `/api/meetings/:id/remove`, 'Host removes participant from active meeting', resRemove.status === 200 && resRemove.data.success === true, resRemove.status);

      // Re-join student and test leave
      // Turn off waiting room for quick leave test
      await Meeting.findByIdAndUpdate(mtgId, { waitingRoom: false });
      await req(`/api/meetings/join/${mtgCode}`, 'POST', null, studentToken);

      // 4.12 POST /api/meetings/:id/leave (Student leaves)
      const resLeave = await req(`/api/meetings/${mtgId}/leave`, 'POST', null, studentToken);
      recordResult('Meeting', 'POST', `/api/meetings/:id/leave`, 'Participant leaves meeting cleanly', resLeave.status === 200 && resLeave.data.success === true, resLeave.status);

      // 4.13 POST /api/meetings/:id/end (Host ends meeting)
      const resEnd = await req(`/api/meetings/${mtgId}/end`, 'POST', null, hostToken);
      recordResult('Meeting', 'POST', `/api/meetings/:id/end`, 'Host ends meeting (transitions to completed)', resEnd.status === 200 && resEnd.data.data?.meeting?.status === 'completed', resEnd.status);

      // 4.14 DELETE /api/meetings/:id (Host deletes scheduled or completed meeting)
      // Create a scheduled meeting to test delete endpoint
      const resTempMtg = await req('/api/meetings', 'POST', {
        title: 'Temporary Meeting For Deletion Test',
        meetingType: 'scheduled',
        startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      }, hostToken);
      const tempId = resTempMtg.data.data?.meeting?._id;
      const resDelete = await req(`/api/meetings/${tempId}`, 'DELETE', null, hostToken);
      recordResult('Meeting', 'DELETE', `/api/meetings/:id`, 'Host permanently deletes meeting', resDelete.status === 200 && resDelete.data.success === true, resDelete.status);
    }

    // =========================================================================
    // 5. ATTENDANCE APIS (/api/attendance)
    // =========================================================================
    console.log('\n--- 5. ATTENDANCE APIS (/api/attendance) ---');
    {
      // 5.1 GET /api/attendance/meeting/:id (Host views meeting attendance report)
      const resMtgAtt = await req(`/api/attendance/meeting/${createdMeeting._id}`, 'GET', null, hostToken);
      recordResult('Attendance', 'GET', `/api/attendance/meeting/:id`, 'Host retrieves meeting attendance report and metrics', resMtgAtt.status === 200 && Array.isArray(resMtgAtt.data.data?.attendance), resMtgAtt.status);

      // 5.2 GET /api/attendance/my (User views their personal attendance)
      const resMyAtt = await req('/api/attendance/my', 'GET', null, studentToken);
      recordResult('Attendance', 'GET', '/api/attendance/my', 'User retrieves personal attendance history', resMyAtt.status === 200 && Array.isArray(resMyAtt.data.data?.attendance), resMyAtt.status);
    }

    // =========================================================================
    // 6. FEEDBACK APIS (/api/feedback)
    // =========================================================================
    console.log('\n--- 6. FEEDBACK APIS (/api/feedback) ---');
    {
      // 6.1 POST /api/feedback (Submit feedback - supports both authenticated & anonymous)
      const resSubmitFb = await req('/api/feedback', 'POST', {
        rating: 'Very Good',
        category: 'Website',
        message: 'API Audit Test: Excellent platform performance!',
        page: '/dashboard',
      }, hostToken);
      recordResult('Feedback', 'POST', '/api/feedback', 'Submit user feedback & review', resSubmitFb.status === 201 && resSubmitFb.data.success === true, resSubmitFb.status);

      // 6.2 GET /api/feedback/my (Get current user feedbacks)
      const resMyFb = await req('/api/feedback/my', 'GET', null, hostToken);
      recordResult('Feedback', 'GET', '/api/feedback/my', 'Retrieve authenticated user feedbacks', resMyFb.status === 200 && Array.isArray(resMyFb.data.data), resMyFb.status);
    }

    // =========================================================================
    // 7. MOCK TEST APIS (/api/mock-tests)
    // =========================================================================
    console.log('\n--- 7. MOCK TEST APIS (/api/mock-tests) ---');
    {
      // 7.1 GET /api/mock-tests (List all mock tests)
      const resListTests = await req('/api/mock-tests', 'GET', null, studentToken);
      recordResult('MockTest', 'GET', '/api/mock-tests', 'List mock tests catalog', resListTests.status === 200 && Array.isArray(resListTests.data.data?.tests), resListTests.status);

      // 7.2 POST /api/mock-tests (Create custom mock test)
      const resCreateTest = await req('/api/mock-tests', 'POST', {
        title: 'Audit Mock Test - Express & System Architecture',
        category: 'GATE',
        description: 'Comprehensive test for API checking',
        durationMinutes: 30,
        passingPercentage: 50,
        difficulty: 'Medium',
        hasNegativeMarking: true,
        negativeMarks: 0.33,
        marksPerQuestion: 2,
        questions: [
          {
            questionText: 'What HTTP status code indicates a created resource?',
            options: ['200', '201', '204', '400'],
            correctOptionIndex: 1,
            marks: 2,
            negativeMarks: 0.33,
            explanation: 'HTTP 201 Created indicates successful resource creation.',
          },
          {
            questionText: 'Which middleware is used to parse JSON bodies in Express?',
            options: ['express.urlencoded', 'express.json', 'cookie-parser', 'cors'],
            correctOptionIndex: 1,
            marks: 2,
            negativeMarks: 0.33,
            explanation: 'express.json() parses incoming JSON requests.',
          },
        ],
      }, hostToken);
      createdMockTest = resCreateTest.data.data?.test;
      recordResult('MockTest', 'POST', '/api/mock-tests', 'Create custom mock test with validated questions', resCreateTest.status === 201 && !!createdMockTest?._id, resCreateTest.status);

      const testId = createdMockTest._id;

      // 7.3 GET /api/mock-tests/:id (Get test details without answer key leakage)
      const resGetTest = await req(`/api/mock-tests/${testId}`, 'GET', null, studentToken);
      const testData = resGetTest.data.data?.test;
      const noAnswerKeyLeaked = testData?.questions?.every(q => q.correctOptionIndex === undefined);
      recordResult('MockTest', 'GET', `/api/mock-tests/:id`, 'Fetch test by ID (masks correct answers)', resGetTest.status === 200 && noAnswerKeyLeaked, resGetTest.status);

      // 7.4 GET /api/mock-tests/:id/session/status (Check session status before start)
      const resInitSessionStatus = await req(`/api/mock-tests/${testId}/session/status`, 'GET', null, studentToken);
      recordResult('MockTest', 'GET', `/api/mock-tests/:id/session/status`, 'Session status check when no session active', resInitSessionStatus.status === 200 && resInitSessionStatus.data.data?.hasActiveSession === false, resInitSessionStatus.status);

      // 7.5 POST /api/mock-tests/:id/session/start (Start test session)
      const resStartSession = await req(`/api/mock-tests/${testId}/session/start`, 'POST', null, studentToken);
      activeSessionAttempt = resStartSession.data.data?.session;
      recordResult('MockTest', 'POST', `/api/mock-tests/:id/session/start`, 'Start secure timed test session', resStartSession.status === 201 && !!activeSessionAttempt?._id, resStartSession.status);

      // 7.6 GET /api/mock-tests/:id/session/status (Check session status while active)
      const resActiveSessionStatus = await req(`/api/mock-tests/${testId}/session/status`, 'GET', null, studentToken);
      recordResult('MockTest', 'GET', `/api/mock-tests/:id/session/status`, 'Session status returns active remaining seconds', resActiveSessionStatus.status === 200 && resActiveSessionStatus.data.data?.hasActiveSession === true, resActiveSessionStatus.status);

      // 7.7 POST /api/mock-tests/:id/session/save-answer (Autosave question response)
      const resSaveAnswer = await req(`/api/mock-tests/${testId}/session/save-answer`, 'POST', {
        questionIndex: 0,
        selectedOption: 1,
        currentQuestionIndex: 1,
      }, studentToken);
      recordResult('MockTest', 'POST', `/api/mock-tests/:id/session/save-answer`, 'Real-time autosave answer response', resSaveAnswer.status === 200 && resSaveAnswer.data.data?.savedAnswers?.['0'] === 1, resSaveAnswer.status);

      // 7.8 POST /api/mock-tests/:id/session/activity (Record tab switch / anti-cheat activity)
      const resActivity = await req(`/api/mock-tests/${testId}/session/activity`, 'POST', {
        type: 'tab_visible',
        durationSeconds: 4,
        details: 'User switched tabs and returned',
      }, studentToken);
      recordResult('MockTest', 'POST', `/api/mock-tests/:id/session/activity`, 'Record anti-cheat & tab-switch telemetry', resActivity.status === 200 && resActivity.data.data?.tabSwitchCount >= 1, resActivity.status);

      // 7.9 POST /api/mock-tests/:id/session/resume (Resume test session)
      const resResume = await req(`/api/mock-tests/${testId}/session/resume`, 'POST', null, studentToken);
      recordResult('MockTest', 'POST', `/api/mock-tests/:id/session/resume`, 'Resume interrupted test session within policy limits', resResume.status === 200 && resResume.data.data?.session?.resumeCount === 1, resResume.status);

      // 7.10 POST /api/mock-tests/:id/submit (Final test submission & scoring)
      const resSubmit = await req(`/api/mock-tests/${testId}/submit`, 'POST', {
        answers: { '0': 1, '1': 1 },
        timeSpentSeconds: 120,
      }, studentToken);
      const attemptId = resSubmit.data.data?.attempt?._id;
      recordResult('MockTest', 'POST', `/api/mock-tests/:id/submit`, 'Submit test, calculate score and answer breakdown', resSubmit.status === 201 && resSubmit.data.data?.attempt?.score === 4, resSubmit.status);

      // 7.11 GET /api/mock-tests/attempt/:attemptId (Get specific attempt result breakdown)
      const resAttemptResult = await req(`/api/mock-tests/attempt/${attemptId}`, 'GET', null, studentToken);
      recordResult('MockTest', 'GET', `/api/mock-tests/attempt/:attemptId`, 'Get detailed score report and explanations', resAttemptResult.status === 200 && resAttemptResult.data.data?.attempt?._id === attemptId, resAttemptResult.status);

      // 7.12 GET /api/mock-tests/my-attempts (List user past attempts)
      const resMyAttempts = await req('/api/mock-tests/my-attempts', 'GET', null, studentToken);
      recordResult('MockTest', 'GET', `/api/mock-tests/my-attempts`, 'List all past test attempts for student', resMyAttempts.status === 200 && Array.isArray(resMyAttempts.data.data?.attempts) && resMyAttempts.data.data.attempts.length >= 1, resMyAttempts.status);

      // 7.13 DELETE /api/mock-tests/:id (Host deletes mock test)
      const resDeleteTest = await req(`/api/mock-tests/${testId}`, 'DELETE', null, hostToken);
      recordResult('MockTest', 'DELETE', `/api/mock-tests/:id`, 'Creator deletes custom mock test', resDeleteTest.status === 200 && resDeleteTest.data.success === true, resDeleteTest.status);
    }

    // =========================================================================
    // 8. ERROR & 404 NOT FOUND HANDLING
    // =========================================================================
    console.log('\n--- 8. 404 NOT FOUND & ERROR HANDLING ---');
    {
      const res404 = await req('/api/undefined-endpoint-xyz', 'GET');
      recordResult('System', 'GET', '/api/undefined-endpoint-xyz', 'Standard 404 response for undefined routes', res404.status === 404 && res404.data.success === false, res404.status, res404.data.message);
    }

    // Clean up audit test records
    await Meeting.deleteMany({ _id: createdMeeting?._id });
    await Attendance.deleteMany({ meeting: createdMeeting?._id });
    await Feedback.deleteMany({ message: /API Audit Test/i });
    await MockTestAttempt.deleteMany({ mockTest: createdMockTest?._id });
    await MockTest.deleteMany({ _id: createdMockTest?._id });
    await User.deleteMany({ email: { $in: [testHostEmail, testStudentEmail] } });
    await SignupVerification.deleteMany({ email: { $in: [testHostEmail, testStudentEmail] } });

    console.log('\n================================================================');
    const totalCount = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    console.log(`TOTAL AUDITED ENDPOINTS: ${totalCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('================================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal audit failure:', err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runComprehensiveApiChecks();
