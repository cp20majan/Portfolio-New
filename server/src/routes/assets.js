import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db/index.js';
import { requireAdmin } from '../auth.js';

export const assetsRouter = Router();

const assetsDir = path.join(process.cwd(), 'uploads', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// Site-level images that aren't tied to any single entry (landing doors, about portrait, ...).
const ALLOWED_KEYS = new Set(['door-work', 'door-lab', 'about-portrait']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, assetsDir),
    filename: (req, file, cb) => cb(null, `${req.params.key}${path.extname(file.originalname).slice(0, 10) || '.jpg'}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) return cb(new Error('Unsupported image type — use JPEG, PNG or WebP'));
    cb(null, true);
  },
});

assetsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, image_path FROM site_assets').all();
  const out = {};
  for (const row of rows) out[row.key] = `/uploads/assets/${row.image_path}`;
  res.json(out);
});

assetsRouter.post('/:key', requireAdmin, (req, res) => {
  if (!ALLOWED_KEYS.has(req.params.key)) return res.status(400).json({ error: 'Unknown asset key' });
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image provided (field name: image)' });

    const existing = db.prepare('SELECT image_path FROM site_assets WHERE key = ?').get(req.params.key);
    if (existing && existing.image_path !== req.file.filename) {
      fs.unlink(path.join(assetsDir, existing.image_path), () => {});
    }
    db.prepare(`
      INSERT INTO site_assets (key, image_path, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET image_path = excluded.image_path, updated_at = excluded.updated_at
    `).run(req.params.key, req.file.filename);

    res.json({ key: req.params.key, url: `/uploads/assets/${req.file.filename}` });
  });
});
