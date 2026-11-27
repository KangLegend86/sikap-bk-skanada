'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteJurnalSikapAction } from '@/actions/jurnal-sikap';

export function DeleteJurnalSikapButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      'Yakin ingin menghapus Jurnal Penilaian Sikap ini? Jika ada bukti foto Home Visit, foto di Google Drive juga akan dipindahkan ke Sampah.'
    );
    if (!ok) return;

    setLoading(true);
    const res = await deleteJurnalSikapAction(id);
    setLoading(false);

    if (res.error) {
      window.alert(res.error);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      title="Hapus Jurnal Sikap"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Hapus
    </button>
  );
}
