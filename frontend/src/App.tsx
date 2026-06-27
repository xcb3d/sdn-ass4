import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuizPage } from './pages/QuizPage';
import { AdminQuestionsPage } from './pages/AdminQuestionsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { EditQuizPage } from './pages/EditQuizPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export const App: React.FC = () => {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar />
        <main className="flex-grow-1 container my-4">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/questions"
              element={
                <AdminRoute>
                  <AdminQuestionsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/quiz/:quizId/edit"
              element={
                <AdminRoute>
                  <EditQuizPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/quiz/:quizId/questions"
              element={
                <AdminRoute>
                  <EditQuizPage />
                </AdminRoute>
              }
            />

            {/* Redirection fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <footer className="bg-dark text-muted text-center py-3 border-top border-secondary mt-auto">
          <div className="container">
            <p className="mb-0 small">&copy; {new Date().getFullYear()} Quizify App. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
