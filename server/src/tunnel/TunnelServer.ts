import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { TunnelModel } from '../models/Tunnel';
import { v4 as uuidv4 } from 'uuid';
import * as net from 'net';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId: string;
  tunnelId: string;
  connectedAt: Date;
}

export class TunnelServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private tunnelSockets: Map<string, net.Socket[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/tunnel' });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New tunnel client connection attempt');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(ws);
      });
    });

    console.log('✅ Tunnel WebSocket server initialized');
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'register':
        this.handleRegister(ws, message);
        break;
      case 'data':
        this.handleData(ws, message);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleRegister(ws: WebSocket, message: any) {
    const { tunnelId, userId } = message;

    if (!tunnelId || !userId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Missing tunnelId or userId' }));
      return;
    }

    const tunnel = TunnelModel.findById(tunnelId);

    if (!tunnel) {
      ws.send(JSON.stringify({ type: 'error', message: 'Tunnel not found' }));
      return;
    }

    if (tunnel.user_id !== userId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Access denied' }));
      return;
    }

    const clientId = uuidv4();
    const client: ConnectedClient = {
      id: clientId,
      ws,
      userId,
      tunnelId,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);
    TunnelModel.updateStatus(tunnelId, 'active');

    ws.send(JSON.stringify({
      type: 'registered',
      clientId,
      tunnel: {
        id: tunnel.id,
        name: tunnel.name,
        local_port: tunnel.local_port,
        remote_port: tunnel.remote_port,
        protocol: tunnel.protocol,
      },
    }));

    console.log(`✅ Client registered: ${clientId} for tunnel ${tunnelId}`);

    // Start listening on remote port
    this.startTunnelListener(tunnel, clientId);
  }

  private startTunnelListener(tunnel: any, clientId: string) {
    const server = net.createServer((socket) => {
      console.log(`New connection on tunnel ${tunnel.id}, port ${tunnel.remote_port}`);

      const connectionId = uuidv4();
      const client = this.clients.get(clientId);

      if (!client) {
        socket.end();
        return;
      }

      // Store socket
      if (!this.tunnelSockets.has(tunnel.id)) {
        this.tunnelSockets.set(tunnel.id, []);
      }
      this.tunnelSockets.get(tunnel.id)!.push(socket);

      // Forward data to client
      socket.on('data', (data) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'forward',
            connectionId,
            data: data.toString('base64'),
          }));
        }
      });

      socket.on('close', () => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'close',
            connectionId,
          }));
        }
        const sockets = this.tunnelSockets.get(tunnel.id);
        if (sockets) {
          const index = sockets.indexOf(socket);
          if (index > -1) sockets.splice(index, 1);
        }
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      // Notify client about new connection
      client.ws.send(JSON.stringify({
        type: 'connect',
        connectionId,
        remotePort: tunnel.remote_port,
        localPort: tunnel.local_port,
      }));
    });

    server.listen(tunnel.remote_port, () => {
      console.log(`🚀 Tunnel listening on port ${tunnel.remote_port}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${tunnel.remote_port} already in use`);
        TunnelModel.updateStatus(tunnel.id, 'error');
      } else {
        console.error('Server error:', err);
      }
    });
  }

  private handleData(ws: WebSocket, message: any) {
    // Handle data coming back from client
    const { connectionId, data } = message;
    // This would forward data back through the appropriate socket
    // Implementation depends on maintaining connection mappings
  }

  private handleDisconnect(ws: WebSocket) {
    // Find and remove client
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        console.log(`Client disconnected: ${clientId}`);
        TunnelModel.updateStatus(client.tunnelId, 'inactive');

        // Close all tunnel sockets
        const sockets = this.tunnelSockets.get(client.tunnelId);
        if (sockets) {
          sockets.forEach(s => s.end());
          this.tunnelSockets.delete(client.tunnelId);
        }

        this.clients.delete(clientId);
        break;
      }
    }
  }

  public getConnectedClients(): ConnectedClient[] {
    return Array.from(this.clients.values());
  }

  public broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }
}
