import styles from './ImageSlot.module.css';

export default function ImageSlot({ src, alt = '', label, children }) {
  return (
    <div className={styles.slot}>
      {src ? (
        <img className={styles.img} src={src} alt={alt} />
      ) : (
        <div className={styles.empty}>{label && <span>{label}</span>}</div>
      )}
      {children}
    </div>
  );
}
