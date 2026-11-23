'use client';

import { useActionState } from 'react';
import { CheckCircle2, Loader2, Pencil, Phone, User } from 'lucide-react';
import { updateOwnProfileAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export function EditProfileFormClient({
  namaLengkap,
  gelar,
  jenisKelamin,
  noWhatsapp,
}: {
  namaLengkap: string;
  gelar: string | null;
  jenisKelamin: 'L' | 'P';
  noWhatsapp: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateOwnProfileAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
          <Pencil className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-zinc-950">Ubah Profil</h2>
          <p className="text-xs text-zinc-500">
            Perbarui informasi pribadi dan kontak Anda.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <div>
          <label
            htmlFor="namaLengkap"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Nama Lengkap
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="namaLengkap"
              name="namaLengkap"
              type="text"
              required
              minLength={2}
              defaultValue={namaLengkap}
              placeholder="Nama lengkap tanpa gelar"
              className="w-full rounded-xl border border-zinc-300 py-2.5 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="gelar"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Gelar (Opsional)
          </label>
          <input
            id="gelar"
            name="gelar"
            type="text"
            defaultValue={gelar ?? ''}
            placeholder="Contoh: S.Pd., Gr."
            className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="jenisKelamin"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Jenis Kelamin
          </label>
          <select
            id="jenisKelamin"
            name="jenisKelamin"
            defaultValue={jenisKelamin}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="noWhatsapp"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            No. WhatsApp (Opsional)
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="noWhatsapp"
              name="noWhatsapp"
              type="tel"
              defaultValue={noWhatsapp ?? ''}
              placeholder="Contoh: 081234567890"
              className="w-full rounded-xl border border-zinc-300 py-2.5 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#ECFDF5] px-3.5 py-2.5 text-xs font-medium text-[#047857]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#065F46] active:scale-[0.985] disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Profil
      </button>
    </form>
  );
}
