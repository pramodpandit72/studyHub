import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  User,
  Calendar,
  Briefcase,
  GraduationCap,
  Building,
  ShieldCheck,
  Save,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';

const ROLES = [
  'Student',
  'Teacher',
  'Trainer',
  'Mentor',
  'Working Professional',
  'Other'
];

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    role: user?.role || 'Student',
    studyOrPreparation: user?.studyOrPreparation || '',
    institution: user?.institution || '',
    experienceLevel: user?.experienceLevel || 'Beginner',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        role: user.role || 'Student',
        studyOrPreparation: user.studyOrPreparation || '',
        institution: user.institution || '',
        experienceLevel: user.experienceLevel || 'Beginner',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userApi.updateProfile({
        name: formData.name,
        age: parseInt(formData.age, 10),
        role: formData.role,
        studyOrPreparation: formData.studyOrPreparation,
        institution: formData.institution,
        experienceLevel: formData.experienceLevel,
      });
      updateUser(data.data.user);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={15} />
          <span>← Back to Dashboard</span>
        </button>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-border-color">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          User Profile
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Manage your personal details and academic credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Summary Card */}
        <div className="space-y-4">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-surface-200 dark:bg-surface-700 text-text-primary font-bold text-2xl flex items-center justify-center border border-border-color shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="mt-4 font-semibold text-base text-text-primary">
              {user?.name}
            </h2>
            <p className="text-xs text-text-secondary">{user?.role}</p>

            <div className="mt-4 pt-4 border-t border-border-color w-full text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Email:</span>
                <span className="text-text-primary font-medium truncate max-w-[150px]" title={user?.email}>
                  {user?.email || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Member Since:</span>
                <span className="text-text-primary font-medium">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Theme Preference Quick Switch */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-primary">Display Theme</p>
              <p className="text-[11px] text-text-secondary capitalize">{theme} Mode Active</p>
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary border-b border-border-color pb-3">
              Edit Details
            </h2>

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
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    min={10}
                    max={120}
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="role">
                  Role
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
            </div>

            <div>
              <label className="label" htmlFor="studyOrPreparation">
                Study / Exam Preparation Field
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <GraduationCap size={16} />
                </div>
                <input
                  id="studyOrPreparation"
                  name="studyOrPreparation"
                  type="text"
                  placeholder="e.g. B.Tech / GATE / Full Stack"
                  value={formData.studyOrPreparation}
                  onChange={handleChange}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="institution">
                  Institution / Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Building size={16} />
                  </div>
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={formData.institution}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="experienceLevel">
                  Experience Level
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
            </div>

            <div className="pt-4 border-t border-border-color flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                {loading ? <ButtonLoader /> : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
