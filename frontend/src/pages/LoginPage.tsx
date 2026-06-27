import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loginUser, clearMessages } from '../features/auth/authSlice';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

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
    
    if (!username.trim() || !password.trim()) {
      setValidationError('Username and password are required');
      return;
    }
    
    dispatch(loginUser({ username, password }));
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4 border-0 rounded-4" style={{ width: '100%', maxWidth: '450px', backgroundColor: '#ffffff' }}>
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h2 className="fw-bold mt-2 text-dark">Welcome Back</h2>
          <p className="text-muted">Sign in to start taking quizzes</p>
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
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-muted small" htmlFor="password">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-key text-secondary"></i>
              </span>
              <input
                type="password"
                id="password"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
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
                <i className="bi bi-box-arrow-in-right"></i> Login
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 border-top pt-3">
          <p className="mb-0 text-muted small">
            Don't have an account? <Link to="/signup" className="text-decoration-none fw-bold text-primary">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
