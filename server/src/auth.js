import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

const COOKIE_NAME = 'portfolio_session';

export function verifyPassword(password) {
  if (env.adminPasswordHash) {
    return bcrypt.compareSync(password, env.adminPasswordHash);
  }
  // Dev fallback only used when no ADMIN_PASSWORD_HASH is configured.
  return password === env.adminPasswordFallback;
}

export function issueSessionCookie(res) {
  const token = jwt.sign({ role: 'admin', email: env.adminEmail }, env.jwtSecret, { expiresIn: '12h' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function currentSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const session = currentSession(req);
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ error: 'Admin session required' });
  }
  req.session = session;
  next();
}
