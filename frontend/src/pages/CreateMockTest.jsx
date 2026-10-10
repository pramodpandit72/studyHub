import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockTestApi } from '../services/mockTest.api';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  Check,
  Send,
  BookOpen,
} from 'lucide-react';
import { SEO } from '../components/common/SEO';

const CATEGORIES = [
  'SSC',
  'Banking',
  'UPSC',
  'Railway',
  'GATE',
  'State Government Exams',
  'General / Other',
];

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

const SAMPLE_QUESTIONS = [
  {
    questionText: 'Which planet in the solar system is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctOptionIndex: 1,
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'Mars is known as the Red Planet due to the prevalent iron oxide on its surface.',
  },
  {
    questionText: 'What is the value of (15 × 14) ÷ 7 + 25?',
    options: ['45', '50', '55', '60', '65'],
    correctOptionIndex: 2,
    marks: 2,
    negativeMarks: 0.5,
    explanation: '(15 × 14) / 7 = 15 × 2 = 30; 30 + 25 = 55.',
  },
  {
    questionText: 'In Indian Constitution, which Article guarantees the Right to Equality?',
    options: ['Article 14-18', 'Article 19-22', 'Article 23-24', 'Article 25-28'],
    correctOptionIndex: 0,
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'Articles 14 to 18 of the Indian Constitution guarantee the Right to Equality to all citizens.',
  },
];

