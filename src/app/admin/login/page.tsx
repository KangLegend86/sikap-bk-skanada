'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { loginAdminAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export default function AdminLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
        <div className="bg-zinc-900 px-6 py-7 text-white text-center border-b border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-[#0D6A37]/25 border border-[#0D6A37]/60 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Portal Admin BK</h1>
          <p className="text-xs text-zinc-400 mt-1">
            eJurnal BK Skanada — Koordinator BK
          </p>
        </div>

        <form action={formAction} className="p-6 flex flex-col gap-4">
          {state.error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-zinc-700">
              Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="admin.bk"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-[#0D6A37] focus:ring-3 focus:ring-[#0D6A37]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-700">
              Password Admin
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Masukkan password admin"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-[#0D6A37] focus:ring-3 focus:ring-[#0D6A37]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isPending ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

