import 'dotenv/config';

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  adminEmail: required('ADMIN_EMAIL', 'cp@majan.dev'),
  // bcrypt hash of the admin password. Falls back to a dev-only password ("changeme")
  // so the app boots out of the box; override ADMIN_PASSWORD_HASH in production.
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || null,
  adminPasswordFallback: 'changeme',
  cookieSecure: process.env.NODE_ENV === 'production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
