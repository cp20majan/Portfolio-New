import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './Landing.module.css';

function DoorImageUpload({ assetKey, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await api.uploadSiteAsset(assetKey, file);
      onUploaded(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.doorImageUpload}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleChange}
      />
      <button
        type="button"
        className={styles.doorImageUploadBtn}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {busy ? 'UPLOADING…' : 'UPLOAD IMAGE'}
      </button>
    </div>
  );
}

export default function Landing() {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState({ work: null, lab: null });
  const [assets, setAssets] = useState({});

  useEffect(() => {
    api.listEntries('work').then((rows) => setCounts((c) => ({ ...c, work: rows.length }))).catch(() => {});
    api.listEntries('lab').then((rows) => setCounts((c) => ({ ...c, lab: rows.length }))).catch(() => {});
    api.getSiteAssets().then(setAssets).catch(() => {});
  }, []);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>COMPUTING · OIL &amp; GAS DIGITAL SYSTEMS · 2026</div>
        <h1 className={styles.h1}>
          I build industrial networks,<br />and I make <i className={styles.italic}>machines dream</i>
        </h1>
        <p className={styles.lede}>
          Two bodies of work that don&rsquo;t belong in the same grid. On one side: OT/IT topologies,
          ICS security and automation, documented as recorded walkthroughs. On the other: generative
          video experiments, posted with their seeds and prompts. Pick a door.
        </p>
      </section>

      <div className={styles.doors}>
        <Link to="/work" className={styles.door}>
          <div className={styles.doorFrame}>
            <ImageSlot src={assets['door-work']} />
            <div className={styles.doorChip} style={{ background: 'var(--ink)' }}>01 / ACADEMIC</div>
            {isAdmin && (
              <DoorImageUpload
                assetKey="door-work"
                onUploaded={(url) => setAssets((a) => ({ ...a, 'door-work': url }))}
              />
            )}
          </div>
          <div className={styles.doorBody}>
            <div className={styles.doorHead}>
              <h2 className={styles.doorTitle}>Work</h2>
              <span className={styles.doorCount}>{counts.work === null ? '···' : `${counts.work} ENTRIES`}</span>
            </div>
            <p className={styles.doorBlurb}>
              OT/IT network design, ICS security and industrial automation — coursework and lab
              builds, each with a recorded walkthrough, project files and a written report.
            </p>
            <span className={styles.doorCta} style={{ color: 'var(--ink)', borderColor: 'var(--ink)' }}>
              ENTER WORK <span className={styles.arrow}>&rarr;</span>
            </span>
          </div>
        </Link>

        <Link to="/lab" className={styles.door}>
          <div className={styles.doorFrame}>
            <ImageSlot src={assets['door-lab']} />
            <div className={styles.doorChip} style={{ background: 'var(--accent-text)' }}>02 / GENERATIVE</div>
            {isAdmin && (
              <DoorImageUpload
                assetKey="door-lab"
                onUploaded={(url) => setAssets((a) => ({ ...a, 'door-lab': url }))}
              />
            )}
          </div>
          <div className={styles.doorBody}>
            <div className={styles.doorHead}>
              <h2 className={styles.doorTitle}>Lab</h2>
              <span className={styles.doorCount}>{counts.lab === null ? '···' : `${counts.lab} PIECES`}</span>
            </div>
            <p className={styles.doorBlurb}>
              Generative video experiments — image-to-video models, latent interpolation and loops,
              posted with their seeds, prompts and model versions.
            </p>
            <span className={styles.doorCta} style={{ color: 'var(--accent-text)', borderColor: 'var(--accent-text)' }}>
              ENTER LAB <span className={styles.arrow}>&rarr;</span>
            </span>
          </div>
        </Link>
      </div>

      <Footer note="TWO TRACKS, KEPT APART" />
    </>
  );
}
