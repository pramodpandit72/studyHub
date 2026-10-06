import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  User,
  Mail,
  Smartphone,
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
  Sun,
  Moon,
} from 'lucide-react';

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
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    role: 'Student',
    studyOrPreparation: 'B.Tech',
    institution: '',
    experienceLevel: 'Beginner',
    password: '',
    confirmPassword: '',
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'mobile' ? value.replace(/\D/g, '') : value,
    }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Please enter your full name.';
    if (!formData.email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!/^\d{10}$/.test(formData.mobile)) {
      return 'Please enter a valid 10-digit mobile number.';
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
          mobile: formData.mobile.trim(),
          age: parseInt(formData.age, 10),
          role: formData.role,
          studyOrPreparation: formData.studyOrPreparation,
          institution: formData.institution.trim(),
          experienceLevel: formData.experienceLevel,
          password: formData.password,
        });

        success('A 4-digit verification OTP has been sent to your email.');
        if (data.data?.devOtp) {
          setDevOtpCode(data.data.devOtp);
        }
        setCountdown(60);
        setCurrentStep(4);
      } catch (err) {
        const msg = err.response?.data?.message || 'Registration failed. Email or mobile may already be registered.';
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

    const trimmedOtp = otp.trim();
    if (!/^\d{4}$/.test(trimmedOtp)) {
      return setErrorMsg('Please enter the 4-digit verification OTP.');
    }

    setLoading(true);
    try {
      await authApi.verifySignupOtp(formData.email.trim().toLowerCase(), trimmedOtp);
      success('Account created and verified successfully! You can now log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please check your email and try again.';
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
      success('A new verification OTP has been sent to your email.');
      setCountdown(60);
      if (data.data?.devOtp) {
        setDevOtpCode(data.data.devOtp);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification OTP.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* Step Navigation Bar: Back Button & Theme Toggle */}
        <div className="mb-4 flex items-center justify-between">
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

        <div className="card p-8 bg-surface-50 dark:bg-surface-800 shadow-md border border-border-color">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Create your account
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              Step {currentStep} of 4 — {
                currentStep === 1 ? 'Personal Details' :
                currentStep === 2 ? 'Role & Education' :
                currentStep === 3 ? 'Set Password' :
                'Verify Email with OTP'
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
                <label className="label" htmlFor="mobile">
                  Mobile Number <span className="text-text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <span className="text-xs font-semibold mr-1">+91</span>
                    <Smartphone size={16} />
                  </div>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter mobile no."
                    value={formData.mobile}
                    onChange={handleChange}
                    className="input-field pl-16 font-mono text-sm"
                  />
                </div>
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

          {/* STEP 4: Email 4-Digit OTP Verification */}
          {currentStep === 4 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-2.5 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-700/50 flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  OTP sent to: <strong className="text-text-primary">{formData.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(1);
                  }}
                  className="font-semibold underline text-text-primary"
                >
                  Change Email
                </button>
              </div>

              {devOtpCode && (
                <div className="p-2.5 rounded-lg border border-neutral-400 dark:border-neutral-600 bg-surface-200 dark:bg-surface-700 text-text-primary text-xs flex items-center justify-between">
                  <span>Dev Mode OTP: <strong>{devOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtpCode)}
                    className="font-bold underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="label" htmlFor="otp">
                  Enter 4-Digit Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <KeyRound size={16} />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={4}
                    placeholder="••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field pl-10 text-center tracking-widest font-mono text-lg font-bold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                {countdown > 0 ? (
                  <span className="text-text-secondary">
                    Resend OTP in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-medium hover:underline flex items-center gap-1 text-text-primary"
                  >
                    <RotateCw size={12} />
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(3);
                  }}
                  className="btn btn-secondary w-1/3 py-2.5 text-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>← Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.trim().length !== 4}
                  className="btn btn-primary w-2/3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify & Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-border-color text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold underline text-text-primary">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
