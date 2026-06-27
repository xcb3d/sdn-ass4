import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top px-3 py-2 shadow">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-patch-question-fill text-primary fs-3"></i>
          <span className="fw-bold tracking-tight bg-gradient bg-clip-text text-transparent bg-primary text-white">Quizify</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    <i className="bi bi-grid-fill me-1"></i> Dashboard
                  </Link>
                </li>
                {user?.admin && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin/questions">
                        <i className="bi bi-file-earmark-text-fill me-1"></i> Manage Questions
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin/users">
                        <i className="bi bi-people-fill me-1"></i> Manage Users
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-light d-flex align-items-center gap-2">
                  <i className="bi bi-person-circle fs-5 text-info"></i>
                  <span>
                    Hello, <strong>{user?.username}</strong>
                    {user?.admin && <span className="badge bg-danger ms-2">Admin</span>}
                  </span>
                </span>
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm px-3">Login</Link>
                <Link to="/signup" className="btn btn-primary btn-sm px-3">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
