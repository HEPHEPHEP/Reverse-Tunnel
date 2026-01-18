import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, Tunnel, tunnelAPI } from '../api';

interface TunnelsProps {
  user: User;
  onLogout: () => void;
}

export default function Tunnels({ user, onLogout }: TunnelsProps) {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<Tunnel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    local_port: '',
    remote_port: '',
    protocol: 'tcp' as 'tcp' | 'udp',
  });

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

  const handleCreate = () => {
    setEditingTunnel(null);
    setFormData({ name: '', local_port: '', remote_port: '', protocol: 'tcp' });
    setShowModal(true);
  };

  const handleEdit = (tunnel: Tunnel) => {
    setEditingTunnel(tunnel);
    setFormData({
      name: tunnel.name,
      local_port: tunnel.local_port.toString(),
      remote_port: tunnel.remote_port.toString(),
      protocol: tunnel.protocol,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        local_port: parseInt(formData.local_port),
        remote_port: parseInt(formData.remote_port),
        protocol: formData.protocol,
      };

      if (editingTunnel) {
        await tunnelAPI.update(editingTunnel.id, data);
      } else {
        await tunnelAPI.create(data);
      }

      setShowModal(false);
      loadTunnels();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save tunnel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tunnel?')) return;

    try {
      await tunnelAPI.delete(id);
      loadTunnels();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete tunnel');
    }
  };

  const getClientCommand = (tunnel: Tunnel) => {
    const serverUrl = window.location.hostname;
    const port = window.location.port || '8080';
    return `tunnel-client -s ws://${serverUrl}:${port}/tunnel -t ${tunnel.id} -u ${user.id} -l ${tunnel.local_port}`;
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: 'white' }}>Tunnels</h1>
        <button onClick={handleCreate} className="btn btn-primary">
          Create Tunnel
        </button>
      </div>

      <div className="card">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tunnels.map((tunnel) => (
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
                  <td>
                    <button
                      onClick={() => handleEdit(tunnel)}
                      className="btn btn-secondary"
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tunnel.id)}
                      className="btn btn-danger"
                      style={{ marginRight: '8px' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        const cmd = getClientCommand(tunnel);
                        navigator.clipboard.writeText(cmd);
                        alert('Command copied to clipboard!');
                      }}
                      className="btn btn-secondary"
                    >
                      Copy Command
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {tunnels.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>How to Connect</h3>
          <p style={{ color: '#718096', marginBottom: '12px' }}>
            Use the tunnel client to connect your local service:
          </p>
          <ol style={{ color: '#718096', paddingLeft: '20px' }}>
            <li>Install the client: <code>npm install -g reverse-tunnel-client</code></li>
            <li>Click "Copy Command" button for the tunnel you want to use</li>
            <li>Run the command in your terminal</li>
            <li>Your local service will be accessible on the remote port!</li>
          </ol>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTunnel ? 'Edit Tunnel' : 'Create Tunnel'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Local Port</label>
                <input
                  type="number"
                  className="input"
                  value={formData.local_port}
                  onChange={(e) => setFormData({ ...formData, local_port: e.target.value })}
                  required
                  min="1"
                  max="65535"
                />
              </div>

              <div className="form-group">
                <label>Remote Port</label>
                <input
                  type="number"
                  className="input"
                  value={formData.remote_port}
                  onChange={(e) => setFormData({ ...formData, remote_port: e.target.value })}
                  required
                  min="1"
                  max="65535"
                />
              </div>

              <div className="form-group">
                <label>Protocol</label>
                <select
                  className="input"
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'tcp' | 'udp' })}
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingTunnel ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
