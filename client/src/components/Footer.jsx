import styles from './Footer.module.css';

export default function Footer({ note }) {
  return (
    <div className={styles.footer}>
      <span>CP MAJAN · 2026</span>
      <span>{note}</span>
    </div>
  );
}
