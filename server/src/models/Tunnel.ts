import { db } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface Tunnel {
  id: string;
  user_id: string;
  name: string;
  local_port: number;
  remote_port: number;
  protocol: 'tcp' | 'udp';
  status: 'active' | 'inactive' | 'error';
  created_at: number;
  updated_at: number;
}

export interface CreateTunnelData {
  user_id: string;
  name: string;
  local_port: number;
  remote_port: number;
  protocol?: 'tcp' | 'udp';
}

export class TunnelModel {
  static create(data: CreateTunnelData): Tunnel {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO tunnels (id, user_id, name, local_port, remote_port, protocol)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.user_id,
      data.name,
      data.local_port,
      data.remote_port,
      data.protocol || 'tcp'
    );

    return this.findById(id)!;
  }

  static findById(id: string): Tunnel | undefined {
    const stmt = db.prepare('SELECT * FROM tunnels WHERE id = ?');
    return stmt.get(id) as Tunnel | undefined;
  }

  static findByUserId(userId: string): Tunnel[] {
    const stmt = db.prepare('SELECT * FROM tunnels WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Tunnel[];
  }

  static findAll(): Tunnel[] {
    const stmt = db.prepare('SELECT * FROM tunnels ORDER BY created_at DESC');
    return stmt.all() as Tunnel[];
  }

  static updateStatus(id: string, status: 'active' | 'inactive' | 'error'): void {
    const stmt = db.prepare(`
      UPDATE tunnels
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM tunnels WHERE id = ?');
    stmt.run(id);
  }

  static update(id: string, data: Partial<CreateTunnelData>): Tunnel {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.local_port !== undefined) {
      updates.push('local_port = ?');
      values.push(data.local_port);
    }
    if (data.remote_port !== undefined) {
      updates.push('remote_port = ?');
      values.push(data.remote_port);
    }
    if (data.protocol !== undefined) {
      updates.push('protocol = ?');
      values.push(data.protocol);
    }

    if (updates.length > 0) {
      updates.push('updated_at = strftime(\'%s\', \'now\')');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE tunnels SET ${updates.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);
    }

    return this.findById(id)!;
  }
}
