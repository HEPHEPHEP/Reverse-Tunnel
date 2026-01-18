import { Link, useLocation } from 'react-router-dom';
import { User } from '../api';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ user, onLogout, children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <div className="logo">Reverse Tunnel</div>
          <div className="nav">
            <Link
              to="/"
              className="nav-link"
              style={{ color: isActive('/') ? '#667eea' : undefined }}
            >
              Dashboard
            </Link>
            <Link
              to="/tunnels"
              className="nav-link"
              style={{ color: isActive('/tunnels') ? '#667eea' : undefined }}
            >
              Tunnels
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/users"
                className="nav-link"
                style={{ color: isActive('/users') ? '#667eea' : undefined }}
              >
                Users
              </Link>
            )}
            <span style={{ color: '#718096', marginLeft: '10px' }}>
              {user.username}
            </span>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="container">{children}</div>
    </div>
  );
}
