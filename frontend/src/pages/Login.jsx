import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import { Smartphone, KeyRound, ArrowRight, RotateCw, CheckCircle2, ArrowLeft, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Mobile, 2 = Enter OTP
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!/^\d{10}$/.test(mobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(mobile, 'login');
      success('OTP sent successfully to your mobile number.');
      setStep(2);
      setCountdown(60);
      if (data.data?.devOtp) {
        setDevOtpCode(data.data.devOtp);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check your mobile number.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{4}$/.test(otp)) {
      setErrorMsg('Please enter the 4-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.login(mobile, otp);
      login(data.data.token, data.data.user);
      success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'The OTP is incorrect. Please try again.';
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
          {step === 2 ? (
            <button
              onClick={() => {
                setStep(1);
                setOtp('');
                setErrorMsg('');
              }}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>← Back</span>
            </button>
          ) : (
            <Link
              to="/"
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>← Back to Home</span>
            </Link>
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Log In to viMeet
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              Login easily using your 10-digit mobile number and 4-digit OTP
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 error-box">
              <span className="font-bold">[!]</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Enter Mobile Number */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="input-field pl-16 font-mono text-sm"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  Enter your registered 10-digit mobile number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <ButtonLoader /> : (
                  <>
                    <span>Send 4-Digit OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter 4-Digit OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-2.5 rounded-lg border border-border-color bg-surface-100 dark:bg-surface-700/50 flex items-center justify-between text-xs mb-2">
                <span className="text-text-secondary">
                  Sent to: <strong className="text-text-primary">+91 {mobile}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setErrorMsg('');
                  }}
                  className="font-semibold underline text-text-primary"
                >
                  Change
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
                  Enter 4-Digit OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <KeyRound size={16} />
                  </div>
                  <input
                    id="otp"
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
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="font-medium hover:underline flex items-center gap-1 text-text-primary"
                  >
                    <RotateCw size={12} />
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 4}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <ButtonLoader /> : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </form>
          )}

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
