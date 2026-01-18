import { db } from '../database/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: number;
  last_login?: number;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export class UserModel {
  static async create(data: CreateUserData): Promise<User> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(data.password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.username, data.email, password_hash, data.role || 'user');

    return this.findById(id)!;
  }

  static findById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static updateLastLogin(userId: string): void {
    const stmt = db.prepare('UPDATE users SET last_login = strftime(\'%s\', \'now\') WHERE id = ?');
    stmt.run(userId);
  }

  static findAll(): User[] {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
}
