'use client';

import { useActionState, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { updatePasswordAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export function PasswordFormClient() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-zinc-950">
            Ubah Password
          </h2>
          <p className="text-xs text-zinc-500">
            Gunakan password minimal 6 karakter agar akun tetap aman.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Password Lama
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Masukkan password saat ini"
              className="w-full rounded-xl border border-zinc-300 py-2.5 pr-10 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((prev) => !prev)}
              aria-label={showCurrent ? 'Sembunyikan password lama' : 'Tampilkan password lama'}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-1 text-zinc-400 hover:text-zinc-700"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Password Baru
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl border border-zinc-300 py-2.5 pr-10 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              aria-label={showNew ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-1 text-zinc-400 hover:text-zinc-700"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-xs font-semibold text-zinc-700"
          >
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              className="w-full rounded-xl border border-zinc-300 py-2.5 pr-10 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-1 text-zinc-400 hover:text-zinc-700"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
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
        Simpan Password Baru
      </button>
    </form>
  );
}
