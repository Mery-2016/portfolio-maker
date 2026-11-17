import { ResumeData, DeepPartial } from '@cvb/shared';

const API_BASE = '/api/v1';

export async function fetchSession() {
  const res = await fetch(`${API_BASE}/session`, { credentials: 'include' });
  return res.json();
}

export async function fetchResumes() {
  const res = await fetch(`${API_BASE}/resumes`, { credentials: 'include' });
  return res.json();
}

export async function fetchResume(id: string): Promise<{ id: string; version: number; data: ResumeData; photoUrl?: string }> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch resume');
  return res.json();
}

export async function createResume(id?: string, language = 'ru') {
  const res = await fetch(`${API_BASE}/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, language }),
  });
  return res.json();
}

export async function patchResume(
  id: string,
  version: number,
  patch: DeepPartial<ResumeData>
): Promise<{ status: 'ok'; version: number } | { status: 'conflict'; version: number; data: ResumeData }> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'cvb',
    },
    credentials: 'include',
    body: JSON.stringify({ version, patch }),
  });

  if (res.status === 409) {
    const json = await res.json();
    return { status: 'conflict', version: json.version, data: json.data };
  }

  if (!res.ok) {
    throw new Error('Patch failed');
  }

  const json = await res.json();
  return { status: 'ok', version: json.version };
}

export async function deleteResume(id: string) {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.ok;
}

export async function duplicateResume(id: string) {
  const res = await fetch(`${API_BASE}/resumes/${id}/duplicate`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function uploadPhoto(id: string, blob: Blob): Promise<{ photoKey: string; photoUrl: string }> {
  const formData = new FormData();
  formData.append('file', blob, 'photo.webp');

  const res = await fetch(`${API_BASE}/resumes/${id}/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload photo failed');
  return res.json();
}

export async function deletePhoto(id: string) {
  const res = await fetch(`${API_BASE}/resumes/${id}/photo`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.ok;
}

export async function checkCompleteness(id: string) {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/check`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function fetchAiUsage(id: string) {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/usage`, {
    credentials: 'include',
  });
  return res.json();
}

export async function regenerateBlock(
  id: string,
  block: 'summary' | 'experience' | 'strengths',
  itemId?: string,
  tone?: string
) {
  const res = await fetch(`${API_BASE}/resumes/${id}/ai/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ block, itemId, tone }),
  });
  return res.json();
}

export async function startExport(id: string, format: 'pdf-desktop' | 'pdf-mobile' | 'png-mobile') {
  const res = await fetch(`${API_BASE}/resumes/${id}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ format }),
  });
  return res.json();
}

export async function pollExport(exportId: string) {
  const res = await fetch(`${API_BASE}/exports/${exportId}`, { credentials: 'include' });
  return res.json();
}
