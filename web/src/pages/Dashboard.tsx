import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, Tunnel, tunnelAPI } from '../api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTunnels();
  }, []);

  const loadTunnels = async () => {
    try {
      const response = await tunnelAPI.getAll();
      setTunnels(response.data);
    } catch (error) {
      console.error('Failed to load tunnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeTunnels = tunnels.filter(t => t.status === 'active').length;
  const inactiveTunnels = tunnels.filter(t => t.status === 'inactive').length;

  return (
    <Layout user={user} onLogout={onLogout}>
      <h1 style={{ marginBottom: '30px', color: 'white' }}>Dashboard</h1>

      <div className="grid grid-2">
        <div className="stat-card">
          <div className="stat-value">{tunnels.length}</div>
          <div className="stat-label">Total Tunnels</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#48bb78' }}>
            {activeTunnels}
          </div>
          <div className="stat-label">Active Tunnels</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f56565' }}>
            {inactiveTunnels}
          </div>
          <div className="stat-label">Inactive Tunnels</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#667eea' }}>
            {user.role}
          </div>
          <div className="stat-label">Account Type</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>Recent Tunnels</h2>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : tunnels.length === 0 ? (
          <div className="empty-state">
            <h3>No tunnels yet</h3>
            <p>Create your first tunnel to get started!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Local Port</th>
                <th>Remote Port</th>
                <th>Protocol</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tunnels.slice(0, 5).map((tunnel) => (
                <tr key={tunnel.id}>
                  <td>{tunnel.name}</td>
                  <td>{tunnel.local_port}</td>
                  <td>{tunnel.remote_port}</td>
                  <td>{tunnel.protocol.toUpperCase()}</td>
                  <td>
                    <span className={`status-badge status-${tunnel.status}`}>
                      {tunnel.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>Welcome!</h2>
        <p style={{ color: '#718096', marginBottom: '16px' }}>
          Reverse Tunnel allows you to expose local services to the internet securely.
          Create tunnels, manage connections, and monitor your services in real-time.
        </p>
        <p style={{ color: '#718096' }}>
          Get started by creating a new tunnel in the Tunnels section.
        </p>
      </div>
    </Layout>
  );
}
