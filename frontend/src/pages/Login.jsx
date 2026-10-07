import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isSubmittingRef = useRef(false);

  const { login, isAuthenticated, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate rapid click race conditions
    if (isSubmittingRef.current || loading) {
      return;
    }

    setErrorMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const { data } = await authApi.login(trimmedEmail.toLowerCase(), password);

      if (data?.data?.token && data?.data?.user) {
        login(data.data.token, data.data.user);
        success('Logged in successfully!');
        navigate(from, { replace: true });
      } else {
        throw new Error('Malformed login response from server.');
      }
    } catch (err) {
      let msg = 'Invalid email or password. Please try again.';

      if (!err.response) {
        msg = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err.response.status === 401) {
        msg = err.response.data?.message || 'Invalid email or password.';
      } else if (err.response.status === 429) {
        msg = 'Too many login attempts. Please wait a moment and try again.';
      } else if (err.response.data?.message) {
        msg = err.response.data.message;
      }

      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Log In — StudyHub"
        description="Log in to StudyHub to access live video meetings, virtual study rooms, scheduled classes, and automated attendance records."
        canonical="https://studyhub.online/login"
      />
      <div className="w-full max-w-md">
        {/* Navigation Bar: Back Button */}
        <div className="mb-4">
          <Link
            to="/"
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={15} />
            <span>← Back to Home</span>
          </Link>
        </div>

        {/* Card */}
        <div className="card p-8 bg-surface-50 dark:bg-surface-800 shadow-md border border-border-color">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Log In to StudyHub
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              Enter your email and password to access your account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 error-box" role="alert">
              <span className="font-bold">[!]</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm"
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold underline text-text-secondary hover:text-text-primary transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ButtonLoader />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 pt-5 border-t border-border-color text-center text-xs text-text-secondary">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold underline text-text-primary">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
