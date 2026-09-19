import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import styles from './NavBar.module.css';

function formatBytes(bytes) {
  if (!bytes) return '0.0 GB';
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function NavBar() {
  const { isAdmin, session, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ draftCount: 0, storageBytes: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    api.adminStats().then(setStats).catch(() => {});
  }, [isAdmin]);

  const navClass = ({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink);
  const labNavClass = ({ isActive }) => (isActive ? `${styles.navLink} ${styles.labLinkActive}` : styles.navLink);

  return (
    <>
      {isAdmin && (
        <div className={styles.adminBar}>
          <span className={styles.adminBarLabel}>ADMIN SESSION · {session.email}</span>
          <span className={styles.adminBarActions}>
            <button className={styles.adminBarBtn} onClick={() => navigate('/admin/library')}>
              LIBRARY{stats.draftCount ? ` · ${stats.draftCount} DRAFT` : ''}
            </button>
            <span>STORAGE {formatBytes(stats.storageBytes)}</span>
            <button className={styles.adminBarSignOut} onClick={() => logout().then(() => navigate('/'))}>
              SIGN OUT
            </button>
            <button className={styles.adminBarNew} onClick={() => navigate('/admin/upload')}>
              + NEW ENTRY
            </button>
          </span>
        </div>
      )}
      <div className={styles.mainNav}>
        <NavLink to="/" className={styles.logo}>CP Majan</NavLink>
        <div className={styles.links}>
          <NavLink to="/work" className={navClass}>WORK</NavLink>
          <NavLink to="/lab" className={labNavClass}>LAB</NavLink>
          <NavLink to="/about" className={navClass}>ABOUT</NavLink>
          <a className={styles.contact} href="mailto:cp@majan.dev">CONTACT</a>
        </div>
        {isAdmin ? (
          <span className={styles.adminBadge}>ADMIN</span>
        ) : (
          <NavLink to="/admin/login" className={styles.signIn}>SIGN IN</NavLink>
        )}
      </div>
    </>
  );
}
