import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('');
  console.error('╔═══════════════════════════════════════════════════════╗');
  console.error('║  FEHLER: JWT_SECRET nicht gesetzt oder zu kurz       ║');
  console.error('║  Min. 32 Zeichen erforderlich.                       ║');
  console.error('║                                                       ║');
  console.error('║  → Kopiere .env.example nach .env und setze einen    ║');
  console.error('║    sicheren Wert:                                     ║');
  console.error('║    openssl rand -base64 48                            ║');
  console.error('╚═══════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
