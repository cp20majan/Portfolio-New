import ImageSlot from '../components/ImageSlot';
import Footer from '../components/Footer';
import styles from './About.module.css';

const COLUMNS = [
  {
    head: 'EDUCATION',
    rows: [
      { k: 'BSc Computing', v: '2023—2027' },
      { k: 'Oil & gas systems', v: 'SPECIALISM' },
      { k: 'Cisco CCNA', v: 'IN PROGRESS' },
      { k: 'GIAC GICSP', v: 'PLANNED' },
    ],
  },
  {
    head: 'FOCUS',
    rows: [
      { k: 'Industrial networking', v: 'OT/IT' },
      { k: 'ICS security', v: 'IEC 62443' },
      { k: 'Automation', v: 'PLC · SCADA' },
      { k: 'Generative video', v: 'PRACTICE' },
    ],
  },
  {
    head: 'TOOLING',
    rows: [
      { k: 'GNS3 · pfSense', v: 'LAB' },
      { k: 'Wireshark · Suricata', v: 'ANALYSIS' },
      { k: 'Node-RED · Grafana', v: 'TELEMETRY' },
      { k: 'SVD · ControlNet', v: 'LAB/VIDEO' },
    ],
  },
];

export default function About() {
  return (
    <>
      <div className={styles.top}>
        <div className={styles.left}>
          <div className={styles.eyebrow}>ABOUT · CP MAJAN</div>
          <h1 className={styles.h1}>
            A computing student with one foot in the plant room and one in the render queue
          </h1>
          <p className={styles.p}>
            I study computing with a focus on oil &amp; gas digital systems — networking,
            industrial automation and the security of the control systems that sit between them.
            Most of what I learn I rebuild in a lab and record, because a topology diagram never
            shows you what actually broke.
          </p>
          <p className={styles.p}>
            The other half of this site is generative video. It started as a way to make the
            industrial imagery I was photographing move, and turned into its own practice. It
            shares nothing with the coursework except my attention — which is why it has its own
            door.
          </p>
        </div>
        <div className={styles.portrait}>
          <ImageSlot />
        </div>
      </div>

      <div className={styles.columns}>
        {COLUMNS.map((col) => (
          <div key={col.head} className={styles.column}>
            <div className={styles.colHead}>{col.head}</div>
            {col.rows.map((r) => (
              <div key={r.k} className={styles.colRow}>
                <span>{r.k}</span><span>{r.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.contact}>
        <div className={styles.contactTitle}>Want the long version? <i className={styles.italic}>Ask.</i></div>
        <div className={styles.contactActions}>
          <a href="mailto:cp@majan.dev" className={styles.emailBtn}>EMAIL ME</a>
          <a href="/cv.pdf" className={styles.cvBtn}>DOWNLOAD CV</a>
        </div>
      </div>

      <Footer note="TWO TRACKS, KEPT APART" />
    </>
  );
}
