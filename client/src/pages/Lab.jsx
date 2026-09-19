import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './Lab.module.css';

function formatDuration(totalSeconds) {
  if (!totalSeconds) return null;
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function Lab() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    api.listEntries('lab').then(setEntries).catch(() => setEntries([]));
  }, []);

  return (
    <>
      <div className={styles.masthead}>
        <div className={styles.eyebrow}>02 / LAB · GENERATIVE VIDEO</div>
        <h1 className={styles.h1}>Loops, seeds<br />&amp; <i className={styles.italic}>drift</i></h1>
        <p className={styles.lede}>
          Experiments with image-to-video models — every piece posted with its seed, prompt and
          model version. Nothing here is coursework; it&rsquo;s the other half of the brain.
        </p>
      </div>

      <div className={styles.wall}>
        {(entries || []).map((l, i) => (
          <Link key={l.id} to={`/lab/${l.id}`} className={styles.card}>
            <div className={styles.frame} style={{ height: i % 2 === 0 ? 270 : 220 }}>
              <ImageSlot src={l.posterUrl} />
              <div className={styles.seedChip}>{l.seed}</div>
              <div className={styles.playBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f4f2ec"><path d="M9 5.5v13l10-6.5z" /></svg>
              </div>
              {formatDuration(l.videoDurationSeconds) && (
                <span className={styles.dur}>{formatDuration(l.videoDurationSeconds)}</span>
              )}
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{l.title}</h3>
              <p className={styles.desc}>{l.description}</p>
              <span className={styles.model}>{l.model}</span>
            </div>
          </Link>
        ))}
      </div>

      <Footer note="LAB · GENERATIVE VIDEO" />
    </>
  );
}
