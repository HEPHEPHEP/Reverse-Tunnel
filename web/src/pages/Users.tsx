import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, userAPI } from '../api';

interface UsersProps {
  user: User;
  onLogout: () => void;
}

export default function Users({ user, onLogout }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userAPI.delete(id);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <h1 style={{ marginBottom: '30px', color: 'white' }}>User Management</h1>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: u.role === 'admin' ? '#c6f6d5' : '#e2e8f0',
                        color: u.role === 'admin' ? '#22543d' : '#2d3748',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>{formatDate(u.last_login)}</td>
                  <td>
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>User Management</h3>
        <p style={{ color: '#718096' }}>
          As an administrator, you can view all users and delete user accounts.
          Note: You cannot delete your own account.
        </p>
      </div>
    </Layout>
  );
}
