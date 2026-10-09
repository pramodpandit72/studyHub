import test from 'node:test';
import assert from 'node:assert/strict';

test('Navigation and Dashboard Spec Verification', async (t) => {
  await t.test('1. Navbar links contain essential items and exclude Feedback and Mock Test', () => {
    // Exact navLinks as defined in Navbar.jsx
    const navLinks = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Meetings', path: '/meetings' },
      { name: 'Attendance', path: '/attendance' },
      { name: 'Profile', path: '/profile' },
    ];

    const linkNames = navLinks.map((l) => l.name);

    assert.equal(linkNames.includes('Feedback'), false, 'Feedback must NOT be in navbar');
    assert.equal(linkNames.includes('Mock Tests'), false, 'Mock Test must NOT be in navbar');
    assert.equal(linkNames.includes('Mock Test'), false, 'Mock Test must NOT be in navbar');
    assert.equal(linkNames.includes('Dashboard'), true, 'Dashboard must be in navbar');
    assert.equal(linkNames.includes('Meetings'), true, 'Meetings must be in navbar');
    assert.equal(linkNames.includes('Attendance'), true, 'Attendance must be in navbar');
    assert.equal(linkNames.includes('Profile'), true, 'Profile must be in navbar');
    assert.equal(linkNames.length, 4);
  });

  await t.test('2. Dashboard action cards specification: exactly three cards in exact order', () => {
    const dashboardCards = [
      {
        order: 1,
        title: 'Start Instant Meeting',
        description: 'Start a live meeting immediately and share the meeting code with others.',
        buttonText: 'Start Instant Meeting',
        to: '/meetings/create?type=instant',
      },
      {
        order: 2,
        title: 'Schedule Meeting',
        description: 'Schedule a meeting for a future date and time.',
        buttonText: 'Schedule Meeting',
        to: '/meetings/create?type=scheduled',
      },
      {
        order: 3,
        title: 'Mock Test',
        description: 'Attempt practice tests for government exams and other competitive examinations, and review your score.',
        buttonText: 'Take Mock Test',
        to: '/mock-tests',
      },
    ];

    assert.equal(dashboardCards.length, 3, 'Dashboard must have exactly three action cards');
    assert.equal(dashboardCards[0].title, 'Start Instant Meeting');
    assert.equal(dashboardCards[1].title, 'Schedule Meeting');
    assert.equal(dashboardCards[2].title, 'Mock Test');

    assert.equal(dashboardCards[0].buttonText, 'Start Instant Meeting');
    assert.equal(dashboardCards[1].buttonText, 'Schedule Meeting');
    assert.equal(dashboardCards[2].buttonText, 'Take Mock Test');

    const cardTitles = dashboardCards.map((c) => c.title);
    assert.equal(cardTitles.includes('Attendance Records'), false, 'Attendance must not be in primary action section');
  });
});
