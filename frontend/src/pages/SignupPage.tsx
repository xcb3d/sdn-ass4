import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { signupUser, clearMessages } from '../features/auth/authSlice';

export const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [validationError, setValidationError] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error, successMessage, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setValidationError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    dispatch(signupUser({ username, password, admin: isAdmin }));
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4 border-0 rounded-4" style={{ width: '100%', maxWidth: '450px', backgroundColor: '#ffffff' }}>
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h2 className="fw-bold mt-2 text-dark">Create Account</h2>
          <p className="text-muted">Register to join Quizify</p>
        </div>

        {validationError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{validationError}</div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert">
            <i className="bi bi-check-circle-fill"></i>
            <div>
              {successMessage}. <Link to="/login" className="alert-link">Login Now</Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-muted small" htmlFor="username">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person text-secondary"></i>
              </span>
              <input
                type="text"
                id="username"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-muted small" htmlFor="password">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-key text-secondary"></i>
              </span>
              <input
                type="password"
                id="password"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-muted small" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-key-fill text-secondary"></i>
              </span>
              <input
                type="password"
                id="confirmPassword"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4 form-check form-switch p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
            <div>
              <label className="form-check-label fw-semibold text-dark mb-0 ms-0" htmlFor="isAdmin">
                Register as Admin
              </label>
              <div className="text-muted small">Enables quiz and question CRUD controls.</div>
            </div>
            <input
              type="checkbox"
              className="form-check-input ms-0 fs-4"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              role="switch"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <i className="bi bi-person-plus"></i> Sign Up
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 border-top pt-3">
          <p className="mb-0 text-muted small">
            Already have an account? <Link to="/login" className="text-decoration-none fw-bold text-primary">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
