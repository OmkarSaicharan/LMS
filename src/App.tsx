import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import AdminPortal from './pages/AdminPortal';
import QuizPage from './pages/QuizPage';
import AssignmentPage from './pages/AssignmentPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/quizzes/:quizId" element={<QuizPage />} />
                    <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <AdminPortal />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
