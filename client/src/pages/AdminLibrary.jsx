import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import styles from './AdminLibrary.module.css';

const FILTERS = [
  ['all', 'ALL'],
  ['work', 'WORK'],
  ['lab', 'LAB'],
  ['draft', 'DRAFTS'],
];

function formatUpdated(iso) {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
}

export default function AdminLibrary() {
  const [entries, setEntries] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => api.listLibrary().then(setEntries).catch(() => setEntries([]));
  useEffect(() => { load(); }, []);

  if (!entries) return null;

  const counts = {
    all: entries.length,
    work: entries.filter((e) => e.side === 'work').length,
    lab: entries.filter((e) => e.side === 'lab').length,
    draft: entries.filter((e) => e.status === 'draft').length,
  };
  const rows = entries.filter((e) => filter === 'all' || (filter === 'draft' ? e.status === 'draft' : e.side === filter));

  const togglePublish = async (row) => {
    if (row.status === 'draft') await api.publishEntry(row.id);
    else await api.unpublishEntry(row.id);
    load();
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This can't be undone.`)) return;
    await api.deleteEntry(row.id);
    load();
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>ADMIN / LIBRARY</div>
          <h1 className={styles.h1}>Everything you&rsquo;ve uploaded</h1>
        </div>
        <div className={styles.actions}>
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              className={filter === id ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
              onClick={() => setFilter(id)}
            >
              {label} <span className={styles.filterCount}>{counts[id]}</span>
            </button>
          ))}
          <Link to="/admin/upload" className={styles.newBtn}>+ NEW ENTRY</Link>
        </div>
      </div>

      <div className={styles.tableHead}>
        <span>FRAME</span><span>TITLE</span><span>SIDE</span><span>STATUS</span><span>UPDATED</span>
        <span className={styles.right}>ACTIONS</span>
      </div>

      {rows.map((row) => (
        <div key={row.id} className={`${styles.row} ${row.status === 'draft' ? styles.rowDraft : ''}`}>
          <div className={styles.thumb}>
            <div className={styles.playBadge}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#f4f2ec"><path d="M9 5.5v13l10-6.5z" /></svg>
            </div>
          </div>
          <div>
            <div className={styles.title}>{row.title || 'Untitled'}</div>
            <div className={styles.meta}>{(row.stack || row.model || '—')}{row.year ? ` · ${row.year}` : ''}</div>
          </div>
          <span className={row.side === 'lab' ? styles.sideLab : styles.sideWork}>{row.side.toUpperCase()}</span>
          <span className={row.status === 'draft' ? styles.statusDraft : styles.statusPublished}>
            {row.status.toUpperCase()}{row.visibility === 'signin' ? ' · SIGN-IN' : ''}
          </span>
          <span className={styles.updated}>{formatUpdated(row.updatedAt)}</span>
          <div className={styles.rowActions}>
            <Link to={`/admin/entries/${row.id}/edit`} className={styles.actionBtn}>EDIT</Link>
            <button
              className={row.status === 'draft' ? styles.actionBtnFilled : styles.actionBtn}
              onClick={() => togglePublish(row)}
            >
              {row.status === 'draft' ? 'PUBLISH' : 'UNPUBLISH'}
            </button>
            <button className={styles.deleteBtn} onClick={() => remove(row)}>&#10005;</button>
          </div>
        </div>
      ))}

      <div className={styles.footNote}>
        {counts.draft} draft{counts.draft === 1 ? '' : 's'} not visible to the public · {counts.all} entries total
      </div>
    </div>
  );
}
