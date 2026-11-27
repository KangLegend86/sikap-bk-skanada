'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteJurnalAction } from '@/actions/jurnal';
import { triggerGlobalToast } from '@/components/ui/GlobalToast';

export function DeleteJurnalBkButton({
  id,
  redirectTo = '/jurnal',
  label = 'Hapus Catatan',
}: {
  id: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!confirmOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) setConfirmOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [confirmOpen, loading]);

  async function handleConfirmDelete() {
    setLoading(true);
    const res = await deleteJurnalAction(id);
    setLoading(false);

    if (res.error) {
      setConfirmOpen(false);
      triggerGlobalToast(res.error, 'error');
      return;
    }

    setConfirmOpen(false);
    triggerGlobalToast('Jurnal BK berhasil dihapus', 'info');
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-xs font-semibold text-rose-600 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/50 active:scale-[0.985] disabled:opacity-60"
        title="Hapus Jurnal BK"
      >
        <Trash2 className="h-4 w-4" />
        <span>{label}</span>
      </button>

      {confirmOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-bk-confirm-title"
            aria-describedby="delete-bk-confirm-desc"
            className="fixed inset-0 z-130 flex items-center justify-center p-4"
          >
            <div
              onClick={() => {
                if (!loading) setConfirmOpen(false);
              }}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
            />

            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-rose-50 bg-rose-100 text-rose-600">
                  <Trash2 className="h-6 w-6 stroke-[2.2]" />
                </div>

                <h2
                  id="delete-bk-confirm-title"
                  className="mt-3.5 text-base font-extrabold tracking-tight text-zinc-950"
                >
                  Hapus Jurnal BK Ini?
                </h2>

                <p
                  id="delete-bk-confirm-desc"
                  className="mt-1.5 text-xs leading-relaxed text-zinc-500"
                >
                  Catatan konseling beserta seluruh pantauan PJR terkait akan
                  dihapus dari aplikasi dan tidak dapat dikembalikan.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmOpen(false)}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.985] disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmDelete}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-700 active:scale-[0.985] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Ya, Hapus</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
