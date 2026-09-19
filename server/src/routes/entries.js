import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { requireAdmin, currentSession } from '../auth.js';
import { serializeEntry } from '../serialize.js';

export const entriesRouter = Router();

function nextEntryNumber(side) {
  const row = db.prepare('SELECT MAX(entry_number) AS n FROM entries WHERE side = ?').get(side);
  return (row?.n || 0) + 1;
}

// Public (or admin, seeing everything): list entries for a side.
entriesRouter.get('/', (req, res) => {
  const { side } = req.query;
  const isAdmin = !!currentSession(req);
  let sql = 'SELECT * FROM entries WHERE 1=1';
  const params = [];
  if (side === 'work' || side === 'lab') {
    sql += ' AND side = ?';
    params.push(side);
  }
  if (!isAdmin) {
    sql += " AND status = 'published'";
  }
  sql += ' ORDER BY entry_number ASC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((r) => serializeEntry(r, { includeDraftFields: isAdmin })));
});

// Admin-only: every entry, both sides, drafts included (Library screen).
entriesRouter.get('/library', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM entries ORDER BY updated_at DESC').all();
  res.json(rows.map((r) => serializeEntry(r, { includeDraftFields: true })));
});

entriesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const isAdmin = !!currentSession(req);
  if (row.status !== 'published' && !isAdmin) return res.status(404).json({ error: 'Not found' });
  res.json(serializeEntry(row, { includeDraftFields: isAdmin }));
});

entriesRouter.post('/', requireAdmin, (req, res) => {
  const { title = '', description = '', side } = req.body || {};
  if (side !== 'work' && side !== 'lab') return res.status(400).json({ error: 'side must be work or lab' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO entries (id, side, status, visibility, title, description, entry_number)
    VALUES (?, ?, 'draft', 'public', ?, ?, ?)
  `).run(id, side, title, description, nextEntryNumber(side));
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  res.status(201).json(serializeEntry(row, { includeDraftFields: true }));
});

const PATCHABLE = ['title', 'description', 'side', 'visibility', 'year', 'stack', 'model', 'seed'];

entriesRouter.patch('/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const updates = {};
  for (const key of PATCHABLE) {
    if (key in (req.body || {})) updates[key] = req.body[key];
  }
  if (updates.side && updates.side !== row.side) {
    updates.entry_number = nextEntryNumber(updates.side);
  }
  const cols = Object.keys(updates);
  if (cols.length === 0) return res.json(serializeEntry(row, { includeDraftFields: true }));
  const setClause = cols.map((c) => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE entries SET ${setClause}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...updates, id: req.params.id });
  const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  res.json(serializeEntry(updated, { includeDraftFields: true }));
});

entriesRouter.post('/:id/publish', requireAdmin, (req, res) => {
  const result = db.prepare("UPDATE entries SET status = 'published', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  res.json(serializeEntry(row, { includeDraftFields: true }));
});

entriesRouter.post('/:id/unpublish', requireAdmin, (req, res) => {
  const result = db.prepare("UPDATE entries SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  res.json(serializeEntry(row, { includeDraftFields: true }));
});

entriesRouter.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});
