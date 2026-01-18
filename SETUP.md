# Setup Guide

This guide will help you set up and run the Reverse Tunnel system with WebUI and authentication.

## Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge (optional but helpful)

## Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..

# Install web UI dependencies
cd web
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` and change the `JWT_SECRET` to a secure random string:

```env
PORT=8080
WEB_PORT=3000
JWT_SECRET=change-this-to-a-secure-random-string
DATABASE_PATH=./tunnel.db
NODE_ENV=development
```

### 3. Start the Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:8080`

### 4. Start the Web UI

In a new terminal:

```bash
cd web
npm run dev
```

The web UI will be available at `http://localhost:3000`

### 5. Access the Web UI

1. Open your browser to `http://localhost:3000`
2. Register a new account
3. Login with your credentials
4. Create your first tunnel!

## Creating and Using Tunnels

### Via Web UI

1. Login to the Web UI at `http://localhost:3000`
2. Navigate to "Tunnels" page
3. Click "Create Tunnel"
4. Fill in the details:
   - **Name**: A friendly name for your tunnel (e.g., "My Web App")
   - **Local Port**: The port your local service runs on (e.g., 3000)
   - **Remote Port**: The port you want to expose publicly (e.g., 8000)
   - **Protocol**: TCP or UDP
5. Click "Create"
6. Click "Copy Command" to get the client connection command

### Starting the Tunnel Client

After creating a tunnel in the Web UI:

```bash
cd client
npm run dev -- -s ws://localhost:8080/tunnel -t <TUNNEL_ID> -u <USER_ID> -l <LOCAL_PORT>
```

Or use the command from the "Copy Command" button in the Web UI.

## Production Deployment

### 1. Build All Components

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build

# Build web UI
cd web
npm run build
```

### 2. Configure Production Environment

Update `server/.env`:

```env
PORT=8080
WEB_PORT=3000
JWT_SECRET=your-very-secure-random-string-here
DATABASE_PATH=/var/lib/reverse-tunnel/tunnel.db
NODE_ENV=production
```

### 3. Start in Production

```bash
# Start server
cd server
npm start

# Serve web UI (use nginx or any static file server)
# Point your web server to web/dist directory
```

### 4. Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web UI
    location / {
        root /path/to/reverse-tunnel/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy for tunnels
    location /tunnel {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Using Docker (Optional)

Create a `Dockerfile` for the server:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY web/package*.json ./web/

RUN cd server && npm install --production
RUN cd client && npm install --production
RUN cd web && npm install

COPY . .

RUN cd server && npm run build
RUN cd client && npm run build
RUN cd web && npm run build

EXPOSE 8080 3000

CMD ["node", "server/dist/index.js"]
```

## Security Recommendations

1. **Always use HTTPS in production** - Set up SSL/TLS certificates
2. **Change the default JWT_SECRET** - Use a strong, random secret
3. **Use strong passwords** - Enforce password complexity
4. **Firewall rules** - Only expose necessary ports
5. **Regular updates** - Keep dependencies up to date
6. **Database backups** - Regularly backup your SQLite database
7. **Rate limiting** - Implement rate limiting on API endpoints

## Troubleshooting

### Port Already in Use

If you see "EADDRINUSE" error:

```bash
# Find process using the port
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Database Locked

If SQLite database is locked:

```bash
# Stop all processes
# Delete database (WARNING: loses all data)
rm server/tunnel.db

# Restart server (will recreate database)
cd server && npm run dev
```

### WebSocket Connection Failed

1. Check if server is running
2. Verify the WebSocket URL (should be `ws://` or `wss://`)
3. Check firewall settings
4. Ensure no proxy is blocking WebSocket connections

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Tunnel Endpoints

- `GET /api/tunnels` - Get all tunnels for current user
- `GET /api/tunnels/:id` - Get specific tunnel
- `POST /api/tunnels` - Create new tunnel
- `PUT /api/tunnels/:id` - Update tunnel
- `DELETE /api/tunnels/:id` - Delete tunnel

### User Management (Admin Only)

- `GET /api/users` - Get all users
- `DELETE /api/users/:id` - Delete user

## Support

For issues and questions:
- Check the troubleshooting section above
- Review server logs for errors
- Open an issue on GitHub
