import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './Entry.module.css';

function timeToSeconds(t) {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
}

export default function Entry() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setEntry(null);
    setNotFound(false);
    api.getEntry(id).then(setEntry).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <p>That entry isn&rsquo;t here.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }
  if (!entry) return null;

  const side = entry.side;
  const backLabel = side === 'lab' ? 'BACK TO LAB' : 'BACK TO WORK';
  const backTo = side === 'lab' ? '/lab' : '/work';
  const eyebrow = side === 'lab'
    ? `LAB · ${entry.seed || ''} · ${entry.model || ''}`.replace(/ · $/, '')
    : `WORK · ${(entry.stack || '').toUpperCase()}`;

  const spec = side === 'lab'
    ? [['MODEL', entry.model], ['SEED', (entry.seed || '').replace('SEED ', '')], ['RUNTIME', durationLabel(entry)], ['YEAR', entry.year]]
    : [['YEAR', entry.year], ['TYPE', 'Academic'], ['STACK', entry.stack], ['RUNTIME', durationLabel(entry)]];

  const unpublish = async () => {
    await api.unpublishEntry(entry.id);
    navigate(backTo);
  };

  return (
    <>
      <div className={styles.topBar}>
        <Link to={backTo} className={styles.back}>&larr; {backLabel}</Link>
        {isAdmin && (
          <span className={styles.adminActions}>
            <Link to={`/admin/entries/${entry.id}/edit`} className={styles.editBtn}>EDIT</Link>
            <button className={styles.unpublishBtn} onClick={unpublish}>
              {entry.status === 'published' ? 'UNPUBLISH' : 'PUBLISH'}
            </button>
          </span>
        )}
      </div>

      <div className={styles.head}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h1 className={styles.title}>{entry.title}</h1>
        <p className={styles.desc}>{entry.description}</p>
      </div>

      <div className={entry.videoUrl ? styles.heroVideo : styles.hero}>
        {entry.videoUrl ? (
          <video
            ref={videoRef}
            className={styles.video}
            src={entry.videoUrl}
            poster={entry.posterUrl || undefined}
            controls
          />
        ) : (
          <ImageSlot src={entry.posterUrl} label="No footage yet" />
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <div className={styles.sectionHead}>CHAPTERS</div>
          {entry.chapters.map((c, i) => (
            <button
              key={i}
              className={styles.chapter}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = timeToSeconds(c.t);
                  videoRef.current.play();
                }
              }}
            >
              <span className={styles.chapterTime}>{c.t}</span>
              <span className={styles.chapterLabel}>{c.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.right}>
          <div className={styles.sectionHead}>SPEC</div>
          {spec.map(([k, v]) => (
            <div key={k} className={styles.specRow}>
              <span>{k}</span><span>{v || '—'}</span>
            </div>
          ))}
          <div className={styles.sectionHead} style={{ marginTop: 22 }}>FILES</div>
          {entry.fileUrl ? (
            <a href={entry.fileUrl} target="_blank" rel="noreferrer" className={styles.fileRow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dd4327" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M13 2.5H6.5A1.5 1.5 0 005 4v16a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 20V8.5z" />
                <path d="M13 2.5V8.5H19" />
              </svg>
              {entry.fileLabel}
            </a>
          ) : (
            <div className={styles.fileRowEmpty}>No report uploaded yet</div>
          )}
        </div>
      </div>

      <Footer note={side === 'lab' ? 'LAB · GENERATIVE VIDEO' : 'WORK · ACADEMIC & INDUSTRIAL'} />
    </>
  );
}

function durationLabel(entry) {
  if (!entry.videoDurationSeconds) return '—';
  const s = Math.round(entry.videoDurationSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
