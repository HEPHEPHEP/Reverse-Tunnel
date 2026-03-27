#!/bin/bash

# Start all services in development mode

echo "Starting Reverse Tunnel Development Environment..."
echo ""

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "web/node_modules" ]; then
    echo "Installing web dependencies..."
    cd web && npm install && cd ..
fi

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "Creating .env file..."
    cp server/.env.example server/.env
    # Automatisch ein sicheres JWT_SECRET generieren
    GENERATED_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '\n' | head -c 64)
    if [ -n "$GENERATED_SECRET" ]; then
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${GENERATED_SECRET}|" server/.env
        echo "✅ JWT_SECRET automatisch generiert"
    else
        echo "⚠️  Bitte manuell ein JWT_SECRET in server/.env setzen!"
    fi
fi

echo ""
echo "Starting services..."
echo ""

# Start server in background
cd server
npm run dev &
SERVER_PID=$!
echo "✅ Server started (PID: $SERVER_PID)"

# Wait for server to start
sleep 3

# Start web UI
cd ../web
echo "✅ Starting Web UI..."
npm run dev

# Cleanup on exit
trap "kill $SERVER_PID" EXIT
