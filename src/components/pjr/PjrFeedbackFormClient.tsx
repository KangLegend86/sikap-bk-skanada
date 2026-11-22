'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { submitPjrFeedbackAction } from '@/actions/jurnal';

export function PjrFeedbackFormClient({ jurnalId }: { jurnalId: string }) {
  const router = useRouter();
  const [pesan, setPesan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pesan.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await submitPjrFeedbackAction(jurnalId, pesan.trim());
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setPesan('');
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        rows={2}
        required
        value={pesan}
        onChange={(e) => setPesan(e.target.value)}
        placeholder="Tulis laporan perkembangan siswa di kelas untuk Guru BK..."
        className="w-full min-h-[88px] resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {success && (
        <p className="text-xs font-medium text-emerald-700">
          Laporan pantauan berhasil dikirim ke Guru BK.
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !pesan.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#047857] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#065F46] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Kirim Pantauan PJR
        </button>
      </div>
    </form>
  );
}

