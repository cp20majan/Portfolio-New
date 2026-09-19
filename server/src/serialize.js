export function serializeEntry(row, { includeDraftFields = false } = {}) {
  const out = {
    id: row.id,
    side: row.side,
    status: row.status,
    visibility: row.visibility,
    title: row.title,
    description: row.description,
    entryNumber: row.entry_number,
    year: row.year,
    stack: row.stack,
    model: row.model,
    seed: row.seed,
    chapters: JSON.parse(row.chapters_json || '[]'),
    videoStatus: row.video_status,
    videoUrl: row.video_path ? `/uploads/video/${row.video_path}` : null,
    videoDurationSeconds: row.video_duration_seconds,
    videoWidth: row.video_width,
    videoHeight: row.video_height,
    posterUrl: row.poster_path ? `/uploads/poster/${row.poster_path}` : null,
    fileUrl: row.file_path ? `/uploads/files/${row.file_path}` : null,
    fileLabel: row.file_label,
    updatedAt: row.updated_at,
  };
  if (includeDraftFields) {
    out.createdAt = row.created_at;
  }
  return out;
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return null;
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
