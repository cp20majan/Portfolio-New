import { Router } from 'express';
import { env } from '../env.js';
import { verifyPassword, issueSessionCookie, clearSessionCookie, currentSession } from '../auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email !== env.adminEmail || !password || !verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  issueSessionCookie(res);
  res.json({ email: env.adminEmail, role: 'admin' });
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  const session = currentSession(req);
  if (!session) return res.json({ role: 'visitor' });
  res.json({ role: 'admin', email: session.email });
});
