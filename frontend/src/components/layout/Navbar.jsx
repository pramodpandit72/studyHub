import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Video,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  PlusCircle,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meetings', path: '/meetings', icon: Video },
    { name: 'Create Meeting', path: '/meetings/create', icon: PlusCircle },
    { name: 'Attendance', path: '/attendance', icon: ClipboardList },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-surface-50/95 dark:bg-surface-900/95 backdrop-blur-md border-b border-border-color">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold shadow-xs">
                <Video size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">
                viMeet
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                          isActive
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800'
                        }`
                      }
                    >
                      <Icon size={15} />
                      {link.name}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 border border-border-color transition"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Guest Feedback link */}
            {!isAuthenticated && (
              <Link
                to="/feedback"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-md border border-border-color hover:bg-surface-100 dark:hover:bg-surface-800 transition"
              >
                <MessageSquare size={14} />
                <span>Feedback</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  to="/meetings/create"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <PlusCircle size={15} />
                  <span>Create Meeting</span>
                </Link>

                <div className="h-5 w-px bg-border-color mx-1" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-xs font-semibold text-text-primary border border-border-color">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-semibold leading-none text-text-primary">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {user?.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-text-primary"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 border border-border-color transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border-color bg-surface-50 dark:bg-surface-900 px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-border-color mb-3">
                <div className="w-9 h-9 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center font-bold text-sm text-text-primary border border-border-color">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-secondary">{user?.role} • {user?.email}</p>
                </div>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {link.name}
                  </NavLink>
                );
              })}

              {/* Mobile Drawer Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition border border-border-color my-1"
                aria-label="Toggle theme"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>Display Theme</span>
                </div>
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary">
                  {theme} Mode
                </span>
              </button>

              <div className="pt-3 border-t border-border-color flex flex-col gap-2">
                <Link
                  to="/meetings/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary btn-sm w-full justify-center"
                >
                  <PlusCircle size={16} />
                  <span>Create Meeting</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn btn-secondary btn-sm w-full justify-center"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition border border-border-color mb-1"
                aria-label="Toggle theme"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>Display Theme</span>
                </div>
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-text-primary">
                  {theme} Mode
                </span>
              </button>
              <Link
                to="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary w-full justify-center"
              >
                <MessageSquare size={16} />
                <span>Feedback</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary w-full justify-center"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full justify-center"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
