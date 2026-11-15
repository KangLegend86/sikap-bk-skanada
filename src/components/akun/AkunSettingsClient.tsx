'use client';

import { useActionState } from 'react';
import { CheckCircle2, KeyRound, Loader2, LogOut, User } from 'lucide-react';
import {
  logoutAction,
  updateOwnAccountAction,
  type AuthActionState,
} from '@/actions/auth';

const initialState: AuthActionState = {};

export function AkunSettingsClient({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateOwnAccountAction,
    initialState
  );

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
      >
        <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
          <KeyRound className="h-4 w-4 text-[#0D6A37]" />
          Ubah Username & Password
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Anda dapat menyesuaikan username sesuai keinginan. Kosongkan kolom password jika hanya ingin mengubah username.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-semibold text-zinc-700"
            >
              Username Login
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                defaultValue={currentUsername}
                className="w-full rounded-lg border border-zinc-300 py-2.5 pr-3 pl-9 text-sm text-zinc-900 focus:border-[#0D6A37] focus:ring-1 focus:ring-[#0D6A37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold text-zinc-700"
            >
              Password Baru (Opsional)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 6 karakter jika ingin ganti"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#0D6A37] focus:ring-1 focus:ring-[#0D6A37] focus:outline-none"
            />
          </div>
        </div>

        {state?.error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D6A37] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#09532A] disabled:opacity-60 sm:w-auto"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Perubahan Akun
        </button>
      </form>

      {/* Logout Card (helpful on mobile where sidebar logout isn't visible) */}
      <form
        action={logoutAction}
        className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Keluar Aplikasi</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Akhiri sesi login Anda di perangkat ini.
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Keluar (Logout)
          </button>
        </div>
      </form>
    </div>
  );
}

