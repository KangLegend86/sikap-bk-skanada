'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { updateJurnalStatusAction } from '@/actions/jurnal';

export function JurnalStatusUpdateClient({
  jurnalId,
  initialStatus,
  initialKeterangan,
}: {
  jurnalId: string;
  initialStatus: 'DALAM_PROSES' | 'SELESAI';
  initialKeterangan: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'DALAM_PROSES' | 'SELESAI'>(initialStatus);
  const [keterangan, setKeterangan] = useState(initialKeterangan);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await updateJurnalStatusAction(jurnalId, status, keterangan);
    setSaving(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setMessage('Status kasus berhasil diperbarui.');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
    >
      <h3 className="text-sm font-bold text-zinc-900">
        Pembaruan Status Kasus
      </h3>
      <p className="mt-0.5 text-xs text-zinc-500">
        Ubah status penanganan dan tambahkan keterangan terbaru.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setStatus('DALAM_PROSES')}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            status === 'DALAM_PROSES'
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Dalam Proses
        </button>
        <button
          type="button"
          onClick={() => setStatus('SELESAI')}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            status === 'SELESAI'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selesai
        </button>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-zinc-700">
          Keterangan Status
        </label>
        <textarea
          rows={3}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: Siswa sudah menunjukkan perbaikan kedisiplinan selama 2 minggu..."
          className="w-full min-h-[96px] resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
        />
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
      {message && (
        <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#047857] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065F46] disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Status
      </button>
    </form>
  );
}

