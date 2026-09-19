import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './Work.module.css';

function formatDuration(totalSeconds) {
  if (!totalSeconds) return '—';
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function Work() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    api.listEntries('work').then(setEntries).catch(() => setEntries([]));
  }, []);

  const totalFootage = (entries || []).reduce((sum, e) => sum + (e.videoDurationSeconds || 0), 0);
  const domains = new Set((entries || []).map((e) => e.stack).filter(Boolean)).size;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>01 / WORK · ACADEMIC &amp; INDUSTRIAL</div>
          <h1 className={styles.h1}>Networks, control<br />systems, security</h1>
          <p className={styles.lede}>
            Coursework and lab builds from the computing programme — each documented end to end
            with a recorded walkthrough, the project files, and a written report.
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stat}><span>ENTRIES</span><span>{entries ? entries.length : '···'}</span></div>
          <div className={styles.stat}><span>FOOTAGE</span><span>{formatDuration(totalFootage)}</span></div>
          <div className={styles.stat}><span>DOMAINS</span><span>{entries ? domains : '···'}</span></div>
          <Link to="/lab" className={styles.labLink}>
            Looking for the video art? <span className={styles.labLinkAccent}>GO TO LAB &rarr;</span>
          </Link>
        </div>
      </div>

      {(entries || []).map((p, i) => (
        <Link key={p.id} to={`/work/${p.id}`} className={styles.row}>
          <div className={styles.thumb} style={p.posterUrl ? { background: `url(${p.posterUrl}) center/cover` } : undefined}>
            <div className={styles.playBadge}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#f4f2ec"><path d="M9 5.5v13l10-6.5z" /></svg>
            </div>
            <span className={styles.thumbDur}>{p.videoDurationSeconds ? formatDuration(p.videoDurationSeconds) : '—'}</span>
          </div>
          <div>
            <div className={styles.rowTitle}>{p.title}</div>
            <div className={styles.rowMeta}>{`ENTRY 0${p.entryNumber}`} · {p.year}</div>
          </div>
          <span className={styles.rowDesc}>{p.description}</span>
          <span className={styles.rowStack}>{p.stack}</span>
          <span className={styles.rowDur}>{p.videoDurationSeconds ? formatDuration(p.videoDurationSeconds) : '—'}</span>
        </Link>
      ))}

      <Footer note="WORK · ACADEMIC & INDUSTRIAL" />
    </>
  );
}
