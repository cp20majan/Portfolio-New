import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ImageSlot from '../components/ImageSlot';
import styles from './AdminUpload.module.css';

const STEP_LABELS = ['DROP', 'UPLOAD', 'DETAILS', 'LIVE'];

export default function AdminUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const reportInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [entry, setEntry] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState('UPLOADING');
  const [posterCandidates, setPosterCandidates] = useState([]);
  const [posterIndex, setPosterIndex] = useState(null);
  const [customThumbUrl, setCustomThumbUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState('work');
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(0); setEntry(null); setFileMeta(null); setPct(0); setPhase('UPLOADING');
    setPosterCandidates([]); setPosterIndex(null); setCustomThumbUrl(null); setTitle(''); setDescription('');
    setSide('work'); setVisibility('public'); setError(null);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setFileMeta({ name: file.name, size: file.size });
    setStep(1);
    setPhase('UPLOADING');
    setPct(0);
    try {
      const created = await api.createEntry({ title: file.name.replace(/\.[^.]+$/, ''), description: '', side: 'work' });
      setEntry(created);
      setTitle(created.title);

      const { jobId } = await api.uploadVideo(created.id, file, (fraction) => {
        setPct(Math.round(fraction * 50));
      });

      setPhase('TRANSCODING 1080P');
      await pollJob(jobId);
    } catch (err) {
      setError(err.message);
      setStep(0);
    }
  };

  const pollJob = (jobId) => new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const job = await api.pollJob(jobId);
        if (job.phase === 'transcoding') { setPhase('TRANSCODING 1080P'); setPct(50 + Math.round(job.pct * 0.4)); }
        else if (job.phase === 'finalising') { setPhase('FINALISING'); setPct(90 + Math.round(job.pct * 0.1)); }
        else if (job.phase === 'failed') { reject(new Error(job.error || 'Transcode failed')); return; }
        else if (job.phase === 'done') {
          setPct(100);
          setPosterCandidates(job.posterCandidates || []);
          setStep(2);
          resolve();
          return;
        }
        setTimeout(tick, 500);
      } catch (err) {
        reject(err);
      }
    };
    tick();
  });

  const pickPoster = async (candidate) => {
    setPosterIndex(candidate.index);
    setCustomThumbUrl(null);
    try {
      await api.selectPoster(entry.id, candidate.index);
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadThumbnail = async (file) => {
    if (!file || !entry) return;
    setError(null);
    try {
      const updated = await api.uploadThumbnail(entry.id, file);
      setCustomThumbUrl(updated.posterUrl);
      setPosterIndex(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const attachReport = async (file) => {
    if (!file || !entry) return;
    try {
      await api.uploadReport(entry.id, file);
    } catch (err) {
      setError(err.message);
    }
  };

  const persistDetails = () => api.patchEntry(entry.id, { title, description, side, visibility });

  const publish = async () => {
    setSaving(true);
    setError(null);
    try {
      await persistDetails();
      await api.publishEntry(entry.id);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      await persistDetails();
      navigate('/admin/library');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sideLabel = side === 'lab' ? 'LAB' : 'WORK';

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>ADMIN / NEW ENTRY</div>
          <h1 className={styles.h1}>Upload</h1>
        </div>
        <div className={styles.steps}>
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={i === step ? styles.stepActive : i < step ? styles.stepDone : styles.stepPending}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {step === 0 && (
        <div
          className={dragging ? `${styles.drop} ${styles.dropActive}` : styles.drop}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dd4327" strokeWidth="1.6" strokeLinejoin="round" style={{ marginBottom: 14 }}>
            <rect x="2.5" y="5.5" width="13" height="13"></rect>
            <path d="M15.5 10.5l6-3.4v9.8l-6-3.4z"></path>
          </svg>
          <div className={styles.dropTitle}>{dragging ? 'Release' : 'Drop footage'}</div>
          <p className={styles.dropHint}>MP4 · MOV · WEBM — UP TO 2 GB<br />or attach a PDF report and stills afterwards</p>
          <span className={styles.browseBtn}>BROWSE FILES</span>
        </div>
      )}

      {step === 1 && (
        <div className={styles.uploading}>
          <div className={styles.uploadingTop}>
            <div className={styles.uploadingThumb}>
              <div className={styles.playBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f4f2ec"><path d="M9 5.5v13l10-6.5z" /></svg>
              </div>
            </div>
            <div className={styles.uploadingInfo}>
              <div className={styles.uploadingName}>{fileMeta?.name}</div>
              <div className={styles.uploadingMeta}>{fileMeta ? `${(fileMeta.size / 1024 / 1024).toFixed(0)} MB` : ''}</div>
            </div>
            <span className={styles.pctLabel}>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.uploadingFoot}>
            <span className={styles.phase}>{phase}</span>
            <span>RUNS IN THE BACKGROUND</span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.details}>
          <div className={styles.posterCol}>
            <div className={styles.posterFrame}>
              <ImageSlot src={customThumbUrl || posterCandidates.find((c) => c.index === posterIndex)?.url} label="Pick a poster frame" />
            </div>
            <div className={styles.candidates}>
              {posterCandidates.map((c) => (
                <button
                  key={c.index}
                  className={posterIndex === c.index ? `${styles.candidate} ${styles.candidateActive}` : styles.candidate}
                  style={{ backgroundImage: `url(${c.url})` }}
                  onClick={() => pickPoster(c)}
                >
                  {formatTs(c.timestampSeconds)}
                </button>
              ))}
            </div>
            <div className={styles.posterHint}>SELECT POSTER FRAME, OR UPLOAD YOUR OWN</div>

            <div className={styles.reportRow}>
              <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={(e) => uploadThumbnail(e.target.files?.[0])} />
              <button type="button" className={styles.reportBtn} onClick={() => thumbnailInputRef.current?.click()}>
                UPLOAD THUMBNAIL IMAGE
              </button>
            </div>

            <div className={styles.reportRow}>
              <input ref={reportInputRef} type="file" accept="application/pdf" hidden
                onChange={(e) => attachReport(e.target.files?.[0])} />
              <button type="button" className={styles.reportBtn} onClick={() => reportInputRef.current?.click()}>
                ATTACH PDF REPORT
              </button>
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>TITLE</label>
              <input className={styles.titleInput} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>DESCRIPTION · MARKDOWN</label>
              <textarea className={styles.textarea} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={styles.rowFields}>
              <div>
                <label className={styles.label}>WHICH SIDE?</label>
                <div className={styles.toggle}>
                  <button
                    className={side === 'work' ? `${styles.toggleBtn} ${styles.toggleBtnActiveWork}` : styles.toggleBtn}
                    onClick={() => setSide('work')}
                  >WORK</button>
                  <button
                    className={side === 'lab' ? `${styles.toggleBtn} ${styles.toggleBtnActiveLab}` : styles.toggleBtn}
                    onClick={() => setSide('lab')}
                  >LAB</button>
                </div>
              </div>
              <div>
                <label className={styles.label}>VISIBILITY</label>
                <div className={styles.toggle}>
                  <button
                    className={visibility === 'public' ? `${styles.toggleBtn} ${styles.toggleBtnActiveWork}` : styles.toggleBtn}
                    onClick={() => setVisibility('public')}
                  >PUBLIC</button>
                  <button
                    className={visibility === 'signin' ? `${styles.toggleBtn} ${styles.toggleBtnActiveLab}` : styles.toggleBtn}
                    onClick={() => setVisibility('signin')}
                  >SIGN-IN</button>
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.publishBtn} onClick={publish} disabled={saving}>
                PUBLISH TO {sideLabel}
              </button>
              <button className={styles.draftBtn} onClick={saveDraft} disabled={saving}>SAVE DRAFT</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.done}>
          <div className={styles.doneIcon}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#f4f2ec" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5.5 5.5L20 7" />
            </svg>
          </div>
          <div className={styles.doneTitle}>Published to {sideLabel}</div>
          <p className={styles.doneSub}>{title} — live now.</p>
          <div className={styles.doneActions}>
            <button className={styles.publishBtn} onClick={() => navigate(side === 'lab' ? '/lab' : '/work')}>
              VIEW {sideLabel}
            </button>
            <button className={styles.draftBtn} onClick={reset}>UPLOAD ANOTHER</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTs(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
