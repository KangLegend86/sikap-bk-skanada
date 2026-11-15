'use client';

import { useActionState, useState } from 'react';
import { BookOpen, Eye, EyeOff, Lock, School, User, Users } from 'lucide-react';
import { loginGuruAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export default function GuruLoginPage() {
  const [role, setRole] = useState<'GURU_BK' | 'GURU_PJR'>('GURU_BK');
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState(loginGuruAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F2F4F7]">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
        {/* Header Hijau Skanada */}
        <div className="bg-[#0D6A37] px-6 py-7 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">eJurnal BK Skanada</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            SMKS NU 2 Kedungpring
          </p>
        </div>

        <form action={formAction} className="p-6 flex flex-col gap-5">
          <input type="hidden" name="role" value={role} />

          {/* Pilihan Wajib Peran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Masuk Sebagai
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setRole('GURU_BK')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'GURU_BK'
                    ? 'bg-white text-[#0D6A37] shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Guru BK</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('GURU_PJR')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'GURU_PJR'
                    ? 'bg-white text-[#0D6A37] shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Guru PJR</span>
              </button>
            </div>
          </div>

          {state.error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
              {state.error}
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-zinc-700">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder={role === 'GURU_BK' ? 'Contoh: bk.siti' : 'Contoh: pjr.12a'}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-[#0D6A37] focus:ring-3 focus:ring-[#0D6A37]/10 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-700">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan password Anda"
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
            className="w-full bg-[#0D6A37] hover:bg-[#094D28] disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-[#0D6A37]/20 transition-all cursor-pointer"
          >
            {isPending
              ? 'Memeriksa Akun...'
              : `Masuk sebagai ${role === 'GURU_BK' ? 'Guru BK' : 'Guru PJR'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

