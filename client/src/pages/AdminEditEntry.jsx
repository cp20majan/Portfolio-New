import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import ImageSlot from '../components/ImageSlot';
import styles from './AdminEditEntry.module.css';

export default function AdminEditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoInputRef = useRef(null);
  const reportInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [entry, setEntry] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState('work');
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const [uploadPct, setUploadPct] = useState(null);
  const [uploadPhase, setUploadPhase] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const load = () => api.getEntry(id).then((e) => {
    setEntry(e);
    setTitle(e.title);
    setDescription(e.description);
    setSide(e.side);
    setVisibility(e.visibility);
  }).catch((err) => setError(err.message));

  useEffect(() => { load(); }, [id]);

  if (!entry) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patchEntry(id, { title, description, side, visibility });
      setEntry(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${entry.title}"? This can't be undone.`)) return;
    await api.deleteEntry(id);
    navigate('/admin/library');
  };

  const replaceVideo = async (file) => {
    if (!file) return;
    setUploadPct(0);
    setUploadPhase('UPLOADING');
    setError(null);
    try {
      const { jobId } = await api.uploadVideo(id, file, (fraction) => setUploadPct(Math.round(fraction * 50)));
      setUploadPhase('TRANSCODING 1080P');
      await new Promise((resolve, reject) => {
        const tick = async () => {
          try {
            const job = await api.pollJob(jobId);
            if (job.phase === 'transcoding') { setUploadPct(50 + Math.round(job.pct * 0.4)); }
            else if (job.phase === 'finalising') { setUploadPhase('FINALISING'); setUploadPct(90 + Math.round(job.pct * 0.1)); }
            else if (job.phase === 'failed') { reject(new Error(job.error || 'Transcode failed')); return; }
            else if (job.phase === 'done') {
              setUploadPct(100);
              setCandidates(job.posterCandidates || []);
              resolve();
              return;
            }
            setTimeout(tick, 500);
          } catch (err) { reject(err); }
        };
        tick();
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadPhase(null);
      setUploadPct(null);
    }
  };

  const regenerateCandidates = async () => {
    try {
      const { posterCandidates } = await api.regeneratePosterCandidates(id);
      setCandidates(posterCandidates);
    } catch (err) {
      setError(err.message);
    }
  };

  const pickPoster = async (candidate) => {
    try {
      const updated = await api.selectPoster(id, candidate.index);
      setEntry(updated);
      setCandidates([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadThumbnail = async (file) => {
    if (!file) return;
    setError(null);
    try {
      const updated = await api.uploadThumbnail(id, file);
      setEntry(updated);
      setCandidates([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const attachReport = async (file) => {
    if (!file) return;
    try {
      const updated = await api.uploadReport(id, file);
      setEntry(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <Link to="/admin/library" className={styles.back}>&larr; BACK TO LIBRARY</Link>
        <button className={styles.deleteBtn} onClick={remove}>DELETE ENTRY</button>
      </div>

      <div className={styles.eyebrow}>ADMIN / EDIT ENTRY</div>
      <h1 className={styles.h1}>{entry.title || 'Untitled'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <div className={styles.mediaCol}>
          <div className={styles.posterFrame}>
            <ImageSlot src={entry.posterUrl} label="No poster yet" />
          </div>

          <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={(e) => uploadThumbnail(e.target.files?.[0])} />
          <button className={styles.secondaryBtn} onClick={() => thumbnailInputRef.current?.click()}>
            UPLOAD THUMBNAIL IMAGE
          </button>

          {uploadPct !== null ? (
            <div className={styles.progressBox}>
              <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${uploadPct}%` }} /></div>
              <div className={styles.progressLabel}>{uploadPhase} · {uploadPct}%</div>
            </div>
          ) : (
            <>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska" hidden
                onChange={(e) => replaceVideo(e.target.files?.[0])} />
              <button className={styles.secondaryBtn} onClick={() => videoInputRef.current?.click()}>
                {entry.videoUrl ? 'REPLACE VIDEO' : 'UPLOAD VIDEO'}
              </button>
            </>
          )}

          {entry.videoUrl && candidates.length === 0 && (
            <button className={styles.secondaryBtn} onClick={regenerateCandidates}>PICK FRAME FROM VIDEO</button>
          )}

          {candidates.length > 0 && (
            <div className={styles.candidates}>
              {candidates.map((c) => (
                <button key={c.index} className={styles.candidate} style={{ backgroundImage: `url(${c.url})` }} onClick={() => pickPoster(c)} />
              ))}
            </div>
          )}

          <input ref={reportInputRef} type="file" accept="application/pdf" hidden
            onChange={(e) => attachReport(e.target.files?.[0])} />
          <button className={styles.secondaryBtn} onClick={() => reportInputRef.current?.click()}>
            {entry.fileUrl ? `REPLACE REPORT (${entry.fileLabel})` : 'ATTACH PDF REPORT'}
          </button>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>TITLE</label>
            <input className={styles.titleInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>DESCRIPTION</label>
            <textarea className={styles.textarea} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className={styles.rowFields}>
            <div>
              <label className={styles.label}>WHICH SIDE?</label>
              <div className={styles.toggle}>
                <button className={side === 'work' ? `${styles.toggleBtn} ${styles.toggleBtnActiveWork}` : styles.toggleBtn} onClick={() => setSide('work')}>WORK</button>
                <button className={side === 'lab' ? `${styles.toggleBtn} ${styles.toggleBtnActiveLab}` : styles.toggleBtn} onClick={() => setSide('lab')}>LAB</button>
              </div>
            </div>
            <div>
              <label className={styles.label}>VISIBILITY</label>
              <div className={styles.toggle}>
                <button className={visibility === 'public' ? `${styles.toggleBtn} ${styles.toggleBtnActiveWork}` : styles.toggleBtn} onClick={() => setVisibility('public')}>PUBLIC</button>
                <button className={visibility === 'signin' ? `${styles.toggleBtn} ${styles.toggleBtnActiveLab}` : styles.toggleBtn} onClick={() => setVisibility('signin')}>SIGN-IN</button>
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
            {savedAt && <span className={styles.savedNote}>Saved</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
