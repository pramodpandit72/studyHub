import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  Building,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { SEO } from '../components/common/SEO';

const ROLES = [
  'Student',
  'Teacher',
  'Trainer',
  'Mentor',
  'Working Professional',
  'Other',
];

const PREPARATION_OPTIONS = [
  'B.Tech',
  'MCA',
  'UPSC',
  'SSC',
  'Banking',
  'GATE',
  'Placement Preparation',
  'Programming',
  'Other',
];

export const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1 = Personal, 2 = Role, 3 = Password, 4 = Email OTP
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const digitInputRefs = useRef([]);
  const [countdown, setCountdown] = useState(0); // Resend timer (e.g. 40s)
  const [expirySeconds, setExpirySeconds] = useState(300); // Code expiry (e.g. 05:00)
  const [devOtpCode, setDevOtpCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    role: 'Student',
    studyOrPreparation: 'B.Tech',
    institution: '',
    experienceLevel: 'Beginner',
    password: '',
    confirmPassword: '',
  });

  const { success, error } = useToast();
  const navigate = useNavigate();

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Expiry countdown timer (MM:SS) for Step 4
  useEffect(() => {
    let timer;
    if (currentStep === 4 && expirySeconds > 0) {
      timer = setInterval(() => {
        setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, expirySeconds]);

  // Mask email as user requested (e.g. we*****@gmail.com)
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length < 2) return emailStr;
    const namePart = parts[0];
    const domain = parts[1];
    if (namePart.length <= 2) {
      return `${namePart}*****@${domain}`;
    }
    return `${namePart.slice(0, 2)}*****@${domain}`;
  };

  // Format seconds as MM:SS (e.g. 04:55)
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    const updated = [...otpDigits];

    if (!clean) {
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    if (clean.length === 1) {
      updated[index] = clean;
      setOtpDigits(updated);
      if (index < 5) {
        digitInputRefs.current[index + 1]?.focus();
      }
    } else {
      // Pasted or typed multiple digits
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          updated[index + idx] = c;
        }
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(5, index + chars.length);
      digitInputRefs.current[nextIdx]?.focus();
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, idx) => {
      if (idx < 6) updated[idx] = char;
    });
    setOtpDigits(updated);
    const targetIdx = Math.min(5, pasted.length);
    digitInputRefs.current[targetIdx]?.focus();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Please enter your full name.';
    if (!formData.email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    const ageNum = parseInt(formData.age, 10);
    if (!ageNum || ageNum < 10 || ageNum > 120) {
      return 'Please enter a valid age between 10 and 120.';
    }
    return null;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.role) return 'Please select your role.';
    if (!formData.studyOrPreparation) return 'Please select what you are studying or preparing for.';
    return null;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.password || formData.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  // Handle advancing through steps
  const handleNext = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentStep === 1) {
      const err = validateStep1();
      if (err) return setErrorMsg(err);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) return setErrorMsg(err);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const err = validateStep3();
      if (err) return setErrorMsg(err);

      // Submit details to backend to initiate email OTP verification
      setLoading(true);
      try {
        const { data } = await authApi.signup({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          age: parseInt(formData.age, 10),
          role: formData.role,
          studyOrPreparation: formData.studyOrPreparation,
          institution: formData.institution.trim(),
          experienceLevel: formData.experienceLevel,
          password: formData.password,
        });

        success('A 6-digit verification code has been sent to your email.');
        if (data.data?.devOtp) {
          setDevOtpCode(data.data.devOtp);
        }
        setCountdown(40);
        setExpirySeconds(300);
        setOtpDigits(['', '', '', '', '', '']);
        setCurrentStep(4);
      } catch (err) {
        let msg = 'Registration failed. Please try again.';
        if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.message === 'Network Error' || !err.response) {
          msg = 'Unable to connect to backend server. Please verify your connection or backend URL.';
        } else if (err.response?.status === 404) {
          msg = 'Backend endpoint not found (404). Please verify your VITE_API_URL.';
        } else if (err.response?.status >= 500) {
          msg = 'Server error occurred while processing registration. Please try again.';
        }
        setErrorMsg(msg);
        error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle Step 4: Verify Email OTP & Finalize Account Creation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      return setErrorMsg('Please enter the full 6-digit verification code.');
    }

    setLoading(true);
    try {
      await authApi.verifySignupOtp(formData.email.trim().toLowerCase(), fullCode);
      success('Account created and verified successfully! You can now log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      let msg = 'Invalid or expired code. Please check your email and try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error' || !err.response) {
        msg = 'Unable to connect to backend server. Please check your internet connection.';
      }
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend Email OTP
  const handleResendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { data } = await authApi.resendSignupOtp(formData.email.trim().toLowerCase());
      success('A new verification code has been sent to your email.');
      setCountdown(40);
      setExpirySeconds(300);
      setOtpDigits(['', '', '', '', '', '']);
      if (data.data?.devOtp) {
        setDevOtpCode(data.data.devOtp);
      }
    } catch (err) {
      let msg = 'Failed to resend verification code.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error' || !err.response) {
        msg = 'Unable to connect to backend server. Please check your internet connection.';
      }
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Create Your Account — StudyHub"
        description="Join StudyHub for free. Create your account with secure email verification to schedule classes, attend live study sessions, and access automated attendance."
        canonical="https://studyhub.online/signup"
      />
      <div className="w-full max-w-lg">
        {/* Step Navigation Bar: Back Button */}
        {currentStep < 4 && (
          <div className="mb-4">
            {currentStep === 1 ? (
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
                  setCurrentStep((prev) => Math.max(1, prev - 1));
                }}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>← Back to Step {currentStep - 1}</span>
              </button>
            )}
          </div>
        )}

        <div className="card p-8 bg-surface-50 dark:bg-surface-800 shadow-md border border-border-color">
          {/* Header for Steps 1-3 */}
          {currentStep < 4 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                  Create Your StudyHub Account
                </h1>
                <p className="mt-1 text-xs text-text-secondary">
                  Step {currentStep} of 4 — {
                    currentStep === 1 ? 'Personal Details' :
                    currentStep === 2 ? 'Role & Education' :
                    'Set Password'
                  }
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-8 max-w-xs mx-auto">
                {[1, 2, 3, 4].map((stepNumber, index) => (
                  <div key={stepNumber} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (stepNumber < currentStep) {
                          setErrorMsg('');
                          setCurrentStep(stepNumber);
                        }
                      }}
                      disabled={stepNumber > currentStep}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                        currentStep === stepNumber
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                          : currentStep > stepNumber
                          ? 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-neutral-900 border-neutral-700 dark:border-neutral-300 cursor-pointer'
                          : 'bg-surface-200 dark:bg-surface-700 text-text-tertiary border-transparent'
                      }`}
                      title={`Go to step ${stepNumber}`}
                    >
                      {currentStep > stepNumber ? '✓' : stepNumber}
                    </button>
                    {index < 3 && (
                      <div
                        className={`h-0.5 w-10 sm:w-14 mx-1 transition ${
                          currentStep > stepNumber
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

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-4 error-box">
              <span className="font-bold">[!]</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Full Name <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <User size={16} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Enter Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email Address <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  A 4-digit verification OTP will be sent to this email via EmailJS.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="age">
                  Age <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Calendar size={16} />
                  </div>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    min={10}
                    max={120}
                    placeholder="Enter Age"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Role & Learning Profile */}
          {currentStep === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="role">
                  Your Primary Role <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Briefcase size={16} />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                    required
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="studyOrPreparation">
                  What are you studying or preparing for? <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <GraduationCap size={16} />
                  </div>
                  <select
                    id="studyOrPreparation"
                    name="studyOrPreparation"
                    value={formData.studyOrPreparation}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                    required
                  >
                    {PREPARATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="institution">
                  Institution / Organization <span className="text-text-tertiary font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Building size={16} />
                  </div>
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    placeholder="e.g. National Institute of Tech"
                    value={formData.institution}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="experienceLevel">
                  Experience Level <span className="text-text-tertiary font-normal">(Optional)</span>
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="input-field text-sm"
                >
                  <option value="Beginner">Beginner (0-1 yrs)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Advanced">Advanced (3+ yrs)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(1);
                  }}
                  className="btn btn-secondary w-1/3 py-2.5 text-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>← Back</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-2/3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Password & Account Setup */}
          {currentStep === 3 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="password">
                  Create Password <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
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
                <label className="label" htmlFor="confirmPassword">
                  Confirm Password <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(2);
                  }}
                  className="btn btn-secondary w-1/3 py-2.5 text-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>← Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-2/3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <span>Continue: Verify Email</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Email 6-Digit Code Verification (Matching Screenshot, Neutral Aesthetic) */}
          {currentStep === 4 && (
            <div className="pt-2">
              {/* Floating Top Checkmark Badge */}
              <div className="w-14 h-14 rounded-full border border-border-color bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center shadow-xs mx-auto -mt-3 mb-4">
                <Check size={26} strokeWidth={2.5} className="text-text-primary" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-bold tracking-tight text-text-primary text-center">
                Verify Your Email
              </h2>
              <p className="mt-1 text-xs text-text-secondary text-center">
                Enter the 6-digit verification code sent to
              </p>

              {/* Email Pill Badge */}
              <div className="flex items-center justify-center mt-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-color bg-surface-100 dark:bg-surface-800/80 text-text-primary text-xs font-medium shadow-2xs">
                  <Mail size={13} className="text-text-secondary" />
                  <span className="font-mono">{maskEmail(formData.email)}</span>
                </div>
              </div>

              {/* Expiry Countdown */}
              <p className="text-xs text-text-secondary text-center mb-6 font-medium">
                Code expires in:{' '}
                <span className="font-mono font-bold text-text-primary">
                  {formatTimer(expirySeconds)}
                </span>
              </p>

              {/* Dev Mode OTP auto-fill bar if present */}
              {devOtpCode && (
                <div className="mb-5 p-2 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-800 text-text-primary text-xs flex items-center justify-between">
                  <span>Dev Mode Code: <strong className="font-mono">{devOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = devOtpCode.split('').slice(0, 6);
                      setOtpDigits(chars);
                    }}
                    className="font-bold underline hover:opacity-80"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* Form with 6 Individual Digit Inputs */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-2xl font-bold rounded-2xl border border-border-color bg-surface-100 dark:bg-surface-900 text-text-primary focus:border-text-primary focus:ring-1 focus:ring-text-primary focus:outline-none transition-all shadow-xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {/* Verify Email Button */}
                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="btn btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all shadow-xs"
                >
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Resend Section */}
              <div className="text-center mt-6 space-y-1">
                <p className="text-xs text-text-secondary">
                  Didn't receive the verification code?
                </p>
                {countdown > 0 ? (
                  <p className="text-xs text-text-tertiary flex items-center justify-center gap-1.5 font-medium pt-1">
                    <RotateCw size={13} className="text-text-tertiary" />
                    <span>
                      Resend code in <strong className="text-text-primary font-mono">{countdown}s</strong>
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs font-semibold text-text-primary hover:underline inline-flex items-center gap-1.5 pt-1"
                  >
                    <RotateCw size={13} />
                    <span>Resend code</span>
                  </button>
                )}
              </div>

              {/* Subtle Divider */}
              <hr className="border-border-color my-6" />

              {/* Want to use a different email */}
              <p className="text-xs text-text-secondary text-center">
                Want to use a different email?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(1);
                  }}
                  className="font-semibold text-text-primary underline hover:opacity-80"
                >
                  Sign up again
                </button>
              </p>
            </div>
          )}

          {/* Footer Navigation for Steps 1-3 */}
          {currentStep < 4 && (
            <div className="mt-6 pt-5 border-t border-border-color text-center text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold underline text-text-primary">
                Log in here
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
