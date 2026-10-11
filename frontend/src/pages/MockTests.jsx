import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockTestApi } from '../services/mockTest.api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import {
  GraduationCap,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  BarChart2,
  Calendar,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  'All',
  'SSC',
  'Banking',
  'UPSC',
  'Railway',
  'GATE',
  'State Government Exams',
  'General / Other',
];

export const MockTests = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tests, setTests] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'created' | 'history'
  const [deletingId, setDeletingId] = useState(null);
  const { error, success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestsAndAttempts();
  }, [selectedCategory]);

  const fetchTestsAndAttempts = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'All' ? { category: selectedCategory } : {};
      const [testsRes, attemptsRes] = await Promise.all([
        mockTestApi.getAll(params),
        mockTestApi.getMyAttempts(),
      ]);

      setTests(testsRes.data.data.tests || []);
      setPastAttempts(attemptsRes.data.data.attempts || []);
    } catch (err) {
      console.error('Failed to load mock tests:', err);
      error('Failed to load mock tests. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this custom mock test?')) {
      return;
    }

    try {
      setDeletingId(testId);
      await mockTestApi.delete(testId);
      success('Mock test deleted successfully.');
      setTests((prev) => prev.filter((t) => t._id !== testId));
    } catch (err) {
      console.error('Failed to delete mock test:', err);
      error(err.response?.data?.message || 'Failed to delete mock test.');
    } finally {
      setDeletingId(null);
    }
  };

  const myCreatedTests = tests.filter((t) => user && t.createdBy === user._id);

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-100 dark:bg-surface-800 text-text-primary">
            Easy
          </span>
        );
      case 'Hard':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-200 dark:bg-surface-700 text-text-primary font-mono">
            Hard
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-100 dark:bg-surface-800 text-text-secondary">
            Medium
          </span>
        );
    }
  };

  const displayedTests = activeTab === 'created' ? myCreatedTests : tests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border-color">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Government Exam Mock Tests
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Practice with real exam questions, timed tests, negative marking, instant scoring, or create your own test.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header: Create Test Button & Tab switch */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Link
            to="/mock-tests/create"
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Create Mock Test</span>
          </Link>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-border-color">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'available'
                  ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'created'
                  ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              My Created ({myCreatedTests.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'history'
                  ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              History ({pastAttempts.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'available' || activeTab === 'created' ? (
        <>
          {/* Exam Category Pills */}
          {activeTab === 'available' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Select Exam Category
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-text-primary text-surface-50 border-text-primary shadow-sm'
                        : 'bg-surface-50 dark:bg-surface-800 text-text-secondary border-border-color hover:border-neutral-500 hover:text-text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Test Cards Grid */}
          {loading ? (
            <PageLoader />
          ) : displayedTests.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={BookOpen}
                title={activeTab === 'created' ? 'No custom mock tests created yet' : 'No tests available'}
                description={
                  activeTab === 'created'
                    ? 'You have not created any mock tests yet. Design your own test with custom questions, time limits, and negative marking!'
                    : `There are currently no mock tests found under category "${selectedCategory}".`
                }
                action={
                  activeTab === 'created' ? (
                    <Link to="/mock-tests/create" className="btn btn-primary btn-sm flex items-center gap-1.5">
                      <Plus size={14} />
                      <span>Create Your First Mock Test</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="btn btn-secondary btn-sm"
                    >
                      View All Categories
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedTests.map((test) => {
                const isMyTest = user && test.createdBy === user._id;

                return (
                  <div
                    key={test._id}
                    className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header tags */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
                            {test.category}
                          </span>
                          {test.isCustom && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary">
                              {isMyTest ? 'Created by You' : `by ${test.createdByName || 'User'}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getDifficultyBadge(test.difficulty)}
                          {isMyTest && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTest(test._id, e)}
                              disabled={deletingId === test._id}
                              className="p-1 rounded text-neutral-400 hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
                              title="Delete Test"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-semibold text-text-primary group-hover:text-text-primary leading-snug">
                          {test.title}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-3">
                          {test.description || 'Comprehensive exam practice questions.'}
                        </p>
                      </div>

                      {/* Metadata Chips */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-color text-center">
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800/60 border border-border-color">
                          <span className="block text-[11px] text-text-secondary font-medium">Questions</span>
                          <span className="block text-xs font-bold text-text-primary font-mono mt-0.5">
                            {test.questionsCount}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800/60 border border-border-color">
                          <span className="block text-[11px] text-text-secondary font-medium">Total Marks</span>
                          <span className="block text-xs font-bold text-text-primary font-mono mt-0.5">
                            {test.totalMarks}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800/60 border border-border-color">
                          <span className="block text-[11px] text-text-secondary font-medium">Time Limit</span>
                          <span className="block text-xs font-bold text-text-primary font-mono mt-0.5">
                            {test.durationMinutes}m
                          </span>
                        </div>
                      </div>

                      {/* Negative Marking Info Pill */}
                      <div className="text-[11px] text-text-secondary flex items-center justify-between pt-1">
                        <span>Negative Marking:</span>
                        <span className="font-mono font-medium text-text-primary">
                          {test.hasNegativeMarking ? `-${test.negativeMarks} marks` : 'None'}
                        </span>
                      </div>
                    </div>

                    {/* Start Button */}
                    <div className="pt-2 space-y-1.5">
                      <Link
                        to={`/mock-tests/${test._id}`}
                        className="btn btn-primary btn-sm w-full justify-center group-hover:shadow transition"
                      >
                        <span>Start Test</span>
                        <ArrowRight size={14} />
                      </Link>
                      <p className="text-[10px] text-text-secondary text-center">
                        Instructions & fullscreen checklist before timer starts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Attempt History Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <BarChart2 size={18} />
              Your Previous Test Attempts
            </h2>
            <span className="text-xs text-text-secondary">
              Total Attempts: {pastAttempts.length}
            </span>
          </div>

          {loading ? (
            <PageLoader />
          ) : pastAttempts.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={Award}
                title="No tests attempted yet"
                description="Take your first mock test to see your score, percentage, and detailed answers review."
                action={
                  <button
                    onClick={() => setActiveTab('available')}
                    className="btn btn-primary btn-sm"
                  >
                    Browse Mock Tests
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {pastAttempts.map((attempt) => (
                <div
                  key={attempt._id}
                  className="card p-4 hover:border-neutral-500 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
                        {attempt.mockTest?.category || 'Exam'}
                      </span>
                      <h3 className="font-semibold text-sm text-text-primary">
                        {attempt.mockTest?.title || 'Mock Test'}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          attempt.isPassed
                            ? 'bg-surface-100 dark:bg-surface-800 text-text-primary border-border-color'
                            : 'bg-surface-200 dark:bg-surface-700 text-neutral-400 border-border-color'
                        }`}
                      >
                        {attempt.isPassed ? 'PASSED' : 'NEEDS PRACTICE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(attempt.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {Math.floor((attempt.timeSpentSeconds || 0) / 60)}m {(attempt.timeSpentSeconds || 0) % 60}s spent
                      </span>
                    </div>
                  </div>

                  {/* Score pill & actions */}
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-base font-bold text-text-primary font-mono">
                        {attempt.score} / {attempt.totalMarks}
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono">
                        {attempt.percentage}% Score
                      </div>
                    </div>

                    <Link
                      to={`/mock-tests/${attempt.mockTest?._id || attempt.mockTest}?viewAttempt=${attempt._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Review Answers</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
