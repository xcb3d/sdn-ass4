import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchUsers } from '../features/users/usersSlice';

export const AdminUsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { list: users, loading, error } = useAppSelector((state) => state.users);
  const { user } = useAppSelector((state) => state.auth);

  // Protect route
  useEffect(() => {
    if (!user?.admin) {
      navigate('/dashboard');
    } else {
      dispatch(fetchUsers());
    }
  }, [user, navigate, dispatch]);

  if (!user?.admin) return null;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h1 className="fw-bold text-dark mb-0">Manage Users</h1>
          <p className="text-muted">View all registered users and their access roles.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading users database...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <i className="bi bi-people fs-1 text-muted"></i>
          <h3 className="fw-bold mt-3 text-dark">No Users Found</h3>
        </div>
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ width: '40%' }}>User ID</th>
                  <th scope="col" style={{ width: '40%' }}>Username</th>
                  <th scope="col" style={{ width: '20%' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <code className="text-secondary small">{u._id}</code>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{u.username}</div>
                    </td>
                    <td>
                      {u.admin ? (
                        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                          <i className="bi bi-shield-lock-fill"></i> Admin
                        </span>
                      ) : (
                        <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                          <i className="bi bi-person-fill"></i> User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
