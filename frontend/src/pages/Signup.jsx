import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  User,
  Smartphone,
  Calendar,
  Briefcase,
  GraduationCap,
  Building,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';

const ROLES = [
  'Student',
  'Teacher',
  'Trainer',
  'Mentor',
  'Working Professional',
  'Other'
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
  'Other'
];

export const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState(null);

  // Form State (persisted across back and next steps)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    role: 'Student',
    studyOrPreparation: 'B.Tech',
    institution: '',
    experienceLevel: 'Beginner',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const { login } = useAuth();
  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

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
    if (!/^\d{10}$/.test(formData.mobile)) return 'Please enter a valid 10-digit mobile number.';
    const ageNum = parseInt(formData.age, 10);
    if (!ageNum || ageNum < 10 || ageNum > 120) return 'Please enter a valid age between 10 and 120.';
    return null;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.role) return 'Please select your role.';
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

  // Handle Next
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

      // Submit Registration to backend, then send OTP
      setLoading(true);
      try {
        await authApi.signup({
          name: formData.name,
          mobile: formData.mobile,
          age: parseInt(formData.age, 10),
          role: formData.role,
          studyOrPreparation: formData.studyOrPreparation,
          institution: formData.institution,
          experienceLevel: formData.experienceLevel,
          password: formData.password,
        });

        // Request signup OTP
        const { data: otpRes } = await authApi.sendOtp(formData.mobile, 'signup');
        if (otpRes.data?.devOtp) {
          setDevOtpCode(otpRes.data.devOtp);
        }

        success('Account created! Please verify your mobile number with OTP.');
        setCountdown(60);
        setCurrentStep(4);
      } catch (err) {
        const msg = err.response?.data?.message || 'Registration failed. Mobile number may already be in use.';
        setErrorMsg(msg);
        error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle Step 4 (Verify OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{4}$/.test(formData.otp)) {
      return setErrorMsg('Please enter the 4-digit OTP.');
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(formData.mobile, formData.otp, 'signup');
      success('Account Verified and Created Successfully!');
      login(data.data.token, data.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'The OTP is incorrect. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(formData.mobile, 'signup');
      success('A new OTP has been sent.');
      setCountdown(60);
      if (data.data?.devOtp) {
        setDevOtpCode(data.data.devOtp);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
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
                currentStep === 1 ? 'Basic Information' :
                currentStep === 2 ? 'Role & Education' :
                currentStep === 3 ? 'Set Password' :
                'Verify Mobile Number'
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

          {/* Step Forms */}
          {currentStep === 1 && (
            /* STEP 1: Basic Info */
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Full Name
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
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="mobile">
                  Mobile Number
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
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="input-field pl-16 font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  We'll verify this number with a 4-digit OTP.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="age">
                  Age
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
                    placeholder="e.g. 21"
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

          {currentStep === 2 && (
            /* STEP 2: Professional / Student Details */
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="role">
                  Your Primary Role
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
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="studyOrPreparation">
                  What are you studying or preparing for?
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

          {currentStep === 3 && (
            /* STEP 3: Password / Account Setup */
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="label" htmlFor="password">
                  Create Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
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
                  {loading ? <ButtonLoader /> : (
                    <>
                      <span>Next: Verify Mobile</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {currentStep === 4 && (
            /* STEP 4: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-2.5 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-700/50 flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  OTP sent to: <strong className="text-text-primary">+91 {formData.mobile}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setCurrentStep(1);
                  }}
                  className="font-semibold underline text-text-primary"
                >
                  Change Number
                </button>
              </div>

              {devOtpCode && (
                <div className="p-2.5 rounded-lg border border-neutral-400 dark:border-neutral-600 bg-surface-200 dark:bg-surface-700 text-text-primary text-xs flex items-center justify-between">
                  <span>Dev Mode OTP: <strong>{devOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, otp: devOtpCode }))}
                    className="font-bold underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="label" htmlFor="otp">
                  Enter 4-Digit Verification OTP
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
                    value={formData.otp}
                    onChange={handleChange}
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
                  disabled={loading || formData.otp.length !== 4}
                  className="btn btn-primary w-2/3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? <ButtonLoader /> : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Complete Sign Up</span>
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
