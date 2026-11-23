'use client';

import { useActionState } from 'react';
import { CheckCircle2, Loader2, Settings, User } from 'lucide-react';
import { updateUsernameAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export function UsernameFormClient({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateUsernameAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
          <Settings className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-zinc-950">
            Username Login
          </h2>
          <p className="text-xs text-zinc-500">
            Ubah username yang digunakan untuk masuk ke aplikasi.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="username"
          className="mb-1.5 block text-xs font-semibold text-zinc-700"
        >
          Username Baru
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
            placeholder="Minimal 3 karakter"
            className="w-full rounded-xl border border-zinc-300 py-2.5 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#047857] focus:ring-1 focus:ring-[#047857] focus:outline-none"
          />
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
        Simpan Username
      </button>
    </form>
  );
}