export const CreateMockTest = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Test metadata
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SSC');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [difficulty, setDifficulty] = useState('Medium');
  const [passingPercentage, setPassingPercentage] = useState(40);

  // Global scoring rules
  const [hasNegativeMarking, setHasNegativeMarking] = useState(true);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState(0.5);
  const [defaultMarksPerQuestion, setDefaultMarksPerQuestion] = useState(2);
  const [defaultOptionsCount, setDefaultOptionsCount] = useState(4);

  // Questions array
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      marks: 2,
      negativeMarks: 0.5,
      explanation: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a new question
  const handleAddQuestion = () => {
    const opts = Array.from({ length: defaultOptionsCount }, () => '');
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: opts,
        correctOptionIndex: 0,
        marks: defaultMarksPerQuestion,
        negativeMarks: hasNegativeMarking ? defaultNegativeMarks : 0,
        explanation: '',
      },
    ]);
  };

  // Duplicate a question
  const handleDuplicateQuestion = (idx) => {
    const target = questions[idx];
    const copy = {
      ...target,
      options: [...target.options],
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, copy);
    setQuestions(updated);
  };

  // Remove question
  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      error('A mock test must contain at least 1 question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update question text
  const handleQuestionTextChange = (idx, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], questionText: text };
      return copy;
    });
  };

  // Update question option text
  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[optIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  // Add option to specific question
  const handleAddOptionToQuestion = (qIdx) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIdx].options.length >= 8) {
        error('Maximum 8 options permitted per question.');
        return prev;
      }
      copy[qIdx] = {
        ...copy[qIdx],
        options: [...copy[qIdx].options, ''],
      };
      return copy;
    });
  };

  // Remove option from specific question
  const handleRemoveOptionFromQuestion = (qIdx, optIdx) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIdx].options.length <= 2) {
        error('A question must have at least 2 options.');
        return prev;
      }
      const opts = copy[qIdx].options.filter((_, i) => i !== optIdx);
      let correctIdx = copy[qIdx].correctOptionIndex;
      if (correctIdx === optIdx) {
        correctIdx = 0;
      } else if (correctIdx > optIdx) {
        correctIdx -= 1;
      }
      copy[qIdx] = {
        ...copy[qIdx],
        options: opts,
        correctOptionIndex: correctIdx,
      };
      return copy;
    });
  };

  // Change correct option
  const handleSetCorrectOption = (qIdx, optIdx) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], correctOptionIndex: optIdx };
      return copy;
    });
  };

  // Change question marks
  const handleMarksChange = (qIdx, marks) => {
    const num = Math.max(0.5, parseFloat(marks) || 1);
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], marks: num };
      return copy;
    });
  };

  // Change question negative marks
  const handleNegativeMarksChange = (qIdx, neg) => {
    const num = Math.max(0, parseFloat(neg) || 0);
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], negativeMarks: num };
      return copy;
    });
  };

  // Change question explanation
  const handleExplanationChange = (qIdx, val) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], explanation: val };
      return copy;
    });
  };

  // Auto-fill sample template
  const handleLoadSampleTemplate = () => {
    setTitle('SSC CGL 2026 Tier-1 General Mock Test');
    setCategory('SSC');
    setDescription(
      'Practice mock test covering General Awareness, Quantitative Aptitude, and Indian Constitution. Designed for competitive exam aspirants.'
    );
    setDurationMinutes(15);
    setDifficulty('Medium');
    setHasNegativeMarking(true);
    setDefaultNegativeMarks(0.5);
    setDefaultMarksPerQuestion(2);
    setPassingPercentage(40);
    setQuestions(SAMPLE_QUESTIONS);
    success('Loaded sample mock test template with 3 verified questions.');
  };

  // Calculations
  const totalMarks = questions.reduce((acc, q) => acc + (parseFloat(q.marks) || 0), 0);

  // Validation
  const validateForm = () => {
    if (!title.trim()) {
      error('Please enter a mock test title.');
      return false;
    }
    if (!category) {
      error('Please select an exam category.');
      return false;
    }
    if (!durationMinutes || durationMinutes < 1) {
      error('Duration must be at least 1 minute.');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        error('Question ' + (i + 1) + ' is missing question text.');
        return false;
      }
      if (q.options.length < 2) {
        error('Question ' + (i + 1) + ' must have at least 2 options.');
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          error('Question ' + (i + 1) + ', Option ' + String.fromCharCode(65 + j) + ' cannot be empty.');
          return false;
        }
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        error('Question ' + (i + 1) + ' does not have a valid correct answer selected.');
        return false;
      }
    }
    return true;
  };

  // Submit test creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        durationMinutes: parseInt(durationMinutes, 10),
        difficulty,
        passingPercentage: parseInt(passingPercentage, 10),
        hasNegativeMarking,
        negativeMarks: hasNegativeMarking ? parseFloat(defaultNegativeMarks) : 0,
        marksPerQuestion: parseFloat(defaultMarksPerQuestion),
        optionsCount: parseInt(defaultOptionsCount, 10),
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((o) => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
          marks: parseFloat(q.marks) || defaultMarksPerQuestion,
          negativeMarks: hasNegativeMarking ? (parseFloat(q.negativeMarks) || defaultNegativeMarks) : 0,
          explanation: q.explanation ? q.explanation.trim() : '',
        })),
      };

      const res = await mockTestApi.create(payload);
      const createdTest = res.data.data.test;
      success('Mock test created successfully!');
      navigate('/mock-tests/' + createdTest._id);
    } catch (err) {
      console.error('Failed to create mock test:', err);
      error(err.response?.data?.message || 'Failed to create mock test. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <SEO
        title="Create Mock Test — StudyHub"
        description="Design and publish custom government exam mock tests with flexible time limits, negative marking, custom options, and solutions."
        canonical="https://studyhub.online/mock-tests/create"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div className="space-y-1">
          <Link
            to="/mock-tests"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition mb-1"
          >
            <ArrowLeft size={14} /> Back to Mock Tests
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <BookOpen size={24} />
            Create Custom Mock Test
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Configure test duration, negative marking, custom question options, and instant automated grading.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadSampleTemplate}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Load sample template with 3 pre-filled questions"
          >
            <Sparkles size={14} />
            <span>Load Template</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Test'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-color">
            <Layers size={18} className="text-text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              1. Test Details & Metadata
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Mock Test Name / Title <span className="text-neutral-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SSC CGL Tier 1 Mock Test 2026 - Quantitative Aptitude & GS"
                className="input text-sm w-full"
                maxLength={200}
                required
              />
              <span className="text-[11px] text-text-secondary">
                {title.length}/200 characters
              </span>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Exam Category <span className="text-neutral-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input text-sm w-full bg-surface-0 dark:bg-surface-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input text-sm w-full bg-surface-0 dark:bg-surface-800"
              >
                <option value="Easy">Easy (Foundation / Basic)</option>
                <option value="Medium">Medium (Standard Exam Pattern)</option>
                <option value="Hard">Hard (Advanced / High Cutoff)</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Instructions / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify syllabus covered, special instructions, or topics tested..."
                rows={2}
                className="input text-sm w-full resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Exam Rules & Scoring Engine */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-color">
            <Clock size={18} className="text-text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              2. Exam Rules, Duration & Negative Marking Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-primary">
                Test Duration (Minutes) <span className="text-neutral-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input text-sm w-28 font-mono"
                  required
                />
                <span className="text-xs text-text-secondary">minutes</span>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                      durationMinutes === mins
                        ? 'bg-text-primary text-surface-50 border-text-primary font-bold'
                        : 'bg-surface-50 dark:bg-surface-800 text-text-secondary border-border-color hover:text-text-primary'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Default Options Count */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-primary">
                Default Options Per Question
              </label>
              <select
                value={defaultOptionsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value, 10);
                  setDefaultOptionsCount(count);
                }}
                className="input text-sm w-full bg-surface-0 dark:bg-surface-800"
              >
                <option value={2}>2 Options (True / False or Binary Choice)</option>
                <option value={3}>3 Options (A, B, C)</option>
                <option value={4}>4 Options (A, B, C, D — Standard Exam Pattern)</option>
                <option value={5}>5 Options (A, B, C, D, E — Banking Exam Pattern)</option>
              </select>
              <span className="text-[11px] text-text-secondary block">
                You can add or remove options on individual questions at any time.
              </span>
            </div>

            {/* Negative Marking Engine */}
            <div className="space-y-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-border-color">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Negative Marking
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Deduct marks for incorrect candidate responses
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasNegativeMarking(!hasNegativeMarking)}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    hasNegativeMarking ? 'bg-text-primary' : 'bg-surface-200 dark:bg-surface-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-surface-50 shadow ring-0 transition duration-200 ease-in-out ${
                      hasNegativeMarking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasNegativeMarking && (
                <div className="pt-2 border-t border-border-color space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs text-text-secondary">
                      Negative Penalty Per Wrong Answer:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-text-primary">-</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="5"
                        value={defaultNegativeMarks}
                        onChange={(e) => setDefaultNegativeMarks(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="input text-xs w-20 font-mono text-center"
                      />
                      <span className="text-[11px] text-text-secondary">marks</span>
                    </div>
                  </div>

                  {/* Quick negative presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[0.25, 0.33, 0.5, 0.66, 1].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDefaultNegativeMarks(val)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                          defaultNegativeMarks === val
                            ? 'bg-text-primary text-surface-50 border-text-primary font-bold'
                            : 'bg-surface-100 dark:bg-surface-800 text-text-secondary border-border-color hover:text-text-primary'
                        }`}
                      >
                        -{val}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Default Marks & Passing Percentage */}
            <div className="space-y-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-border-color">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Marks Per Correct Answer
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Standard positive score rewarded per question
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-text-primary">+</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={defaultMarksPerQuestion}
                    onChange={(e) => setDefaultMarksPerQuestion(Math.max(0.5, parseFloat(e.target.value) || 1))}
                    className="input text-xs w-20 font-mono text-center"
                  />
                  <span className="text-[11px] text-text-secondary">marks</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border-color flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Passing Percentage
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Minimum score required to qualify
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 40)))}
                    className="input text-xs w-20 font-mono text-center"
                  />
                  <span className="text-[11px] text-text-secondary">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Live Summary Bar */}
        <div className="card p-4 bg-surface-100/70 dark:bg-surface-800/70 border border-border-color grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded bg-surface-50 dark:bg-surface-900 border border-border-color">
            <span className="text-[11px] text-text-secondary block font-medium">Questions</span>
            <span className="text-sm font-bold text-text-primary font-mono mt-0.5 block">
              {questions.length}
            </span>
          </div>
          <div className="p-2 rounded bg-surface-50 dark:bg-surface-900 border border-border-color">
            <span className="text-[11px] text-text-secondary block font-medium">Total Marks</span>
            <span className="text-sm font-bold text-text-primary font-mono mt-0.5 block">
              {totalMarks}
            </span>
          </div>
          <div className="p-2 rounded bg-surface-50 dark:bg-surface-900 border border-border-color">
            <span className="text-[11px] text-text-secondary block font-medium">Time Limit</span>
            <span className="text-sm font-bold text-text-primary font-mono mt-0.5 block">
              {durationMinutes} mins
            </span>
          </div>
          <div className="p-2 rounded bg-surface-50 dark:bg-surface-900 border border-border-color">
            <span className="text-[11px] text-text-secondary block font-medium">Negative Marking</span>
            <span className="text-sm font-bold text-text-primary font-mono mt-0.5 block">
              {hasNegativeMarking ? `-${defaultNegativeMarks} per wrong` : 'None'}
            </span>
          </div>
        </div>

        {/* Section 4: Questions Builder */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                3. Questions Builder ({questions.length} Questions)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="card p-6 border border-border-color space-y-4 hover:border-neutral-500 transition relative"
              >
                {/* Question Card Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-color">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 border border-border-color text-text-primary">
                      Q{qIdx + 1}
                    </span>
                    <span className="text-xs text-text-secondary font-mono">
                      (+{q.marks} / -{q.negativeMarks})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(qIdx)}
                      className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-text-secondary hover:text-text-primary transition"
                      title="Duplicate Question"
                    >
                      <Copy size={14} />
                    </button>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-neutral-400 hover:text-text-primary transition"
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">
                    Question Text <span className="text-neutral-500">*</span>
                  </label>
                  <textarea
                    value={q.questionText}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder="Enter the question clearly..."
                    rows={2}
                    className="input text-sm w-full resize-none font-medium"
                    required
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">
                      Options & Correct Answer <span className="text-neutral-500">*</span>
                    </label>
                    <span className="text-[11px] text-text-secondary">
                      Click radio circle to mark correct answer
                    </span>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctOptionIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                            isCorrect
                              ? 'bg-surface-100/80 dark:bg-surface-800/80 border-text-primary'
                              : 'bg-surface-50 dark:bg-surface-900 border-border-color'
                          }`}
                        >
                          {/* Radio Selector */}
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition flex-shrink-0 ${
                              isCorrect
                                ? 'bg-text-primary text-surface-50 border-text-primary shadow-sm'
                                : 'border-border-color hover:border-neutral-400 text-transparent'
                            }`}
                            title={isCorrect ? 'Correct Answer' : 'Click to set as correct answer'}
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>

                          {/* Letter Badge */}
                          <span className="font-mono text-xs font-bold text-text-primary w-5 flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>

                          {/* Input */}
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                            className="input text-xs w-full py-1.5"
                            required
                          />

                          {/* Correct badge */}
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-bold text-text-primary px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 flex-shrink-0">
                              Correct
                            </span>
                          )}

                          {/* Delete Option button */}
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromQuestion(qIdx, optIdx)}
                              className="p-1 rounded text-text-secondary hover:text-text-primary transition flex-shrink-0"
                              title="Delete this option"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Option button */}
                  {q.options.length < 8 && (
                    <button
                      type="button"
                      onClick={() => handleAddOptionToQuestion(qIdx)}
                      className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 font-medium pt-1"
                    >
                      <Plus size={12} /> Add Another Option ({String.fromCharCode(65 + q.options.length)})
                    </button>
                  )}
                </div>

                {/* Per-Question Custom Marks & Explanation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-color">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-secondary block">
                        Marks for Q{qIdx + 1}:
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={q.marks}
                        onChange={(e) => handleMarksChange(qIdx, e.target.value)}
                        className="input text-xs w-20 font-mono py-1"
                      />
                    </div>
                    {hasNegativeMarking && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-text-secondary block">
                          Negative Marks:
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="5"
                          value={q.negativeMarks}
                          onChange={(e) => handleNegativeMarksChange(qIdx, e.target.value)}
                          className="input text-xs w-20 font-mono py-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-text-secondary flex items-center gap-1">
                      <HelpCircle size={12} /> Solution Explanation (Optional):
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      placeholder="Why this answer is correct..."
                      className="input text-xs w-full py-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn btn-secondary btn-md w-full justify-center flex items-center gap-2 border-dashed"
            >
              <Plus size={16} />
              <span>Add Another Question</span>
            </button>
          </div>
        </div>

        {/* Bottom Publish Bar */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-border-color">
          <Link to="/mock-tests" className="btn btn-secondary btn-md">
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <Send size={16} />
            <span>{isSubmitting ? 'Publishing Mock Test...' : 'Publish Mock Test'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
