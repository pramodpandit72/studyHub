import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
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
  Check,
} from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter Code, 3 = New Password, 4 = Success
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const digitInputRefs = useRef([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0); // Resend timer
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 min expiry
  const [devCode, setDevCode] = useState(null);

  const { success, error } = useToast();
  const navigate = useNavigate();

  // Resend Countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Expiry Countdown for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && expirySeconds > 0) {
      timer = setTimeout(() => setExpirySeconds(expirySeconds - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, expirySeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [user, domain] = str.split('@');
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user.substring(0, 2)}***${user.slice(-1)}@${domain}`;
  };

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
      setExpirySeconds(300);
      setOtpDigits(['', '', '', '', '', '']);
      if (data.data?.devCode) {
        setDevCode(data.data.devCode);
      }
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP Digits Handling
  const handleDigitChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (numericValue.length > 0) {
      newDigits[index] = numericValue[numericValue.length - 1];
      setOtpDigits(newDigits);
      if (index < 5) {
        digitInputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = '';
      setOtpDigits(newDigits);
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        digitInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasteData.length, 5);
    digitInputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify Reset Code
  const handleVerifyCode = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyResetCode(email.trim(), fullCode);
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

    const fullCode = otpDigits.join('');
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), fullCode, newPassword);
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
      <SEO
        title="Reset Password — StudyHub"
        description="Recover your StudyHub account password with secure verification."
        canonical="https://studyhub.online/forgot-password"
      />
      <div className="w-full max-w-md">
        {/* Navigation Bar: Back Button */}
        <div className="mb-4">
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
        </div>

        {/* Card */}
        <div className="card p-8 bg-surface-50 dark:bg-surface-800 shadow-md border border-border-color">
          {/* Header & Steps */}
          {step < 4 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                  {step === 1 && 'Reset your password'}
                  {step === 2 && 'Verify Reset Code'}
                  {step === 3 && 'Create New Password'}
                </h1>
                <p className="mt-1 text-xs text-text-secondary">
                  {step === 1 && 'Enter your registered email to receive a 6-digit recovery code.'}
                  {step === 2 && 'Enter the 6-digit code sent to your email address.'}
                  {step === 3 && 'Choose a strong and secure new password for your account.'}
                </p>
              </div>

              {/* Step Progress Indicator */}
              <div className="flex items-center justify-between mb-8 max-w-xs mx-auto">
                {[1, 2, 3].map((stepNumber, index) => (
                  <div key={stepNumber} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (stepNumber < step) {
                          setErrorMsg('');
                          setStep(stepNumber);
                        }
                      }}
                      disabled={stepNumber > step}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                        step === stepNumber
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                          : step > stepNumber
                          ? 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-neutral-900 border-neutral-700 dark:border-neutral-300 cursor-pointer'
                          : 'bg-surface-200 dark:bg-surface-700 text-text-tertiary border-transparent'
                      }`}
                      title={`Step ${stepNumber}`}
                    >
                      {step > stepNumber ? '✓' : stepNumber}
                    </button>
                    {index < 2 && (
                      <div
                        className={`h-0.5 w-12 sm:w-16 mx-1 transition ${
                          step > stepNumber
                            ? 'bg-neutral-700 dark:bg-neutral-300'
                            : 'bg-surface-200 dark:bg-surface-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
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
                    placeholder="Enter email"
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

          {/* STEP 2: Enter 6-Digit Code (Standardized 6-box input) */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Email Pill Badge */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-color bg-surface-100 dark:bg-surface-800/80 text-text-primary text-xs font-medium shadow-2xs">
                  <Mail size={13} className="text-text-secondary" />
                  <span className="font-mono">{maskEmail(email)}</span>
                </div>
              </div>

              {/* Expiry Countdown */}
              <p className="text-xs text-text-secondary text-center font-medium">
                Code expires in:{' '}
                <span className="font-mono font-bold text-text-primary">
                  {formatTimer(expirySeconds)}
                </span>
              </p>

              {/* Dev Mode Code Auto-Fill */}
              {devCode && (
                <div className="p-2.5 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-800 text-text-primary text-xs flex items-center justify-between">
                  <span>Dev Mode Code: <strong className="font-mono">{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = devCode.split('').slice(0, 6);
                      setOtpDigits(chars);
                    }}
                    className="font-bold underline hover:opacity-80"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* 6 Individual Digit Inputs */}
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div
                  className="flex justify-center items-center gap-2 sm:gap-3"
                  onPaste={handleDigitPaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (digitInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-lg border border-border-color bg-surface-100 dark:bg-surface-700/60 text-text-primary focus:border-neutral-900 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition shadow-2xs"
                      required
                    />
                  ))}
                </div>

                {/* Resend Action */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpDigits(['', '', '', '', '', '']);
                      setErrorMsg('');
                    }}
                    className="font-medium underline text-text-secondary hover:text-text-primary"
                  >
                    Change Email
                  </button>

                  {countdown > 0 ? (
                    <span className="text-text-secondary">
                      Resend in <strong>{countdown}s</strong>
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
                  disabled={loading || otpDigits.join('').length !== 6}
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
            </div>
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
