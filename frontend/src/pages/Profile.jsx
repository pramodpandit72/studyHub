import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/auth.api';
import { ButtonLoader } from '../components/common/Loader';
import {
  User,
  Calendar,
  Briefcase,
  GraduationCap,
  Building,
  Save,
  ArrowLeft,
  Edit3,
  X,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react';

const ROLES = [
  'Student',
  'Teacher',
  'Trainer',
  'Mentor',
  'Working Professional',
  'Other'
];

const EXPERIENCE_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced'
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

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    role: user?.role || 'Student',
    mobile: user?.mobile || '',
    studyOrPreparation: user?.studyOrPreparation || '',
    institution: user?.institution || '',
    experienceLevel: user?.experienceLevel || 'Beginner',
  });

  // Sync form data whenever user context updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        role: user.role || 'Student',
        mobile: user.mobile || '',
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

  const handleCancel = () => {
    // Reset back to original user values and exit edit mode
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        role: user.role || 'Student',
        mobile: user.mobile || '',
        studyOrPreparation: user.studyOrPreparation || '',
        institution: user.institution || '',
        experienceLevel: user.experienceLevel || 'Beginner',
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      error('Full Name is required.');
      return;
    }

    const parsedAge = parseInt(formData.age, 10);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      error('Please enter a valid age between 10 and 120.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        age: parsedAge,
        role: formData.role,
        mobile: formData.mobile.trim(),
        studyOrPreparation: formData.studyOrPreparation.trim(),
        institution: formData.institution.trim(),
        experienceLevel: formData.experienceLevel,
      };

      const { data } = await userApi.updateProfile(payload);
      const updatedUser = data.data.user;

      // Immediately update auth context so changes reflect everywhere
      updateUser(updatedUser);
      setIsEditing(false);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile. Please try again.');
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
      {/* Top Navigation */}
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
      <div className="pb-4 border-b border-border-color flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            View and manage your account credentials and personal details.
          </p>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              Editing Mode
            </span>
          </div>
        )}
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
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-800 text-text-secondary">
              {user?.role}
            </span>

            <div className="mt-5 pt-4 border-t border-border-color w-full text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Mail size={13} className="text-text-tertiary" />
                  Email:
                </span>
                <span className="text-text-primary font-medium truncate max-w-[150px]" title={user?.email}>
                  {user?.email || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock size={13} className="text-text-tertiary" />
                  Joined:
                </span>
                <span className="text-text-primary font-medium">
                  {formatDate(user?.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-text-tertiary" />
                  Status:
                </span>
                <span className="text-text-primary font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information Display or Edit Form */}
        <div className="md:col-span-2">
          {!isEditing ? (
            /* READ-ONLY VIEW MODE */
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border-color pb-3">
                <h2 className="text-sm font-semibold text-text-primary">
                  Personal & Academic Information
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <User size={13} className="text-text-tertiary" />
                    Full Name
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.name || '—'}
                  </span>
                </div>

                {/* Email Address */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Mail size={13} className="text-text-tertiary" />
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-text-primary truncate block" title={user?.email}>
                    {user?.email || '—'}
                  </span>
                </div>

                {/* Age */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Calendar size={13} className="text-text-tertiary" />
                    Age
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.age ? `${user.age} years old` : '—'}
                  </span>
                </div>

                {/* Role */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Briefcase size={13} className="text-text-tertiary" />
                    Role
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.role || '—'}
                  </span>
                </div>

                {/* Mobile */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Phone size={13} className="text-text-tertiary" />
                    Mobile Number
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.mobile || 'Not provided'}
                  </span>
                </div>

                {/* Experience Level */}
                <div className="p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Award size={13} className="text-text-tertiary" />
                    Experience Level
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.experienceLevel || 'Beginner'}
                  </span>
                </div>

                {/* Study / Exam Preparation */}
                <div className="sm:col-span-2 p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <GraduationCap size={13} className="text-text-tertiary" />
                    Study / Exam Preparation Field
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.studyOrPreparation || 'Not provided'}
                  </span>
                </div>

                {/* Institution / Organization */}
                <div className="sm:col-span-2 p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/40 border border-border-color">
                  <span className="text-text-secondary block font-medium flex items-center gap-1 mb-1">
                    <Building size={13} className="text-text-tertiary" />
                    Institution / Organization
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.institution || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT PROFILE FORM MODE */
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div className="border-b border-border-color pb-3">
                <h2 className="text-sm font-semibold text-text-primary">
                  Edit Profile Details
                </h2>
              </div>

              {/* Full Name */}
              <div>
                <label className="label" htmlFor="name">
                  Full Name <span className="text-neutral-900 dark:text-white">*</span>
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
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              {/* Age and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="age">
                    Age <span className="text-neutral-900 dark:text-white">*</span>
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
                      required
                      value={formData.age}
                      onChange={handleChange}
                      className="input-field pl-10 text-sm"
                      placeholder="e.g. 24"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="role">
                    Role <span className="text-neutral-900 dark:text-white">*</span>
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

              {/* Mobile Number and Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="mobile">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                      <Phone size={16} />
                    </div>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="input-field pl-10 text-sm"
                      placeholder="Optional phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="experienceLevel">
                    Experience Level
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                      <Award size={16} />
                    </div>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="input-field pl-10 text-sm"
                    >
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Study or Exam Preparation */}
              <div>
                <label className="label" htmlFor="studyOrPreparation">
                  Study / Exam Preparation Field
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
                    {!PREPARATION_OPTIONS.includes(formData.studyOrPreparation) && formData.studyOrPreparation && (
                      <option value={formData.studyOrPreparation}>{formData.studyOrPreparation}</option>
                    )}
                    {PREPARATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Institution / Organization */}
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
                    placeholder="e.g. University / Company name"
                    value={formData.institution}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons: Save Changes and Cancel */}
              <div className="pt-4 border-t border-border-color flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-md flex items-center gap-2"
                >
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
