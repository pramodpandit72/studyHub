import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { submitFeedback, getMyFeedback } from '../services/feedback.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RATINGS = ['Very Good', 'Good', 'Okay', 'Poor', 'Very Poor'];
const CATEGORIES = ['Website', 'Meeting', 'Login/Signup', 'Video/Audio', 'Other'];

export const Feedback = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [rating, setRating] = useState('Very Good');
  const [category, setCategory] = useState('Website');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pastFeedbacks, setPastFeedbacks] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Load user's previous feedback if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadPast = async () => {
        setLoadingPast(true);
        try {
          const res = await getMyFeedback();
          if (res.data) setPastFeedbacks(res.data);
        } catch {
          // non-blocking
        } finally {
          setLoadingPast(false);
        }
      };
      loadPast();
    }
  }, [isAuthenticated, submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErrorMessage('Please select how your experience was.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await submitFeedback({
        rating,
        category,
        message: message.trim(),
        page: window.location.pathname
      });

      setSubmitted(true);
      success('Thank you for your feedback.');
      setMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || "We couldn't submit your feedback. Please try again.";
      setErrorMessage(msg);
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setRating('Very Good');
    setCategory('Website');
    setMessage('');
    setErrorMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Bar: Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm flex items-center gap-2"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span>← Back</span>
        </button>
      </div>

      <div className="card shadow-sm border border-border-color">
        {/* Header */}
        <div className="pb-6 border-b border-border-color mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Give us Feedback
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Tell us what you liked or how we can make viMeet simpler for you.
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          /* Confirmation Screen */
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mx-auto flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Thank you for your feedback.
              </h2>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                We read every response to improve the meetings and make the platform easier for all users.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="btn btn-secondary btn-sm"
              >
                Send Another Response
              </button>
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                className="btn btn-primary btn-sm"
              >
                Go to Home
              </button>
            </div>
          </div>
        ) : (
          /* Simple Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="error-box">
                <span className="font-bold">[!]</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Rating Question */}
            <div>
              <label className="label text-sm font-semibold mb-2">
                How was your experience? <span className="text-neutral-900 dark:text-neutral-100">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {RATINGS.map((r) => {
                  const isSelected = rating === r;
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRating(r)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-center transition flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'border-border-color bg-surface-50 dark:bg-surface-800 text-text-primary hover:border-neutral-400'
                      }`}
                    >
                      <span>{isSelected ? '✓ ' + r : r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Question */}
            <div>
              <label className="label text-sm font-semibold mb-2">
                What is your feedback about? <span className="text-text-tertiary text-xs font-normal">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const isSelected = category === c;
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                          : 'border-border-color bg-surface-50 dark:bg-surface-800 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {isSelected ? '✓ ' + c : c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="feedback-message" className="label text-sm font-semibold mb-1">
                What can we improve?
              </label>
              <textarea
                id="feedback-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your feedback in simple words here..."
                className="input-field text-sm resize-none"
                maxLength={1000}
              />
              <p className="text-[11px] text-text-tertiary mt-1 text-right">
                {message.length} / 1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between border-t border-border-color">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Past Feedback History (for Authenticated Users) */}
      {isAuthenticated && pastFeedbacks.length > 0 && (
        <div className="mt-8 card border border-border-color">
          <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
            <Clock size={15} />
            <span>Your Previous Feedback</span>
          </h2>
          <div className="space-y-2.5">
            {pastFeedbacks.map((fb) => (
              <div
                key={fb._id}
                className="p-3 rounded-lg border border-border-color bg-surface-50 dark:bg-surface-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {fb.rating}
                    </span>
                    <span className="badge badge-scheduled text-[10px]">
                      {fb.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {fb.message ? (
                  <p className="text-text-secondary mt-1">{fb.message}</p>
                ) : (
                  <p className="text-text-tertiary italic text-[11px]">No written note provided.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
