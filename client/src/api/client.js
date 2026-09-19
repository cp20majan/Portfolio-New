const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  listEntries: (side) => request(`/entries${side ? `?side=${side}` : ''}`),
  listLibrary: () => request('/entries/library'),
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (payload) => request('/entries', { method: 'POST', body: JSON.stringify(payload) }),
  patchEntry: (id, payload) => request(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  publishEntry: (id) => request(`/entries/${id}/publish`, { method: 'POST' }),
  unpublishEntry: (id) => request(`/entries/${id}/unpublish`, { method: 'POST' }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),

  selectPoster: (id, candidateIndex) =>
    request(`/entries/${id}/poster`, { method: 'POST', body: JSON.stringify({ candidateIndex }) }),
  regeneratePosterCandidates: (id) => request(`/entries/${id}/poster/candidates`, { method: 'POST' }),

  uploadReport: (entryId, file) => {
    const form = new FormData();
    form.append('report', file);
    return request(`/entries/${entryId}/report`, { method: 'POST', body: form });
  },

  uploadThumbnail: (entryId, file) => {
    const form = new FormData();
    form.append('thumbnail', file);
    return request(`/entries/${entryId}/thumbnail`, { method: 'POST', body: form });
  },

  pollJob: (jobId) => request(`/jobs/${jobId}`),

  adminStats: () => request('/admin/stats'),

  uploadVideo: (entryId, file, onProgress) =>
    new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('video', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/entries/${entryId}/video`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            reject(new Error(JSON.parse(xhr.responseText).error || `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(form);
    }),
};
