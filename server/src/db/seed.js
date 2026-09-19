import { db } from './index.js';
import { v4 as uuidv4 } from 'uuid';

// Seed data ports the content the user worked out with the design assistant
// (see /chats/chat1.md and the approved v4 mockup) into real rows. Video/poster
// files are intentionally left empty — no source media was provided yet; drop
// real footage in later through the admin upload flow.

const WORK = [
  { title: 'GNS3 Industrial Network', description: 'Multi-site OT/IT topology with segmented VLANs, a historian DMZ and simulated Modbus traffic.', stack: 'GNS3 · pfSense', year: '2026', file_label: 'topology-report.pdf', chapters: [
    { t: '00:00', label: 'Topology and addressing plan' },
    { t: '02:11', label: 'Firewall policy between zones' },
    { t: '04:38', label: 'Packet capture and anomalies' },
  ] },
  { title: 'SCADA Hardening', description: 'Defence-in-depth for RTUs and supervisory control, aligned to IEC 62443.', stack: 'Suricata · IEC 62443', year: '2025', file_label: 'hardening-report.pdf', chapters: [
    { t: '00:00', label: 'Threat model and asset inventory' },
    { t: '01:35', label: 'Network segmentation zones' },
    { t: '03:10', label: 'IDS tuning and alerting' },
  ] },
  { title: 'OSPF / BGP Failover', description: 'Dual-stack routing across two sites with traffic engineering and link-failure drills.', stack: 'FRRouting · NetBox', year: '2025', file_label: 'routing-diagram.pdf', chapters: [
    { t: '00:00', label: 'Site topology and peering plan' },
    { t: '02:40', label: 'Traffic engineering policy' },
    { t: '05:20', label: 'Simulated link failure' },
  ] },
  { title: 'Pump Telemetry Pipeline', description: 'PLC telemetry ingestion with threshold alerting and Grafana dashboards.', stack: 'Node-RED · InfluxDB', year: '2024', file_label: 'pipeline-notes.pdf', chapters: [
    { t: '00:00', label: 'PLC tag mapping' },
    { t: '01:20', label: 'Ingestion and alert thresholds' },
    { t: '02:35', label: 'Dashboard walkthrough' },
  ] },
];

const LAB = [
  { title: 'Drift Study No. 4', description: 'Three coastline seeds interpolated over 120 frames, graded to 16mm stock.', model: 'SVD 1.1 · 24FPS', seed: 'SEED 88412', file_label: 'prompt-sheet.pdf', chapters: [
    { t: '00:00', label: 'Seed frame and prompt' },
    { t: '00:24', label: 'Interpolation pass' },
    { t: '00:58', label: 'Grade and grain' },
  ] },
  { title: 'Refinery Dreams', description: 'Night photography of a gas plant, re-run frame by frame through img2vid.', model: 'RUNWAY GEN-3', seed: 'SEED 30097', file_label: 'prompt-sheet.pdf', chapters: [
    { t: '00:00', label: 'Source photography' },
    { t: '00:40', label: 'Frame-by-frame img2vid pass' },
    { t: '01:50', label: 'Grade and sound' },
  ] },
  { title: 'Flare Stack Loop', description: 'A four-second loop, upscaled and time-remapped to breathe.', model: 'SVD 1.1 · UPSCALED', seed: 'SEED 11720', file_label: 'prompt-sheet.pdf', chapters: [
    { t: '00:00', label: 'Source loop' },
    { t: '00:02', label: 'Upscale pass' },
    { t: '00:03', label: 'Time-remap' },
  ] },
  { title: 'Sonar Garden', description: 'Depth-map conditioning driven by a recorded sonar sweep.', model: 'SD + CONTROLNET', seed: 'SEED 60533', file_label: 'prompt-sheet.pdf', chapters: [
    { t: '00:00', label: 'Sonar sweep capture' },
    { t: '00:45', label: 'Depth-map conditioning' },
    { t: '01:20', label: 'ControlNet render' },
  ] },
];

const insert = db.prepare(`
  INSERT INTO entries (id, side, status, visibility, title, description, entry_number, year, stack, model, seed, chapters_json, file_label)
  VALUES (@id, @side, @status, @visibility, @title, @description, @entry_number, @year, @stack, @model, @seed, @chapters_json, @file_label)
`);

const seedAll = db.transaction(() => {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM entries').get().n;
  if (existing > 0) {
    console.log('Entries already exist, skipping seed.');
    return;
  }
  WORK.forEach((p, i) => {
    insert.run({
      id: uuidv4(), side: 'work', status: i === 3 ? 'draft' : 'published', visibility: 'public',
      title: p.title, description: p.description, entry_number: i + 1, year: p.year,
      stack: p.stack, model: null, seed: null,
      chapters_json: JSON.stringify(p.chapters), file_label: p.file_label,
    });
  });
  LAB.forEach((l, i) => {
    insert.run({
      id: uuidv4(), side: 'lab', status: i === 3 ? 'published' : 'published', visibility: i === 3 ? 'signin' : 'public',
      title: l.title, description: l.description, entry_number: i + 1, year: '2026',
      stack: null, model: l.model, seed: l.seed,
      chapters_json: JSON.stringify(l.chapters), file_label: l.file_label,
    });
  });
  console.log(`Seeded ${WORK.length} Work entries and ${LAB.length} Lab entries.`);
});

seedAll();
