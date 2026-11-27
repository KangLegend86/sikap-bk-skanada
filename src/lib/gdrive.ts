import crypto from 'node:crypto';

export function isGdriveConfigured(): boolean {
  return Boolean(
    process.env.GDRIVE_SCRIPT_URL?.trim() &&
      process.env.GDRIVE_SCRIPT_SECRET?.trim()
  );
}

export function buildHomeVisitFileName(
  tanggalIso: string,
  kelas: string,
  namaSiswa: string,
  urutan?: number
): string {
  const datePart = tanggalIso.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const kelasPart = kelas.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() || 'KELAS';
  const namaPart =
    namaSiswa
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 32) || 'Siswa';
  const rand = crypto.randomBytes(2).toString('hex');
  const seqPart = typeof urutan === 'number' ? `_${urutan}` : '';
  return `${datePart}_${kelasPart}_${namaPart}${seqPart}_${rand}.jpg`;
}

export async function uploadHomeVisitPhoto(params: {
  base64Data: string;
  mimeType: string;
  fileName: string;
  tanggalIso: string;
}): Promise<{ fileId: string; fileName: string }> {
  const scriptUrl = process.env.GDRIVE_SCRIPT_URL?.trim();
  const secret = process.env.GDRIVE_SCRIPT_SECRET?.trim();

  if (!scriptUrl || !secret) {
    throw new Error(
      'Konfigurasi Google Drive belum diatur (GDRIVE_SCRIPT_URL / GDRIVE_SCRIPT_SECRET di .env).'
    );
  }

  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify({
      secret,
      action: 'upload',
      base64Data: params.base64Data,
      mimeType: params.mimeType || 'image/jpeg',
      fileName: params.fileName,
      tanggalIso: params.tanggalIso,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal menghubungi Google Drive (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    ok?: boolean;
    fileId?: string;
    fileName?: string;
    error?: string;
  };

  if (!data.ok || !data.fileId) {
    throw new Error(data.error || 'Gagal mengunggah foto ke Google Drive.');
  }

  return {
    fileId: data.fileId,
    fileName: data.fileName || params.fileName,
  };
}

export async function deleteHomeVisitPhoto(fileId: string | null | undefined): Promise<void> {
  if (!fileId) return;
  const scriptUrl = process.env.GDRIVE_SCRIPT_URL?.trim();
  const secret = process.env.GDRIVE_SCRIPT_SECRET?.trim();
  if (!scriptUrl || !secret) return;

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        secret,
        action: 'delete',
        fileId,
      }),
    });
  } catch (err) {
    console.error('[GDrive] Gagal menghapus foto lama:', err);
  }
}
