import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { PageLoader } from './components/common/Loader';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then((m) => ({ default: m.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Meetings = lazy(() => import('./pages/Meetings').then((m) => ({ default: m.Meetings })));
const CreateMeeting = lazy(() => import('./pages/CreateMeeting').then((m) => ({ default: m.CreateMeeting })));
const JoinMeeting = lazy(() => import('./pages/JoinMeeting').then((m) => ({ default: m.JoinMeeting })));
const MeetingRoom = lazy(() => import('./pages/MeetingRoom').then((m) => ({ default: m.MeetingRoom })));
const Attendance = lazy(() => import('./pages/Attendance').then((m) => ({ default: m.Attendance })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Feedback = lazy(() => import('./pages/Feedback').then((m) => ({ default: m.Feedback })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Full Bleed Meeting Room (No standard layout navbar/footer) */}
                <Route
                  path="/meetings/:id/room"
                  element={
                    <ProtectedRoute>
                      <MeetingRoom />
                    </ProtectedRoute>
                  }
                />

                {/* Standard App Layout */}
                <Route element={<AppLayout />}>
                  {/* Public Pages */}
                  <Route path="/" element={<Landing />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <PublicRoute>
                        <Signup />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/join/:code"
                    element={
                      <ProtectedRoute>
                        <JoinMeeting />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Pages */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meetings"
                    element={
                      <ProtectedRoute>
                        <Meetings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meetings/create"
                    element={
                      <ProtectedRoute>
                        <CreateMeeting />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <Attendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/feedback" element={<Feedback />} />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
