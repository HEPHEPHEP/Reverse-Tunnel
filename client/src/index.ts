#!/usr/bin/env node

import WebSocket from 'ws';
import net from 'net';
import { program } from 'commander';
import chalk from 'chalk';

interface TunnelConfig {
  serverUrl: string;
  tunnelId: string;
  userId: string;
  localPort: number;
}

class TunnelClient {
  private ws: WebSocket | null = null;
  private config: TunnelConfig;
  private connections: Map<string, net.Socket> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  connect() {
    console.log(chalk.blue('🔌 Connecting to tunnel server...'));
    console.log(chalk.gray(`   Server: ${this.config.serverUrl}`));
    console.log(chalk.gray(`   Tunnel ID: ${this.config.tunnelId}`));

    this.ws = new WebSocket(this.config.serverUrl);

    this.ws.on('open', () => {
      console.log(chalk.green('✅ Connected to tunnel server'));
      this.register();
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error(chalk.red('Failed to parse message:'), error);
      }
    });

    this.ws.on('close', () => {
      console.log(chalk.yellow('⚠️  Disconnected from tunnel server'));
      this.handleDisconnect();
    });

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message);
    });
  }

  private register() {
    if (!this.ws) return;

    this.ws.send(JSON.stringify({
      type: 'register',
      tunnelId: this.config.tunnelId,
      userId: this.config.userId,
    }));
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'registered':
        this.handleRegistered(message);
        break;
      case 'connect':
        this.handleConnect(message);
        break;
      case 'forward':
        this.handleForward(message);
        break;
      case 'close':
        this.handleClose(message);
        break;
      case 'pong':
        // Ping response
        break;
      case 'error':
        console.error(chalk.red('Server error:'), message.message);
        break;
      default:
        console.warn(chalk.yellow('Unknown message type:'), message.type);
    }
  }

  private handleRegistered(message: any) {
    const { tunnel } = message;
    console.log(chalk.green('✅ Tunnel registered successfully'));
    console.log('');
    console.log(chalk.bold('📊 Tunnel Information:'));
    console.log(chalk.gray(`   Name:        ${tunnel.name}`));
    console.log(chalk.gray(`   Protocol:    ${tunnel.protocol.toUpperCase()}`));
    console.log(chalk.gray(`   Local Port:  ${tunnel.local_port}`));
    console.log(chalk.gray(`   Remote Port: ${tunnel.remote_port}`));
    console.log('');
    console.log(chalk.green('🎉 Tunnel is now active and ready to receive connections!'));
  }

  private handleConnect(message: any) {
    const { connectionId, localPort } = message;
    console.log(chalk.blue(`📥 New connection: ${connectionId}`));

    const socket = net.connect(localPort, 'localhost', () => {
      console.log(chalk.green(`   Connected to local service on port ${localPort}`));
    });

    this.connections.set(connectionId, socket);

    socket.on('data', (data) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'data',
          connectionId,
          data: data.toString('base64'),
        }));
      }
    });

    socket.on('close', () => {
      console.log(chalk.gray(`   Connection closed: ${connectionId}`));
      this.connections.delete(connectionId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'close',
          connectionId,
        }));
      }
    });

    socket.on('error', (err) => {
      console.error(chalk.red(`   Socket error: ${err.message}`));
      this.connections.delete(connectionId);
    });
  }

  private handleForward(message: any) {
    const { connectionId, data } = message;
    const socket = this.connections.get(connectionId);

    if (socket) {
      const buffer = Buffer.from(data, 'base64');
      socket.write(buffer);
    }
  }

  private handleClose(message: any) {
    const { connectionId } = message;
    const socket = this.connections.get(connectionId);

    if (socket) {
      socket.end();
      this.connections.delete(connectionId);
    }
  }

  private handleDisconnect() {
    // Close all connections
    this.connections.forEach(socket => socket.end());
    this.connections.clear();

    // Attempt reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log(chalk.blue('🔄 Attempting to reconnect...'));
      this.connect();
    }, 5000);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.connections.forEach(socket => socket.end());
    this.connections.clear();
  }
}

// CLI
program
  .name('tunnel-client')
  .description('Reverse Tunnel Client')
  .version('1.0.0')
  .requiredOption('-s, --server <url>', 'Tunnel server WebSocket URL')
  .requiredOption('-t, --tunnel-id <id>', 'Tunnel ID')
  .requiredOption('-u, --user-id <id>', 'User ID')
  .requiredOption('-l, --local-port <port>', 'Local port to forward', parseInt)
  .parse();

const options = program.opts();

console.log(chalk.bold.cyan('╔════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('║   Reverse Tunnel Client                    ║'));
console.log(chalk.bold.cyan('╚════════════════════════════════════════════╝'));
console.log('');

const client = new TunnelClient({
  serverUrl: options.server,
  tunnelId: options.tunnelId,
  userId: options.userId,
  localPort: options.localPort,
});

client.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log(chalk.yellow('⚠️  Shutting down...'));
  client.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log(chalk.yellow('⚠️  Shutting down...'));
  client.disconnect();
  process.exit(0);
});
