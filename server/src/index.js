import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { entriesRouter } from './routes/entries.js';
import { uploadRouter } from './routes/upload.js';
import { adminRouter } from './routes/admin.js';
import './db/index.js';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/entries', entriesRouter);
app.use('/api', uploadRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`Portfolio API listening on http://localhost:${env.port}`);
});
