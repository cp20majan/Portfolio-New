import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './Landing.module.css';

export default function Landing() {
  const [counts, setCounts] = useState({ work: null, lab: null });

  useEffect(() => {
    api.listEntries('work').then((rows) => setCounts((c) => ({ ...c, work: rows.length }))).catch(() => {});
    api.listEntries('lab').then((rows) => setCounts((c) => ({ ...c, lab: rows.length }))).catch(() => {});
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
            <ImageSlot />
            <div className={styles.doorChip} style={{ background: 'var(--ink)' }}>01 / ACADEMIC</div>
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
            <ImageSlot />
            <div className={styles.doorChip} style={{ background: 'var(--accent-text)' }}>02 / GENERATIVE</div>
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
