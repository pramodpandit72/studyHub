import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockTestApi } from '../services/mockTest.api';
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
];

export const MockTests = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tests, setTests] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'history'
  const { error } = useToast();
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
                Practice with real exam questions, timed tests, instant scoring, and complete answer explanations.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch between Available Tests and Attempt History */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-border-color self-start md:self-auto">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'available'
                ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Available Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'history'
                ? 'bg-surface-0 dark:bg-surface-700 text-text-primary shadow-sm border border-border-color'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Attempt History ({pastAttempts.length})
          </button>
        </div>
      </div>

      {activeTab === 'available' ? (
        <>
          {/* Exam Category Pills */}
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

          {/* Test Cards Grid */}
          {loading ? (
            <PageLoader />
          ) : tests.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={BookOpen}
                title="No tests available"
                description={`There are currently no mock tests found under category "${selectedCategory}".`}
                action={
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="btn btn-secondary btn-sm"
                  >
                    View All Categories
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color">
                        {test.category}
                      </span>
                      {getDifficultyBadge(test.difficulty)}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-semibold text-text-primary group-hover:text-text-primary leading-snug">
                        {test.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-3">
                        {test.description}
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
                  </div>

                  {/* Start Button */}
                  <div className="pt-2">
                    <Link
                      to={`/mock-tests/${test._id}`}
                      className="btn btn-primary btn-sm w-full justify-center group-hover:shadow transition"
                    >
                      <span>Start Test</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
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
                      {attempt.isPassed ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Passed ({attempt.percentage}%)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border-color bg-surface-200 dark:bg-surface-700 text-text-secondary flex items-center gap-1">
                          <AlertCircle size={12} />
                          Needs Practice ({attempt.percentage}%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">
                      Attempted on {new Date(attempt.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}   Time Spent: {Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-start md:self-center">
                    <div className="text-right">
                      <span className="block text-xs text-text-secondary">Score</span>
                      <span className="block text-base font-bold text-text-primary font-mono">
                        {attempt.score} / {attempt.totalMarks}
                      </span>
                    </div>

                    <Link
                      to={`/mock-tests/${attempt.mockTest?._id || attempt.mockTest}?viewAttempt=${attempt._id}`}
                      className="btn btn-secondary btn-sm text-xs"
                    >
                      Review Answers
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
