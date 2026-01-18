# Reverse-Tunnel

A multi-connection reverse tunnel solution with **WebUI** and **Authentication** that enables secure remote access to services behind NAT or firewalls.

## Overview

Reverse-Tunnel allows you to expose local services to the internet or create persistent connections from private networks to external servers. This is particularly useful for:

- Accessing services behind NAT/firewalls
- Remote development and debugging
- IoT device management
- Temporary service exposure
- Bypassing restrictive network configurations

## Features

- **Web UI Dashboard**: Modern React-based interface for tunnel management
- **User Authentication**: JWT-based authentication with user registration/login
- **Multiple Tunnel Support**: Manage multiple reverse tunnels simultaneously
- **Real-time Status**: WebSocket-based live tunnel status updates
- **Secure Connections**: Encrypted WebSocket communication between client and server
- **Port Forwarding**: Forward specific ports from local to remote
- **Auto-Reconnect**: Automatic reconnection on connection loss
- **Role-based Access**: Admin and user roles with different permissions
- **SQLite Database**: Lightweight embedded database for user and tunnel storage
- **RESTful API**: Complete API for programmatic access

## Installation

### Prerequisites

- Node.js 18+ and npm
- Network connectivity between client and server

### Quick Start

```bash
# Clone the repository
git clone https://github.com/HEPHEPHEP/Reverse-Tunnel.git
cd Reverse-Tunnel

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Install web UI dependencies
cd web && npm install && cd ..

# Configure environment
cd server
cp .env.example .env
# Edit .env and change JWT_SECRET to a secure random string
cd ..

# Start the server
cd server && npm run dev &

# Start the web UI
cd web && npm run dev
```

Then open `http://localhost:3000` in your browser to access the Web UI!

## Usage

### Web UI

1. **Access the Dashboard**: Open `http://localhost:3000` in your browser
2. **Register an Account**: Create a new user account
3. **Login**: Use your credentials to login
4. **Create a Tunnel**:
   - Navigate to the "Tunnels" page
   - Click "Create Tunnel"
   - Fill in tunnel details (name, local port, remote port)
   - Click "Create"
5. **Start the Client**: Copy the client command from the Web UI
6. **Connect**: Run the client command in your terminal

### Command Line

#### Server

The server runs both the API and WebSocket tunnel server:

```bash
cd server
npm run dev  # Development mode
npm run build && npm start  # Production mode
```

#### Client

Connect a client to expose local services:

```bash
cd client
npm run dev -- -s ws://localhost:8080/tunnel -t TUNNEL_ID -u USER_ID -l 3000
```

Or use the command copied from the Web UI's "Copy Command" button.

## Configuration

### Server Configuration

Create a `.env` file in the `server` directory:

```env
PORT=8080
WEB_PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_PATH=./tunnel.db
NODE_ENV=development
```

### Web UI Configuration

The Web UI automatically proxies API requests to the server. Configure in `web/vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

## Architecture

```
                                  ┌─────────────────┐
                                  │   Web Browser   │
                                  │   (React UI)    │
                                  └────────┬────────┘
                                           │ HTTP/HTTPS
                                           ▼
┌──────────────┐   WebSocket    ┌─────────────────┐
│ Tunnel Client├───────────────►│  Server (Node)  │
│  (Your PC)   │   Encrypted    │  - REST API     │
└──────┬───────┘                │  - WebSocket    │
       │                        │  - Auth (JWT)   │
       │                        │  - SQLite DB    │
       ▼                        └─────────────────┘
┌──────────────┐
│Local Service │
│   :3000      │
└──────────────┘

Flow:
1. User manages tunnels via Web UI
2. Client connects to server via WebSocket
3. Server forwards traffic to client
4. Client forwards to local service
```

## Security Considerations

- **Authentication**: Built-in JWT-based authentication system
- **Password Hashing**: Bcrypt for secure password storage
- **TLS/SSL**: Always use HTTPS/WSS in production
- **JWT Secret**: Change the default JWT_SECRET to a strong random string
- **Database Security**: SQLite with proper file permissions
- **Port Restrictions**: Limit exposed ports to only what's necessary
- **Access Control**: Role-based access (admin/user)
- **Input Validation**: All API inputs are validated
- **CORS**: Configure CORS for production deployments

## Examples

### Example 1: Expose a Local Web Server

1. Create a tunnel via Web UI:
   - Name: "My Web App"
   - Local Port: 3000
   - Remote Port: 8000
   - Protocol: TCP

2. Start the client:
```bash
cd client
npm run dev -- -s ws://localhost:8080/tunnel -t <TUNNEL_ID> -u <USER_ID> -l 3000
```

3. Access your service at `http://your-server:8000`

### Example 2: Database Tunnel

1. Create tunnel for PostgreSQL:
   - Name: "PostgreSQL"
   - Local Port: 5432
   - Remote Port: 5432
   - Protocol: TCP

2. Connect remotely to your database through the tunnel

### Example 3: Multiple Services

Create multiple tunnels in the Web UI and run separate client instances for each:

```bash
# Terminal 1: Web app
npm run dev -- -s ws://server:8080/tunnel -t TUNNEL_ID_1 -u USER_ID -l 3000

# Terminal 2: API
npm run dev -- -s ws://server:8080/tunnel -t TUNNEL_ID_2 -u USER_ID -l 4000

# Terminal 3: Database
npm run dev -- -s ws://server:8080/tunnel -t TUNNEL_ID_3 -u USER_ID -l 5432
```

## Troubleshooting

### Connection Issues

- Verify server is reachable: `telnet server.com 8080`
- Check firewall settings on both ends
- Ensure ports are not already in use

### Performance Issues

- Monitor network bandwidth
- Check server resource usage
- Consider connection pooling

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [x] Web UI for tunnel management
- [x] Built-in authentication system
- [x] User management dashboard
- [x] Real-time tunnel status updates
- [ ] Support for UDP tunnels (TCP currently implemented)
- [ ] Bandwidth limiting and QoS
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] Advanced metrics and monitoring dashboard
- [ ] API token management
- [ ] Tunnel usage statistics
- [ ] Email notifications
- [ ] Two-factor authentication (2FA)

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

Built with modern networking technologies to provide reliable and secure reverse tunnel capabilities.
