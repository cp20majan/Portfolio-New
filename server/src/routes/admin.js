import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db/index.js';
import { requireAdmin } from '../auth.js';

export const adminRouter = Router();

function dirSize(dir) {
  let total = 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    total += stat.isDirectory() ? dirSize(p) : stat.size;
  }
  return total;
}

adminRouter.get('/stats', requireAdmin, (req, res) => {
  const draftCount = db.prepare("SELECT COUNT(*) AS n FROM entries WHERE status = 'draft'").get().n;
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  let storageBytes = 0;
  try {
    storageBytes = dirSize(uploadsRoot);
  } catch {
    storageBytes = 0;
  }
  res.json({ draftCount, storageBytes });
});
