'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, Clock, Loader2 } from 'lucide-react';
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
      className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-xs font-extrabold tracking-wider text-zinc-800 uppercase">
            Pembaruan Status
          </h3>
          <p className="text-[11px] text-zinc-400">
            Perbarui perkembangan penanganan kasus
          </p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setStatus('DALAM_PROSES')}
          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
            status === 'DALAM_PROSES'
              ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-2xs'
              : 'border-zinc-200 bg-zinc-50/70 text-zinc-500 hover:bg-zinc-100/70'
          }`}
        >
          <Clock className="h-4 w-4" />
          Dalam Proses
        </button>
        <button
          type="button"
          onClick={() => setStatus('SELESAI')}
          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
            status === 'SELESAI'
              ? 'border-[#047857] bg-[#ECFDF5] text-[#047857] shadow-2xs'
              : 'border-zinc-200 bg-zinc-50/70 text-zinc-500 hover:bg-zinc-100/70'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Selesai
        </button>
      </div>

      <div className="mt-3.5">
        <label
          htmlFor="keterangan-status"
          className="mb-1.5 block text-xs font-semibold text-zinc-700"
        >
          Keterangan Status
        </label>
        <textarea
          id="keterangan-status"
          rows={3}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: Siswa sudah menunjukkan perbaikan kedisiplinan..."
          className="min-h-22 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13.5px] text-zinc-900 placeholder:text-zinc-400 transition-all outline-none focus:border-[#047857] focus:bg-white focus:ring-3 focus:ring-[#047857]/12"
        />
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#ECFDF5] px-3 py-2 text-xs font-medium text-[#047857]">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-3.5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#047857] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#065F46] active:scale-[0.985] disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Status
      </button>
    </form>
  );
}
