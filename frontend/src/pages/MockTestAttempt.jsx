import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { mockTestApi } from '../services/mockTest.api';
import { PageLoader } from '../components/common/Loader';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  Award,
  BookOpen,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertTriangle,
  Activity,
  History,
  EyeOff,
  Eye,
  FileText,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

export const MockTestAttempt = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const viewAttemptId = searchParams.get('viewAttempt');
  const navigate = useNavigate();
  const { success, error, info, warning } = useToast();

  const [mode, setMode] = useState('loading');
  const [test, setTest] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [acknowledgedInstructions, setAcknowledgedInstructions] = useState(false);
  const [enableFullscreenPref, setEnableFullscreenPref] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [paletteFilter, setPaletteFilter] = useState('all');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [result, setResult] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showAwayBanner, setShowAwayBanner] = useState(false);
  const [lastAwayDuration, setLastAwayDuration] = useState(0);
  const [sessionMeta, setSessionMeta] = useState({
    resumeCount: 0,
    maxResumesAllowed: 4,
    resumesRemaining: 4,
    tabSwitchCount: 0,
    totalTimeAwaySeconds: 0,
    fullscreenExitCount: 0,
    activityEvents: [],
  });

  const timerRef = useRef(null);
  const serverDeadlineRef = useRef(null);
  const awayStartTimeRef = useRef(null);
  const isAwayRef = useRef(false);

  useEffect(() => {
    initPage();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, viewAttemptId]);

  useEffect(() => {
    if (mode !== 'testing' || result) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (!isAwayRef.current) {
          isAwayRef.current = true;
          awayStartTimeRef.current = Date.now();
          mockTestApi.recordSessionActivity(id, {
            type: 'tab_hidden',
            leftAt: new Date(awayStartTimeRef.current).toISOString(),
            details: 'Test page became hidden (switched tab or minimized browser)',
          }).catch(() => {});
        }
      } else {
        if (isAwayRef.current && awayStartTimeRef.current) {
          const returnedAt = Date.now();
          const duration = Math.max(1, Math.round((returnedAt - awayStartTimeRef.current) / 1000));
          const leftAtIso = new Date(awayStartTimeRef.current).toISOString();
          isAwayRef.current = false;
          awayStartTimeRef.current = null;

          setLastAwayDuration(duration);
          setShowAwayBanner(true);

          mockTestApi.recordSessionActivity(id, {
            type: 'tab_visible',
            leftAt: leftAtIso,
            returnedAt: new Date(returnedAt).toISOString(),
            durationSeconds: duration,
            details: `User returned to the test after ${duration} seconds away`,
          }).then((res) => {
            if (res.data?.data) {
              setSessionMeta((prev) => ({
                ...prev,
                tabSwitchCount: res.data.data.tabSwitchCount,
                totalTimeAwaySeconds: res.data.data.totalTimeAwaySeconds,
              }));
            }
          }).catch(() => {});
        }
      }
    };

    const onFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);

      if (!isFs) {
        setShowFullscreenWarning(true);
        mockTestApi.recordSessionActivity(id, {
          type: 'fullscreen_exit',
          leftAt: new Date().toISOString(),
          details: 'Fullscreen mode was exited',
        }).then((res) => {
          if (res.data?.data) {
            setSessionMeta((prev) => ({
              ...prev,
              fullscreenExitCount: res.data.data.fullscreenExitCount,
            }));
          }
        }).catch(() => {});
      } else {
        setShowFullscreenWarning(false);
        mockTestApi.recordSessionActivity(id, {
          type: 'fullscreen_enter',
          leftAt: new Date().toISOString(),
          details: 'Fullscreen mode was restored',
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [mode, result, id]);

  const initPage = async () => {
    try {
      setMode('loading');
      if (viewAttemptId) {
        const res = await mockTestApi.getAttemptResult(viewAttemptId);
        const attempt = res.data.data.attempt;
        setResult(attempt);
        setTest(attempt.mockTest);
        setMode('result');
        return;
      }

      const testRes = await mockTestApi.getById(id);
      const testData = testRes.data.data.test;
      setTest(testData);

      const sessionRes = await mockTestApi.getSessionStatus(id);
      const sessionData = sessionRes.data.data;

      if (sessionData?.hasActiveSession && sessionData?.session) {
        setActiveSession(sessionData.session);
        setSessionMeta({
          resumeCount: sessionData.session.resumeCount || 0,
          maxResumesAllowed: sessionData.session.maxResumesAllowed || 4,
          resumesRemaining: sessionData.session.resumesRemaining ?? 4,
          tabSwitchCount: sessionData.session.tabSwitchCount || 0,
          totalTimeAwaySeconds: sessionData.session.totalTimeAwaySeconds || 0,
          fullscreenExitCount: sessionData.session.fullscreenExitCount || 0,
          activityEvents: sessionData.session.activityEvents || [],
        });
        setMode('resume_prompt');
      } else if (sessionData?.isExpired && sessionData?.attemptId) {
        info('Previous test session expired and was automatically submitted.');
        const res = await mockTestApi.getAttemptResult(sessionData.attemptId);
        setResult(res.data.data.attempt);
        setMode('result');
      } else {
        setMode('instructions');
      }
    } catch (err) {
      console.error('Error initializing mock test:', err);
      error('Failed to load mock test. Please try again.');
      navigate('/mock-tests');
    }
  };

  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.warn('Fullscreen request bypassed by browser permissions:', err);
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      requestFullscreen();
    }
  };

  const handleStartTest = async () => {
    if (!acknowledgedInstructions) {
      warning('Please read and confirm the candidate declaration before proceeding.');
      return;
    }

    if (enableFullscreenPref) {
      requestFullscreen().catch(() => {});
    }

    try {
      setIsSubmitting(true);

      const res = await mockTestApi.startSession(id);
      const session = res.data.data.session;
      setActiveSession(session);

      const parsedAnswers = {};
      if (session.savedAnswers) {
        Object.entries(session.savedAnswers).forEach(([k, v]) => {
          parsedAnswers[Number(k)] = Number(v);
        });
      }
      setSelectedAnswers(parsedAnswers);
      setCurrentIndex(session.currentQuestionIndex || 0);

      setSessionMeta({
        resumeCount: session.resumeCount || 0,
        maxResumesAllowed: session.maxResumesAllowed || 4,
        resumesRemaining: session.resumesRemaining ?? 4,
        tabSwitchCount: session.tabSwitchCount || 0,
        totalTimeAwaySeconds: session.totalTimeAwaySeconds || 0,
        fullscreenExitCount: session.fullscreenExitCount || 0,
        activityEvents: session.activityEvents || [],
      });

      const deadlineMs = new Date(session.deadline).getTime();
      serverDeadlineRef.current = deadlineMs;
      const initialRemaining = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setTimeLeft(initialRemaining);

      startCountdown(deadlineMs);
      setMode('testing');
      success('Mock test officially started. Good luck!');
    } catch (err) {
      console.error('Failed to start test session:', err);
      error(err.response?.data?.message || 'Failed to start test session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeTest = async () => {
    try {
      setIsResuming(true);
      await requestFullscreen();

      const res = await mockTestApi.resumeSession(id);
      const session = res.data.data.session;
      setActiveSession(session);

      const parsedAnswers = {};
      if (session.savedAnswers) {
        Object.entries(session.savedAnswers).forEach(([k, v]) => {
          parsedAnswers[Number(k)] = Number(v);
        });
      }
      setSelectedAnswers(parsedAnswers);
      setCurrentIndex(session.currentQuestionIndex || 0);

      setSessionMeta({
        resumeCount: session.resumeCount || 0,
        maxResumesAllowed: session.maxResumesAllowed || 4,
        resumesRemaining: session.resumesRemaining ?? (4 - session.resumeCount),
        tabSwitchCount: session.tabSwitchCount || 0,
        totalTimeAwaySeconds: session.totalTimeAwaySeconds || 0,
        fullscreenExitCount: session.fullscreenExitCount || 0,
        activityEvents: session.activityEvents || [],
      });

      const deadlineMs = new Date(session.deadline).getTime();
      serverDeadlineRef.current = deadlineMs;
      const initialRemaining = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setTimeLeft(initialRemaining);

      startCountdown(deadlineMs);
      setMode('testing');
      success(`Session resumed successfully! (Attempt ${session.resumeCount} of ${session.maxResumesAllowed || 4})`);
    } catch (err) {
      console.error('Failed to resume session:', err);
      error(err.response?.data?.message || 'Failed to resume test session.');
    } finally {
      setIsResuming(false);
    }
  };

  const startCountdown = (deadlineMs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((deadlineMs - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);
  };

  const handleAutoSubmit = () => {
    info('Time limit reached! Submitting your answers automatically.');
    submitTestInternal();
  };

  const handleOptionSelect = (optionIdx) => {
    if (result || mode !== 'testing') return;

    setSelectedAnswers((prev) => {
      const next = { ...prev, [currentIndex]: optionIdx };
      mockTestApi.saveSessionAnswer(id, {
        questionIndex: currentIndex,
        selectedOption: optionIdx,
        currentQuestionIndex: currentIndex,
      }).catch((e) => console.warn('Background auto-save warning:', e));
      return next;
    });
  };

  const handleClearAnswer = () => {
    if (result || mode !== 'testing') return;

    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      mockTestApi.saveSessionAnswer(id, {
        questionIndex: currentIndex,
        selectedOption: -1,
        currentQuestionIndex: currentIndex,
      }).catch((e) => console.warn('Background auto-save clear warning:', e));
      return next;
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return String(dateStr);
    }
  };

  const toggleMarkForReview = (qIdx) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qIdx)) {
        next.delete(qIdx);
      } else {
        next.add(qIdx);
      }
      return next;
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const attemptedCount = Object.keys(selectedAnswers).length;
  const totalQuestions = test?.questions?.length || 0;
  const unattemptedCount = Math.max(0, totalQuestions - attemptedCount);
  const markedCount = markedForReview.size;

  const submitTestInternal = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      setIsSubmitting(true);
      const res = await mockTestApi.submit(id, { answers: selectedAnswers });
      const attemptData = res.data.data.attempt;
      setResult(attemptData);
      setShowConfirmModal(false);
      setShowMobilePalette(false);
      setMode('result');

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      success('Mock test evaluated and submitted successfully!');
    } catch (err) {
      console.error('Submit error:', err);
      error(err.response?.data?.message || 'Failed to submit test. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setMode('instructions');
    setAcknowledgedInstructions(false);
    setMarkedForReview(new Set());
  };

  if (mode === 'loading') return <PageLoader />;
  if (!test) return null;

  // ===================== 1. TEST INSTRUCTIONS & GUIDELINES MODE =====================
  if (mode === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border-color">
          <Link
            to="/mock-tests"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition"
          >
            <ArrowLeft size={14} />
            Back to All Mock Tests
          </Link>
          <span className="text-xs font-mono text-text-secondary">
            Category: {test.category}
          </span>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-border-color pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
                Assessment Instructions
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-50 dark:bg-surface-800 text-text-secondary">
                {test.difficulty || 'Medium'} Difficulty
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {test.title}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
              {test.description || 'Please carefully review the examination guidelines, navigation rules, and session monitoring policies before beginning.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40 text-center">
              <span className="block text-[11px] text-text-secondary font-medium">Duration</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {test.durationMinutes} Mins
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40 text-center">
              <span className="block text-[11px] text-text-secondary font-medium">Questions</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {test.questions?.length || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40 text-center">
              <span className="block text-[11px] text-text-secondary font-medium">Total Marks</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {test.totalMarks}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40 text-center">
              <span className="block text-[11px] text-text-secondary font-medium">Negative Marking</span>
              <span className="block text-sm font-bold text-text-primary font-mono mt-1">
                {test.hasNegativeMarking ? `-${test.negativeMarks} marks` : 'None'}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs text-text-secondary leading-relaxed border-t border-border-color pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <FileText size={15} /> General Instructions & Guidelines
            </h3>

            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong className="text-text-primary">Official Timer:</strong> The countdown timer will start <strong>only after you click "Start Exam"</strong> below. The timer does NOT run while viewing instructions.
              </li>
              <li>
                <strong className="text-text-primary">Answering & Mark for Review:</strong> You can choose an option, clear your choice, or click <strong className="text-text-primary">"Mark for Review"</strong> to flag uncertain questions for later inspection. Questions with an answer selected will still be evaluated even if marked for review.
              </li>
              <li>
                <strong className="text-text-primary">Navigation & Palette:</strong> Navigate freely using the Question Palette or Next/Prev buttons. The Question Palette displays counts and filters for Answered, Unanswered, and Marked questions.
              </li>
              <li>
                <strong className="text-text-primary">Fullscreen Requirement:</strong> You can enable fullscreen mode to maintain test focus. An exit warning and re-entry button appear if fullscreen is interrupted.
              </li>
              <li>
                <strong className="text-text-primary">Activity & Tab-Switch Monitoring:</strong> Window minimization and tab switching are tracked as objective activity indicators and logged in the session audit timeline.
              </li>
              <li>
                <strong className="text-text-primary">Session Resume Policy (Max 4 Attempts):</strong> In case of accidental disconnection or browser refresh, your progress is saved. You are allowed up to a maximum of <strong className="text-text-primary">4 successful resume attempts</strong>.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border-color space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Candidate Declaration & Undertaking
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              I hereby declare that I am appearing for this examination under fair conditions. I understand that my tab-switch activity, focus transitions, and fullscreen status will be recorded in the session audit timeline.
            </p>

            <div className="space-y-2.5 pt-1 border-t border-border-color/60">
              <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableFullscreenPref}
                  onChange={(e) => setEnableFullscreenPref(e.target.checked)}
                  className="w-4 h-4 rounded border-border-color text-text-primary focus:ring-0 cursor-pointer"
                />
                <span><strong>Enable Fullscreen Mode upon starting exam</strong> (Recommended for testing integrity)</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="acknowledgeInstructions"
                  checked={acknowledgedInstructions}
                  onChange={(e) => setAcknowledgedInstructions(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border-color text-text-primary focus:ring-0 cursor-pointer"
                />
                <span>
                  <strong>I have read, understood, and agree to the examination rules and candidate declaration.</strong> (The test timer will start only when you click Start Exam below).
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/mock-tests')}
              className="btn btn-secondary btn-sm w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleStartTest}
              disabled={!acknowledgedInstructions || isSubmitting}
              className="btn btn-primary btn-sm w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Maximize2 size={15} />
              <span>
                {isSubmitting
                  ? 'Starting Session...'
                  : enableFullscreenPref
                  ? 'Enable Fullscreen & Start Test'
                  : 'Start Test'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== 2. RESUME ACTIVE SESSION PROMPT MODE =====================
  if (mode === 'resume_prompt') {
    const resumesUsed = sessionMeta.resumeCount || 0;
    const maxResumes = sessionMeta.maxResumesAllowed || 4;
    const resumesRemaining = Math.max(0, maxResumes - resumesUsed);
    const canResume = resumesRemaining > 0;

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="card p-6 sm:p-8 space-y-6 border-neutral-500 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border-color text-text-primary">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                Active Test Session Detected
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                An active assessment session was found for this mock test.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-border-color space-y-3 text-xs">
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="text-text-secondary">Test Title:</span>
              <span className="font-semibold text-text-primary">{test.title}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="text-text-secondary">Original Start Time:</span>
              <span className="font-mono text-text-primary">{formatDateTime(activeSession.startedAt)}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="text-text-secondary">Remaining Time:</span>
              <span className="font-mono font-bold text-text-primary">{formatTimer(activeSession.remainingSeconds)}</span>
            </div>
            <div className="flex justify-between border-b border-border-color pb-2">
              <span className="text-text-secondary">Answers Saved:</span>
              <span className="font-mono font-bold text-text-primary">
                {Object.keys(activeSession.savedAnswers || {}).length} of {test.questions?.length}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-text-secondary">Resume Attempts Remaining:</span>
              <span className={`font-mono font-bold ${canResume ? 'text-text-primary' : 'text-neutral-400'}`}>
                {resumesRemaining} of {maxResumes}
              </span>
            </div>
          </div>

          {canResume ? (
            <p className="text-xs text-text-secondary leading-relaxed">
              Clicking <strong className="text-text-primary">Resume Test</strong> will restore your answers and timer. This will consume 1 of your {resumesRemaining} remaining resume attempts.
            </p>
          ) : (
            <div className="p-3.5 rounded-lg border border-neutral-500 bg-surface-100 dark:bg-surface-800 text-xs text-text-primary space-y-1">
              <strong className="block flex items-center gap-1.5">
                <ShieldAlert size={14} /> Maximum Resume Limit Reached
              </strong>
              <p className="text-text-secondary leading-relaxed">
                You have already used all 4 allowed resume attempts for this test session. No further resumes are permitted. You may submit your currently saved answers for final scoring.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/mock-tests')}
              className="btn btn-secondary btn-sm w-full sm:w-auto"
            >
              Back to Mock Tests
            </button>

            {canResume ? (
              <button
                type="button"
                onClick={handleResumeTest}
                disabled={isResuming}
                className="btn btn-primary btn-sm w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>{isResuming ? 'Resuming Session...' : `Resume Test (${resumesRemaining} Remaining)`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={submitTestInternal}
                disabled={isSubmitting}
                className="btn btn-primary btn-sm w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Evaluating...' : 'Submit Saved Answers'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== 3. DETAILED RESULT & TIMELINE REVIEW MODE =====================
  if (mode === 'result' && result) {
    const isPass = result.isPassed;
    const accuracy =
      result.correctCount + result.incorrectCount > 0
        ? Math.round((result.correctCount / (result.correctCount + result.incorrectCount)) * 100)
        : 0;

    const filteredAnswers = (result.answers || []).filter((ans) => {
      const isUserCorrect = ans.isCorrect;
      const isUnattempted = ans.selectedOption === -1 || ans.selectedOption === null || ans.selectedOption === undefined;

      if (reviewFilter === 'correct') return isUserCorrect;
      if (reviewFilter === 'incorrect') return !isUserCorrect && !isUnattempted;
      if (reviewFilter === 'unattempted') return isUnattempted;
      return true;
    });

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-border-color">
          <Link
            to="/mock-tests"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition touch-manipulation"
          >
            <ArrowLeft size={14} />
            Back to All Mock Tests
          </Link>
          <span className="text-xs font-mono text-text-secondary">
            Category: {result.category || test.category}
          </span>
        </div>

        <div className="card p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-color">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
                  Test Evaluation Report
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border border-border-color ${
                    isPass
                      ? 'bg-surface-100 dark:bg-surface-800 text-text-primary font-bold'
                      : 'bg-surface-200 dark:bg-surface-700 text-text-secondary'
                  }`}
                >
                  {isPass ? 'PASSED CUTOFF' : 'NEEDS PRACTICE'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                {result.mockTestTitle || test.title}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Started: {formatDateTime(result.startedAt || result.createdAt)} • Submitted: {formatDateTime(result.submittedAt || result.createdAt)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border-color text-center min-w-[150px]">
              <span className="text-xs text-text-secondary font-medium block">Total Score</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono block mt-1">
                {result.score} <span className="text-xs sm:text-sm text-text-secondary font-normal">/ {result.totalMarks}</span>
              </span>
              <span className="text-xs font-bold text-text-secondary block mt-0.5 font-mono">
                {result.percentage}% Marks
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
              <span className="block text-xs text-text-secondary">Total Questions</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {result.totalQuestions || result.answers?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
              <span className="block text-xs text-text-secondary">Correct</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {result.correctCount}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
              <span className="block text-xs text-text-secondary">Incorrect</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {result.incorrectCount}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
              <span className="block text-xs text-text-secondary">Accuracy</span>
              <span className="block text-lg font-bold text-text-primary font-mono mt-0.5">
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Session Security Indicators */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <ShieldAlert size={14} /> Session Integrity & Security Indicators
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
                <span className="block text-[11px] text-text-secondary">Tab/Focus Changes</span>
                <span className="block text-base font-bold text-text-primary font-mono mt-0.5">
                  {result.tabSwitchCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
                <span className="block text-[11px] text-text-secondary">Time Away from Test</span>
                <span className="block text-base font-bold text-text-primary font-mono mt-0.5">
                  {result.totalTimeAwaySeconds || 0}s
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
                <span className="block text-[11px] text-text-secondary">Fullscreen Exits</span>
                <span className="block text-base font-bold text-text-primary font-mono mt-0.5">
                  {result.fullscreenExitCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40">
                <span className="block text-[11px] text-text-secondary">Resumes Used</span>
                <span className="block text-base font-bold text-text-primary font-mono mt-0.5">
                  {result.resumeCount || 0} <span className="text-xs font-normal text-text-secondary">/ {result.maxResumesAllowed || 4}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleRetake}
              className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation"
            >
              <RotateCcw size={14} />
              <span>Retake Test</span>
            </button>
            <Link to="/mock-tests" className="btn btn-secondary btn-sm touch-manipulation">
              Take Another Test
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-sm touch-manipulation">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Dedicated Activity Timeline */}
        <div className="card p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border-color pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Activity size={17} />
                Test Activity Timeline
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Objective chronological audit log of session start, resumes, focus changes, and submission.
              </p>
            </div>
            <span className="text-xs font-mono text-text-secondary">
              {(result.activityEvents || []).length} Recorded Events
            </span>
          </div>

          {(result.activityEvents || []).length === 0 ? (
            <p className="text-xs text-text-secondary py-3">No activity events recorded for this session.</p>
          ) : (
            <div className="space-y-3 pt-2 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border-color">
              {result.activityEvents.map((evt, idx) => {
                let icon = <Activity size={13} />;

                if (evt.type === 'test_started') {
                  icon = <Clock size={13} />;
                } else if (evt.type === 'tab_hidden' || evt.type === 'tab_visible') {
                  icon = <EyeOff size={13} />;
                } else if (evt.type === 'fullscreen_exit') {
                  icon = <Minimize2 size={13} />;
                } else if (evt.type === 'test_resumed') {
                  icon = <RotateCcw size={13} />;
                } else if (evt.type === 'test_submitted') {
                  icon = <CheckCircle2 size={13} />;
                }

                return (
                  <div key={idx} className="relative flex items-start gap-3.5 pl-1.5">
                    <div className="w-5 h-5 rounded-full border border-border-color bg-surface-50 dark:bg-surface-900 flex items-center justify-center shrink-0 z-10 text-text-primary">
                      {icon}
                    </div>

                    <div className="flex-1 p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="font-semibold text-text-primary">
                          {evt.details || evt.type.replace(/_/g, ' ')}
                        </span>
                        {evt.durationSeconds > 0 && (
                          <span className="ml-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-secondary">
                            Duration: {evt.durationSeconds}s
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-text-secondary shrink-0">
                        {formatDateTime(evt.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Question Review Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BookOpen size={18} />
                Question & Answer Key Review ({result.answers?.length || 0})
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Review correct options, technical reasoning, and detailed explanations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-border-color">
              {[
                { id: 'all', label: `All (${result.answers?.length || 0})` },
                { id: 'incorrect', label: `Incorrect (${result.incorrectCount || 0})` },
                { id: 'unattempted', label: `Unattempted (${Math.max(0, (result.totalQuestions || 0) - (result.correctCount + result.incorrectCount))})` },
                { id: 'correct', label: `Correct (${result.correctCount || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReviewFilter(tab.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition touch-manipulation ${
                    reviewFilter === tab.id
                      ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAnswers.length === 0 ? (
            <div className="card p-8 text-center text-xs text-text-secondary">
              No questions found under filter "{reviewFilter}".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnswers.map((ans, idx) => {
                const originalIndex = result.answers?.findIndex((a) => a.questionText === ans.questionText);
                const displayQNumber = originalIndex !== -1 ? originalIndex + 1 : idx + 1;
                const isUserCorrect = ans.isCorrect;
                const isUnattempted = ans.selectedOption === -1 || ans.selectedOption === null || ans.selectedOption === undefined;

                return (
                  <div key={idx} className="card p-4 sm:p-5 space-y-3.5 border-border-color">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary font-mono">
                        Question {displayQNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        {isUnattempted ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-secondary border border-border-color">
                            Unattempted (0 Marks)
                          </span>
                        ) : isUserCorrect ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color flex items-center gap-1">
                            <Check size={12} /> Correct (+{ans.marksAwarded} Marks)
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-secondary border border-border-color flex items-center gap-1">
                            <X size={12} /> Incorrect ({ans.marksAwarded} Marks)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-text-primary leading-relaxed">
                      {ans.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {ans.options?.map((opt, optIdx) => {
                        const isOptionCorrect = optIdx === ans.correctOption;
                        const isOptionSelected = optIdx === ans.selectedOption;

                        let style = 'bg-surface-50 dark:bg-surface-800/40 border-border-color text-text-secondary';
                        if (isOptionCorrect) {
                          style = 'bg-surface-100 dark:bg-surface-700/80 border-text-primary text-text-primary font-semibold';
                        } else if (isOptionSelected && !isUserCorrect) {
                          style = 'bg-surface-200 dark:bg-surface-800 border-neutral-500 text-text-primary line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-text-primary">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isOptionCorrect && (
                              <span className="text-[10px] uppercase font-bold text-text-primary px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-600 shrink-0">
                                Correct Answer
                              </span>
                            )}
                            {isOptionSelected && !isOptionCorrect && (
                              <span className="text-[10px] uppercase font-bold text-text-secondary px-1.5 py-0.5 rounded bg-surface-300 dark:bg-surface-700 shrink-0">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {ans.explanation && (
                      <div className="mt-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-border-color text-xs space-y-1">
                        <span className="font-bold text-text-primary flex items-center gap-1">
                          <HelpCircle size={13} /> Explanation:
                        </span>
                        <p className="text-text-secondary leading-relaxed">
                          {ans.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== 4. ACTIVE TEST ATTEMPT MODE =====================
  const currentQuestion = test.questions?.[currentIndex];
  const isLastQuestion = currentIndex === (test.questions?.length || 1) - 1;
  const isTimeLow = timeLeft < 120;
  const resumesUsed = sessionMeta.resumeCount || 0;
  const maxResumes = sessionMeta.maxResumesAllowed || 4;
  const resumesRemaining = Math.max(0, maxResumes - resumesUsed);
  const isCurrentMarked = markedForReview.has(currentIndex);

  const filteredPaletteQuestions = (test.questions || []).map((q, idx) => ({ q, idx })).filter(({ idx }) => {
    const isAnswered = selectedAnswers[idx] !== undefined;
    const isMarked = markedForReview.has(idx);

    if (paletteFilter === 'answered') return isAnswered;
    if (paletteFilter === 'unanswered') return !isAnswered;
    if (paletteFilter === 'marked') return isMarked;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full space-y-4 sm:space-y-5 pb-24 lg:pb-6">
      {showAwayBanner && (
        <div className="p-3.5 rounded-xl border border-neutral-500 bg-surface-100 dark:bg-surface-800 text-xs text-text-primary flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <EyeOff size={16} className="text-text-secondary shrink-0" />
            <span>
              You left the test page for <strong>{lastAwayDuration} seconds</strong>. This activity has been recorded in your session audit timeline.
            </span>
          </div>
          <button
            onClick={() => setShowAwayBanner(false)}
            className="p-1 rounded text-text-secondary hover:text-text-primary transition"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showFullscreenWarning && !isFullscreen && (
        <div className="p-3.5 rounded-xl border border-neutral-500 bg-surface-200 dark:bg-surface-800 text-xs text-text-primary flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Minimize2 size={16} className="text-text-secondary shrink-0" />
            <span>
              <strong>Fullscreen Exited:</strong> Please re-enter fullscreen mode to maintain standard testing conditions.
            </span>
          </div>
          <button
            onClick={requestFullscreen}
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 shrink-0"
          >
            <Maximize2 size={13} />
            <span>Re-enter Fullscreen</span>
          </button>
        </div>
      )}

      <div className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-16 z-20 backdrop-blur-md bg-surface-0/95 dark:bg-surface-900/95 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
              {test.category}
            </span>

            {isFullscreen ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 animate-pulse" />
                Fullscreen Active
              </span>
            ) : (
              <button
                type="button"
                onClick={requestFullscreen}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary border border-neutral-500 flex items-center gap-1 hover:underline touch-manipulation"
                title="Click to enter fullscreen"
              >
                <Maximize2 size={11} />
                Enter Fullscreen
              </button>
            )}

            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-50 dark:bg-surface-800 text-text-secondary border border-border-color">
              Resumes: {resumesRemaining}/4
            </span>

            {markedCount > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary border border-border-color flex items-center gap-1">
                <Bookmark size={11} className="fill-current" />
                {markedCount} Marked
              </span>
            )}
          </div>

          <h1 className="text-sm sm:text-base font-bold text-text-primary mt-1 truncate">
            {test.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Prominent Fullscreen Mode Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`btn btn-sm flex items-center gap-1.5 touch-manipulation text-xs font-semibold ${
              isFullscreen
                ? 'btn-secondary text-text-primary'
                : 'bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 border-text-primary shadow-sm'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen'}</span>
            <span className="sm:hidden">{isFullscreen ? 'Exit FS' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden btn btn-secondary btn-sm flex items-center gap-1.5 font-mono text-xs touch-manipulation px-2.5 py-1.5"
            title="Open Question Palette"
          >
            <LayoutGrid size={15} />
            <span>{attemptedCount}/{totalQuestions}</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm flex items-center gap-2 ${
              isTimeLow
                ? 'bg-surface-200 dark:bg-surface-700 border-neutral-500 text-text-primary animate-pulse'
                : 'bg-surface-100 dark:bg-surface-800 border-border-color text-text-primary'
            }`}
          >
            <Clock size={15} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation text-xs sm:text-sm"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Submit Test</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5 sm:p-6 space-y-6 min-h-[360px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-color flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-text-primary font-mono">
                    Question {currentIndex + 1} of {test.questions?.length}
                  </span>
                  {isCurrentMarked && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary border border-border-color flex items-center gap-1">
                      <Bookmark size={10} className="fill-current" />
                      Marked for Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMarkForReview(currentIndex)}
                    className={`btn btn-sm text-xs flex items-center gap-1.5 touch-manipulation transition ${
                      isCurrentMarked
                        ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold border-text-primary'
                        : 'btn-secondary text-text-secondary hover:text-text-primary'
                    }`}
                    title="Toggle Mark for Review"
                  >
                    <Bookmark size={13} className={isCurrentMarked ? 'fill-current' : ''} />
                    <span>{isCurrentMarked ? 'Marked' : 'Mark for Review'}</span>
                  </button>

                  {selectedAnswers[currentIndex] !== undefined && (
                    <button
                      onClick={handleClearAnswer}
                      className="text-xs text-text-secondary hover:text-text-primary underline transition touch-manipulation ml-1"
                    >
                      Clear Choice
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
                {currentQuestion?.questionText}
              </h2>

              <div className="space-y-2.5 pt-2">
                {currentQuestion?.options?.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleOptionSelect(optIdx)}
                      className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center gap-3.5 group touch-manipulation select-none active:scale-[0.99] min-h-[48px] ${
                        isSelected
                          ? 'border-text-primary bg-surface-100 dark:bg-surface-800 text-text-primary shadow-sm'
                          : 'border-border-color bg-surface-50 dark:bg-surface-800/40 text-text-secondary hover:border-neutral-500 hover:text-text-primary'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-mono text-xs font-bold transition ${
                          isSelected
                            ? 'border-text-primary bg-text-primary text-surface-50'
                            : 'border-border-color bg-surface-100 dark:bg-surface-700 text-text-secondary group-hover:border-neutral-500 group-hover:text-text-primary'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="leading-snug break-words">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-between pt-4 border-t border-border-color">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-40 touch-manipulation"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!markedForReview.has(currentIndex)) {
                      toggleMarkForReview(currentIndex);
                    }
                    if (!isLastQuestion) {
                      setCurrentIndex((prev) => prev + 1);
                    }
                  }}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 touch-manipulation"
                  title="Mark this question and proceed to next"
                >
                  <Bookmark size={13} />
                  <span>Mark & Next</span>
                </button>

                {isLastQuestion ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation"
                  >
                    <span>Finish & Submit</span>
                    <Send size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4 hidden lg:block sticky top-36">
          <div className="flex items-center justify-between pb-3 border-b border-border-color">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Question Palette
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">
              {attemptedCount}/{totalQuestions} Answered
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-text-primary shrink-0" />
              <span>Answered ({attemptedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-border-color bg-surface-100 dark:bg-surface-800 shrink-0" />
              <span>Unanswered ({unattemptedCount})</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2 pt-0.5">
              <span className="w-3 h-3 rounded bg-surface-200 dark:bg-surface-700 border border-neutral-400 flex items-center justify-center shrink-0">
                <Bookmark size={8} className="fill-current text-text-primary" />
              </span>
              <span>Marked for Review ({markedCount})</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-border-color text-[10px]">
            <button
              onClick={() => setPaletteFilter('all')}
              className={`py-1 rounded font-medium transition ${
                paletteFilter === 'all'
                  ? 'bg-text-primary text-surface-50 font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPaletteFilter('answered')}
              className={`py-1 rounded font-medium transition ${
                paletteFilter === 'answered'
                  ? 'bg-text-primary text-surface-50 font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Ans
            </button>
            <button
              onClick={() => setPaletteFilter('unanswered')}
              className={`py-1 rounded font-medium transition ${
                paletteFilter === 'unanswered'
                  ? 'bg-text-primary text-surface-50 font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Unans
            </button>
            <button
              onClick={() => setPaletteFilter('marked')}
              className={`py-1 rounded font-medium transition ${
                paletteFilter === 'marked'
                  ? 'bg-text-primary text-surface-50 font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Marked
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2 pt-1">
              {filteredPaletteQuestions.map(({ idx: qIdx }) => {
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                const isMarked = markedForReview.has(qIdx);
                const isCurrent = currentIndex === qIdx;

                let style = 'bg-surface-100 dark:bg-surface-800 text-text-secondary border-border-color';
                if (isAnswered && isMarked) {
                  style = 'bg-text-primary text-surface-50 border-text-primary font-bold';
                } else if (isAnswered) {
                  style = 'bg-text-primary text-surface-50 border-text-primary font-bold';
                } else if (isMarked) {
                  style = 'bg-surface-200 dark:bg-surface-700 text-text-primary border-neutral-400 font-bold';
                }
                if (isCurrent) {
                  style += ' ring-2 ring-neutral-400 dark:ring-neutral-200';
                }

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`h-9 rounded-lg border font-mono text-xs transition flex items-center justify-center relative touch-manipulation active:scale-95 ${style}`}
                  >
                    <span>{qIdx + 1}</span>
                    {isMarked && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border-color">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-secondary btn-sm w-full justify-center text-xs touch-manipulation"
            >
              Submit Test ({attemptedCount}/{totalQuestions})
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-0/95 dark:bg-surface-900/95 backdrop-blur-md border-t border-border-color px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-2">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-30 touch-manipulation min-h-[42px] px-3"
          aria-label="Previous question"
        >
          <ArrowLeft size={16} />
          <span className="text-xs">Prev</span>
        </button>

        <button
          type="button"
          onClick={() => toggleMarkForReview(currentIndex)}
          className={`btn btn-sm min-h-[42px] px-3 touch-manipulation flex items-center gap-1.5 text-xs ${
            isCurrentMarked
              ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-bold border-text-primary'
              : 'btn-secondary text-text-secondary'
          }`}
        >
          <Bookmark size={14} className={isCurrentMarked ? 'fill-current' : ''} />
          <span>{isCurrentMarked ? 'Marked' : 'Mark'}</span>
        </button>

        <button
          onClick={() => setShowMobilePalette(true)}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 font-mono text-xs touch-manipulation min-h-[42px] px-2.5"
          aria-label="Open question palette"
        >
          <LayoutGrid size={15} />
          <span>{attemptedCount}/{totalQuestions}</span>
        </button>

        {isLastQuestion ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation min-h-[42px] px-4 text-xs font-semibold"
          >
            <span>Submit</span>
            <Send size={14} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
            className="btn btn-primary btn-sm flex items-center gap-1.5 touch-manipulation min-h-[42px] px-4 text-xs font-semibold"
            aria-label="Next question"
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {showMobilePalette && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card w-full sm:max-w-xl max-h-[85vh] flex flex-col rounded-b-none sm:rounded-2xl border-b-0 sm:border-b p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-color">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <LayoutGrid size={16} />
                  Question Palette
                </h3>
                <span className="text-xs font-mono text-text-secondary mt-0.5 block">
                  {attemptedCount} of {totalQuestions} answered ({unattemptedCount} remaining)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="p-1.5 rounded-lg border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition touch-manipulation"
                aria-label="Close palette"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-text-primary shrink-0" />
                <span>Ans ({attemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-border-color bg-surface-100 dark:bg-surface-800 shrink-0" />
                <span>Unans ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-200 dark:bg-surface-700 border border-neutral-400 flex items-center justify-center shrink-0">
                  <Bookmark size={7} className="fill-current text-text-primary" />
                </span>
                <span>Marked ({markedCount})</span>
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain max-h-[50vh] p-1 pr-2">
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {test.questions?.map((_, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  const isMarked = markedForReview.has(qIdx);
                  const isCurrent = currentIndex === qIdx;

                  let style = 'bg-surface-100 dark:bg-surface-800 text-text-secondary border-border-color';
                  if (isAnswered && isMarked) {
                    style = 'bg-text-primary text-surface-50 border-text-primary font-bold';
                  } else if (isAnswered) {
                    style = 'bg-text-primary text-surface-50 border-text-primary font-bold';
                  } else if (isMarked) {
                    style = 'bg-surface-200 dark:bg-surface-700 text-text-primary border-neutral-400 font-bold';
                  }
                  if (isCurrent) {
                    style += ' ring-2 ring-neutral-400 dark:ring-neutral-200';
                  }

                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(qIdx);
                        setShowMobilePalette(false);
                      }}
                      className={`h-11 rounded-lg border font-mono text-xs font-semibold transition flex items-center justify-center relative touch-manipulation active:scale-95 ${style}`}
                    >
                      <span>{qIdx + 1}</span>
                      {isMarked && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-color gap-3">
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="btn btn-secondary btn-sm flex-1 justify-center min-h-[40px] touch-manipulation"
              >
                Back to Question
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobilePalette(false);
                  setShowConfirmModal(true);
                }}
                className="btn btn-primary btn-sm flex-1 justify-center flex items-center gap-1.5 min-h-[40px] touch-manipulation"
              >
                <Send size={14} />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card max-w-md w-full p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">
                Confirm Test Submission
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Are you sure you want to finish and submit your mock test? Once submitted, your answers will be evaluated immediately.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800/60 border border-border-color space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Total Questions:</span>
                <span className="font-mono font-bold text-text-primary">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Attempted Questions:</span>
                <span className="font-mono font-bold text-text-primary">{attemptedCount}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Unattempted Questions:</span>
                <span className="font-mono font-bold text-text-primary">{unattemptedCount}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Marked for Review:</span>
                <span className="font-mono font-bold text-text-primary">{markedCount}</span>
              </div>
              <div className="flex justify-between text-text-secondary border-t border-border-color pt-1.5">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-text-primary">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary italic">
              Note: Questions marked for review will be evaluated if you have selected an answer.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="btn btn-secondary btn-sm min-h-[38px] touch-manipulation"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={submitTestInternal}
                disabled={isSubmitting}
                className="btn btn-primary btn-sm flex items-center gap-1.5 min-h-[38px] touch-manipulation"
              >
                {isSubmitting ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
