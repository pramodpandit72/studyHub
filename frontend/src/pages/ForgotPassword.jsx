import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter Code, 3 = New Password, 4 = Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState(null);

  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(trimmedEmail);
      success('Password reset code sent to your email.');
      setStep(2);
      setCountdown(60);
      if (data.data?.devCode) {
        setDevCode(data.data.devCode);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Reset Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyResetCode(email.trim(), trimmedCode);
      success('Verification code confirmed.');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired reset code. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      success('Password updated successfully!');
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Navigation Bar: Back Button & Theme Toggle */}
        <div className="mb-4 flex items-center justify-between">
          {step === 1 || step === 4 ? (
            <Link
              to="/login"
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>← Back to Login</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setErrorMsg('');
                setStep((prev) => Math.max(1, prev - 1));
              }}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>← Back</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {/* Card */}
        <div className="card p-8 bg-surface-50 dark:bg-surface-800 shadow-md border border-border-color">
          {step !== 4 && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {step === 1 && 'Reset your password'}
                {step === 2 && 'Enter verification code'}
                {step === 3 && 'Create new password'}
              </h1>
              <p className="mt-1 text-xs text-text-secondary">
                {step === 1 && 'Enter your registered email and we will send you a reset code via EmailJS.'}
                {step === 2 && 'Enter the 6-digit code sent to your email address.'}
                {step === 3 && 'Choose a secure new password for your account.'}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 error-box">
              <span className="font-bold">[!]</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="label" htmlFor="reset-email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Mail size={16} />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter Verification Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-2.5 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-700/50 flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  Sent to: <strong className="text-text-primary">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    setErrorMsg('');
                  }}
                  className="font-semibold underline text-text-primary"
                >
                  Change
                </button>
              </div>

              {devCode && (
                <div className="p-2.5 rounded-lg border border-neutral-400 dark:border-neutral-600 bg-surface-200 dark:bg-surface-700 text-text-primary text-xs flex items-center justify-between">
                  <span>Dev Mode Code: <strong>{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    className="font-bold underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="label" htmlFor="reset-code">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <KeyRound size={16} />
                  </div>
                  <input
                    id="reset-code"
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="input-field pl-10 text-center tracking-widest font-mono text-lg font-bold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                {countdown > 0 ? (
                  <span className="text-text-secondary">
                    Resend code in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={loading}
                    className="font-medium hover:underline flex items-center gap-1 text-text-primary"
                  >
                    <RotateCw size={12} />
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="confirm-new-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mx-auto flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Password Updated!
                </h2>
                <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                  Your password has been successfully updated. You can now log in using your email and new password.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Return to Login</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom link */}
          {step !== 4 && (
            <div className="mt-6 pt-5 border-t border-border-color text-center text-xs text-text-secondary">
              Remembered your password?{' '}
              <Link to="/login" className="font-semibold underline text-text-primary">
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
