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
} from 'lucide-react';

export const MockTestAttempt = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const viewAttemptId = searchParams.get('viewAttempt');
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIndex]: optionIndex }
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    loadTestOrAttempt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, viewAttemptId]);

  const loadTestOrAttempt = async () => {
    try {
      setLoading(true);
      if (viewAttemptId) {
        // Load existing attempt result directly
        const res = await mockTestApi.getAttemptResult(viewAttemptId);
        const attempt = res.data.data.attempt;
        setResult(attempt);
        setTest(attempt.mockTest);
        setLoading(false);
        return;
      }

      // Load active test
      const res = await mockTestApi.getById(id);
      const testData = res.data.data.test;
      setTest(testData);

      const totalSeconds = (testData.durationMinutes || 15) * 60;
      setTimeLeft(totalSeconds);
      setInitialDuration(totalSeconds);
      startTimeRef.current = Date.now();
      setSelectedAnswers({});
      setCurrentIndex(0);
      setResult(null);

      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error loading mock test:', err);
      error('Failed to load mock test. Please try again.');
      navigate('/mock-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    info('Time is up! Submitting your answers automatically.');
    submitTestInternal();
  };

  const handleOptionSelect = (optionIdx) => {
    if (result) return; // Read-only in result mode
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx,
    }));
  };

  const handleClearAnswer = () => {
    if (result) return;
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const attemptedCount = Object.keys(selectedAnswers).length;
  const totalQuestions = test?.questions?.length || 0;
  const unattemptedCount = Math.max(0, totalQuestions - attemptedCount);

  const submitTestInternal = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      setIsSubmitting(true);
      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      const payload = {
        answers: selectedAnswers,
        timeSpentSeconds,
      };

      const res = await mockTestApi.submit(id, payload);
      const attemptData = res.data.data.attempt;
      setResult(attemptData);
      setShowConfirmModal(false);
      success('Mock test submitted successfully!');
    } catch (err) {
      console.error('Submit error:', err);
      error('Failed to submit test. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    loadTestOrAttempt();
  };

  if (loading) return <PageLoader />;
  if (!test) return null;

  // ===================== RESULT / REVIEW MODE =====================
  if (result) {
    const isPass = result.isPassed;
    const accuracy =
      result.correctCount + result.incorrectCount > 0
        ? Math.round((result.correctCount / (result.correctCount + result.incorrectCount)) * 100)
        : 0;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border-color">
          <Link
            to="/mock-tests"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition"
          >
            <ArrowLeft size={14} />
            Back to All Mock Tests
          </Link>
          <span className="text-xs font-mono text-text-secondary">
            Category: {result.category || test.category}
          </span>
        </div>

        {/* Scorecard Hero Card */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-color">
            <div>
              <div className="flex items-center gap-2 mb-1">
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
              <h1 className="text-2xl font-bold text-text-primary">
                {result.mockTestTitle || test.title}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Completed in {Math.floor(result.timeSpentSeconds / 60)} mins {result.timeSpentSeconds % 60} secs
              </p>
            </div>

            {/* Score Pill */}
            <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border-color text-center min-w-[160px]">
              <span className="text-xs text-text-secondary font-medium block">Total Score</span>
              <span className="text-3xl font-extrabold text-text-primary font-mono block mt-1">
                {result.score} <span className="text-sm text-text-secondary font-normal">/ {result.totalMarks}</span>
              </span>
              <span className="text-xs font-bold text-text-secondary block mt-0.5 font-mono">
                {result.percentage}% Marks
              </span>
            </div>
          </div>

          {/* Metric Breakdown Grid */}
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

          {/* Performance Summary Text */}
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-border-color space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Award size={14} />
              Performance Summary
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {result.percentage >= 75
                ? 'Outstanding performance! You displayed exceptional grasp across key syllabus concepts and comfortably cleared the benchmark cutoff.'
                : result.percentage >= (result.passingPercentage || 40)
                ? 'Good effort! You cleared the passing threshold. Focus on reviewing incorrect responses below to boost speed and precision for actual exam day.'
                : 'Need more practice. Review the detailed explanations below for each question to solidify conceptual clarity.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleRetake}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Retake Test</span>
            </button>
            <Link to="/mock-tests" className="btn btn-secondary btn-sm">
              Take Another Test
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <BookOpen size={18} />
              Question & Answer Key Review ({result.answers?.length || 0})
            </h2>
            <span className="text-xs text-text-secondary">
              Review correct options and explanations
            </span>
          </div>

          <div className="space-y-4">
            {result.answers?.map((ans, idx) => {
              const isUserCorrect = ans.isCorrect;
              const isUnattempted = ans.selectedOption === -1 || ans.selectedOption === null || ans.selectedOption === undefined;

              return (
                <div
                  key={idx}
                  className="card p-5 space-y-3.5 border-border-color"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-text-primary font-mono">
                      Question {idx + 1}
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

                  {/* Question Text */}
                  <p className="text-sm font-medium text-text-primary leading-relaxed">
                    {ans.questionText}
                  </p>

                  {/* Options List */}
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
                            <span className="text-[10px] uppercase font-bold text-text-primary px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-600">
                              Correct Answer
                            </span>
                          )}
                          {isOptionSelected && !isOptionCorrect && (
                            <span className="text-[10px] uppercase font-bold text-text-secondary px-1.5 py-0.5 rounded bg-surface-300 dark:bg-surface-700">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
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
        </div>
      </div>
    );
  }

  // ===================== ACTIVE TEST ATTEMPT MODE =====================
  const currentQuestion = test.questions?.[currentIndex];
  const isLastQuestion = currentIndex === (test.questions?.length || 1) - 1;
  const isTimeLow = timeLeft < 120; // less than 2 mins

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
      {/* Test Header */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
              {test.category}
            </span>
            <span className="text-xs text-text-secondary">
              Marks: +{currentQuestion?.marks || 2} / -{currentQuestion?.negativeMarks || 0.5}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-text-primary mt-1">
            {test.title}
          </h1>
        </div>

        {/* Live Timer & Submit Action */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm flex items-center gap-2 ${
              isTimeLow
                ? 'bg-surface-200 dark:bg-surface-700 border-neutral-500 text-text-primary animate-pulse'
                : 'bg-surface-100 dark:bg-surface-800 border-border-color text-text-primary'
            }`}
          >
            <Clock size={16} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Submit Test</span>
          </button>
        </div>
      </div>

      {/* Main Test Grid: Question on left, Palette on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Current Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-6 space-y-6 min-h-[380px] flex flex-col justify-between">
            <div className="space-y-4">
              {/* Question Count Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-color">
                <span className="text-xs font-bold text-text-primary font-mono">
                  Question {currentIndex + 1} of {test.questions?.length}
                </span>

                {selectedAnswers[currentIndex] !== undefined && (
                  <button
                    onClick={handleClearAnswer}
                    className="text-xs text-text-secondary hover:text-text-primary underline transition"
                  >
                    Clear Choice
                  </button>
                )}
              </div>

              {/* Question Statement */}
              <h2 className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
                {currentQuestion?.questionText}
              </h2>

              {/* MCQ Options */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion?.options?.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleOptionSelect(optIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center gap-3.5 group ${
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
                      <span className="leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-border-color">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {isLastQuestion ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <span>Finish & Submit</span>
                    <Send size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-color">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Question Palette
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">
              {attemptedCount}/{totalQuestions} Answered
            </span>
          </div>

          {/* Palette Status Indicator */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-text-primary shrink-0" />
              <span>Answered ({attemptedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-border-color bg-surface-100 dark:bg-surface-800 shrink-0" />
              <span>Unanswered ({unattemptedCount})</span>
            </div>
          </div>

          {/* Question Number Buttons Grid */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {test.questions?.map((_, qIdx) => {
              const isAnswered = selectedAnswers[qIdx] !== undefined;
              const isCurrent = currentIndex === qIdx;

              let style = 'bg-surface-100 dark:bg-surface-800 text-text-secondary border-border-color';
              if (isAnswered) {
                style = 'bg-text-primary text-surface-50 border-text-primary font-bold';
              }
              if (isCurrent) {
                style += ' ring-2 ring-neutral-400 dark:ring-neutral-200';
              }

              return (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => setCurrentIndex(qIdx)}
                  className={`h-9 rounded-lg border font-mono text-xs transition flex items-center justify-center ${style}`}
                >
                  {qIdx + 1}
                </button>
              );
            })}
          </div>

          {/* Final Submit shortcut in palette */}
          <div className="pt-3 border-t border-border-color">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-secondary btn-sm w-full justify-center text-xs"
            >
              Submit Test ({attemptedCount}/{totalQuestions})
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Confirm Test Submission
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Are you sure you want to finish and submit your mock test? Once submitted, your answers will be evaluated immediately.
              </p>
            </div>

            {/* Attempt Summary */}
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/60 border border-border-color space-y-2 text-xs">
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
              <div className="flex justify-between text-text-secondary border-t border-border-color pt-1.5">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-text-primary">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="btn btn-secondary btn-sm"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={submitTestInternal}
                disabled={isSubmitting}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
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
