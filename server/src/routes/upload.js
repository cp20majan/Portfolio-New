import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { requireAdmin } from '../auth.js';
import { probe, transcode, extractFrame } from '../ffmpeg.js';
import { serializeEntry, formatDuration } from '../serialize.js';

export const uploadRouter = Router();

const uploadsRoot = path.join(process.cwd(), 'uploads');
const tmpDir = path.join(uploadsRoot, 'tmp');
const videoDir = path.join(uploadsRoot, 'video');
const posterDir = path.join(uploadsRoot, 'poster');
const filesDir = path.join(uploadsRoot, 'files');
for (const dir of [tmpDir, videoDir, posterDir, filesDir]) fs.mkdirSync(dir, { recursive: true });

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).slice(0, 10)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB, matches the drop-zone copy
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported video type'));
    }
    cb(null, true);
  },
});

const jobs = new Map(); // in-memory progress cache; upload_jobs table is the durable record

function setJob(jobId, patch) {
  const job = { ...(jobs.get(jobId) || {}), ...patch };
  jobs.set(jobId, job);
  db.prepare("UPDATE upload_jobs SET phase = ?, pct = ?, error = ?, updated_at = datetime('now') WHERE id = ?")
    .run(job.phase, job.pct, job.error || null, jobId);
  return job;
}

uploadRouter.post('/entries/:id/video', requireAdmin, (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    if (!entry) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Entry not found' });
    }
    if (!req.file) return res.status(400).json({ error: 'No video file provided (field name: video)' });

    const jobId = uuidv4();
    db.prepare(`INSERT INTO upload_jobs (id, entry_id, phase, pct) VALUES (?, ?, 'transcoding', 0)`).run(jobId, entry.id);
    setJob(jobId, { phase: 'transcoding', pct: 0, entryId: entry.id });
    db.prepare("UPDATE entries SET video_status = 'transcoding', updated_at = datetime('now') WHERE id = ?").run(entry.id);

    res.status(202).json({ jobId });

    runTranscodeJob(jobId, entry.id, req.file.path).catch((e) => {
      setJob(jobId, { phase: 'failed', error: e.message });
      db.prepare("UPDATE entries SET video_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(entry.id);
    });
  });
});

async function runTranscodeJob(jobId, entryId, tmpPath) {
  const info = await probe(tmpPath);
  const duration = info.durationSeconds || 1;

  const outputName = `${entryId}.mp4`;
  const outputPath = path.join(videoDir, outputName);
  await transcode(tmpPath, outputPath, duration, (fraction) => {
    setJob(jobId, { phase: 'transcoding', pct: Math.round(fraction * 90) });
  });

  setJob(jobId, { phase: 'finalising', pct: 92 });

  const candidateTimestamps = [duration * 0.1, duration * 0.5, duration * 0.85];
  const posterCandidates = [];
  for (let i = 0; i < candidateTimestamps.length; i++) {
    const ts = candidateTimestamps[i];
    const candName = `${entryId}-cand-${i}.jpg`;
    await extractFrame(outputPath, ts, path.join(posterDir, candName));
    posterCandidates.push({ index: i, timestampSeconds: ts, url: `/uploads/poster/${candName}` });
  }

  fs.unlink(tmpPath, () => {});

  db.prepare(`
    UPDATE entries SET video_status = 'ready', video_path = ?, video_duration_seconds = ?,
      video_width = ?, video_height = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(outputName, duration, info.width, info.height, entryId);

  setJob(jobId, { phase: 'done', pct: 100, posterCandidates, durationLabel: formatDuration(duration) });
}

uploadRouter.get('/jobs/:jobId', requireAdmin, (req, res) => {
  const dbJob = db.prepare('SELECT * FROM upload_jobs WHERE id = ?').get(req.params.jobId);
  if (!dbJob) return res.status(404).json({ error: 'Not found' });
  const live = jobs.get(req.params.jobId) || {};
  res.json({
    phase: live.phase || dbJob.phase,
    pct: live.pct ?? dbJob.pct,
    error: live.error || dbJob.error,
    posterCandidates: live.posterCandidates || [],
    durationLabel: live.durationLabel || null,
  });
});

uploadRouter.post('/entries/:id/poster/candidates', requireAdmin, async (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (!entry.video_path) return res.status(400).json({ error: 'Entry has no video yet' });
  const videoPath = path.join(videoDir, entry.video_path);
  const duration = entry.video_duration_seconds || 1;
  try {
    const timestamps = [duration * 0.1, duration * 0.5, duration * 0.85];
    const posterCandidates = [];
    for (let i = 0; i < timestamps.length; i++) {
      const candName = `${entry.id}-cand-${i}.jpg`;
      await extractFrame(videoPath, timestamps[i], path.join(posterDir, candName));
      posterCandidates.push({ index: i, timestampSeconds: timestamps[i], url: `/uploads/poster/${candName}` });
    }
    res.json({ posterCandidates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

uploadRouter.post('/entries/:id/poster', requireAdmin, (req, res) => {
  const { candidateIndex } = req.body || {};
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  const candPath = path.join(posterDir, `${entry.id}-cand-${candidateIndex}.jpg`);
  if (!fs.existsSync(candPath)) return res.status(400).json({ error: 'Unknown poster candidate' });
  const finalName = `${entry.id}.jpg`;
  fs.copyFileSync(candPath, path.join(posterDir, finalName));
  db.prepare("UPDATE entries SET poster_path = ?, updated_at = datetime('now') WHERE id = ?").run(finalName, entry.id);
  const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(entry.id);
  res.json(serializeEntry(updated, { includeDraftFields: true }));
});

const thumbnailUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, posterDir),
    filename: (req, file, cb) => cb(null, `${req.params.id}-custom${path.extname(file.originalname).slice(0, 10) || '.jpg'}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB, plenty for a still image
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported image type — use JPEG, PNG or WebP'));
    }
    cb(null, true);
  },
});

uploadRouter.post('/entries/:id/thumbnail', requireAdmin, (req, res) => {
  thumbnailUpload.single('thumbnail')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    if (!entry) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Entry not found' });
    }
    if (!req.file) return res.status(400).json({ error: 'No image provided (field name: thumbnail)' });

    if (entry.poster_path && entry.poster_path !== req.file.filename) {
      fs.unlink(path.join(posterDir, entry.poster_path), () => {});
    }
    db.prepare("UPDATE entries SET poster_path = ?, updated_at = datetime('now') WHERE id = ?")
      .run(req.file.filename, entry.id);
    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(entry.id);
    res.json(serializeEntry(updated, { includeDraftFields: true }));
  });
});

const reportUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, filesDir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).slice(0, 10)}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

uploadRouter.post('/entries/:id/report', requireAdmin, (req, res) => {
  reportUpload.single('report')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    if (!entry) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Entry not found' });
    }
    if (!req.file) return res.status(400).json({ error: 'No PDF provided (field name: report)' });
    db.prepare("UPDATE entries SET file_path = ?, file_label = ?, updated_at = datetime('now') WHERE id = ?")
      .run(req.file.filename, req.file.originalname, entry.id);
    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(entry.id);
    res.json(serializeEntry(updated, { includeDraftFields: true }));
  });
});
