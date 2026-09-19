import { spawn } from 'node:child_process';

export function probe(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      filePath,
    ];
    const proc = spawn('ffprobe', args);
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { err += d; });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited ${code}: ${err}`));
      try {
        const parsed = JSON.parse(out);
        const stream = parsed.streams?.[0] || {};
        resolve({
          width: stream.width || null,
          height: stream.height || null,
          durationSeconds: Number(parsed.format?.duration) || null,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Transcode to a web-friendly H.264/AAC mp4, calling onProgress(fraction 0..1) as it runs.
 */
export function transcode(inputPath, outputPath, durationSeconds, onProgress) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', "scale='min(1920,iw)':-2",
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart',
      '-progress', 'pipe:1',
      '-nostats',
      outputPath,
    ];
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/out_time_ms=(\d+)/);
      if (match && durationSeconds > 0) {
        const outSeconds = Number(match[1]) / 1_000_000;
        onProgress(Math.min(1, outSeconds / durationSeconds));
      }
      if (text.includes('progress=end')) onProgress(1);
    });
    proc.stderr.on('data', (d) => { stderr += d.toString().slice(-4000); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
      resolve();
    });
  });
}

export function extractFrame(inputPath, timestampSeconds, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-ss', String(Math.max(0, timestampSeconds)),
      '-i', inputPath,
      '-frames:v', '1',
      '-q:v', '3',
      outputPath,
    ];
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString().slice(-4000); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg frame extract exited ${code}: ${stderr}`));
      resolve();
    });
  });
}
