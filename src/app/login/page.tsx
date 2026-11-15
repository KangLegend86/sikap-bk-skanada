'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BookText, Eye, EyeOff, Lock, School, User, Users } from 'lucide-react';
import { loginGuruAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export default function GuruLoginPage() {
  const [role, setRole] = useState<'GURU_BK' | 'GURU_PJR'>('GURU_BK');
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState(
    loginGuruAction,
    initialState
  );

  return (
    <div className="min-h-screen flex flex-col sm:items-center sm:justify-center sm:p-4 bg-white sm:bg-[#EEF2EE]">
      <div className="w-full flex-1 sm:flex-none sm:max-w-[410px] bg-white sm:rounded-[28px] sm:shadow-[0_20px_50px_rgba(27,59,40,0.12)] overflow-hidden sm:border sm:border-[#DCE5DD] flex flex-col">
        {/* Organic Botanical Wave Header */}
        <div className="relative h-48 sm:h-40 bg-linear-to-br from-[#1A3B27] via-[#2A573B] to-[#3B6E4D] overflow-hidden flex flex-col justify-center px-6 pb-6 shrink-0">
          {/* Subtle Decorative Botanical Leaf Shapes */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 180"
            className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d="M-20,140 C40,60 110,20 190,50 C140,100 90,145 -20,140 Z"
              fill="#86EFAC"
              fillOpacity="0.22"
            />
            <path
              d="M210,-10 C280,20 350,60 410,120 C330,115 250,70 210,-10 Z"
              fill="#A7F3D0"
              fillOpacity="0.18"
            />
            <path
              d="M90,10 C150,45 190,110 215,170 C145,140 105,75 90,10 Z"
              fill="#052E16"
              fillOpacity="0.28"
            />
            <path
              d="M280,15 C340,10 385,45 415,95 C355,105 305,70 280,15 Z"
              fill="#DCFCE7"
              fillOpacity="0.16"
            />
          </svg>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shrink-0">
              <BookText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/90">
                SMKS NU 2 Kedungpring
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                eJurnal BK Skanada
              </h1>
            </div>
          </div>

          {/* Smooth Curved Wave Cutout */}
          <svg
            aria-hidden="true"
            viewBox="0 0 410 48"
            className="absolute bottom-0 left-0 w-full h-11 text-white"
            preserveAspectRatio="none"
          >
            <path
              d="M0,34 C115,48 255,0 410,22 L410,48 L0,48 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Body Content */}
        <div className="px-6 pt-1 pb-7 relative">
          {/* Welcome Heading + Leaf Accent */}
          <div className="text-center relative mb-5">
            <h2 className="text-[22px] font-bold text-[#274C35] tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Silakan pilih peran &amp; masuk ke akun Anda
            </p>
            {/* Minimalist Leaf Accent */}
            <svg
              aria-hidden="true"
              viewBox="0 0 40 40"
              className="w-7 h-7 absolute -top-2 right-1 text-[#4A7C59]/80 pointer-events-none"
            >
              <path
                d="M8,32 C10,16 20,8 34,6 C32,20 24,30 8,32 Z"
                fill="currentColor"
                fillOpacity="0.85"
              />
              <path
                d="M8,32 C16,22 24,14 34,6"
                stroke="#1E3F2B"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="role" value={role} />

            {/* Pilihan Wajib Peran */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#EBF2EC] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('GURU_BK')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === 'GURU_BK'
                    ? 'bg-white text-[#274C35] shadow-xs'
                    : 'text-[#5C7A67] hover:text-[#274C35]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Guru BK</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('GURU_PJR')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === 'GURU_PJR'
                    ? 'bg-white text-[#274C35] shadow-xs'
                    : 'text-[#5C7A67] hover:text-[#274C35]'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Guru PJR</span>
              </button>
            </div>

            {state.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
                {state.error}
              </div>
            )}

            {/* Username (Soft Sage Pill Input) */}
            <div className="relative">
              <User className="w-4 h-4 text-[#3A6B47] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder={
                  role === 'GURU_BK'
                    ? 'Username Guru BK (mis. bk.siti)'
                    : 'Username Guru PJR (mis. pjr.12a)'
                }
                className="w-full pl-11 pr-4 py-3 text-sm text-[#1E3A28] placeholder:text-[#6B8574] bg-[#E9F1EB] rounded-xl outline-none border border-transparent focus:bg-white focus:border-[#3A6B47]/40 focus:ring-3 focus:ring-[#3A6B47]/15 transition-all"
              />
            </div>

            {/* Password (Soft Sage Pill Input) */}
            <div className="relative">
              <Lock className="w-4 h-4 text-[#3A6B47] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="w-full pl-11 pr-11 py-3 text-sm text-[#1E3A28] placeholder:text-[#6B8574] bg-[#E9F1EB] rounded-xl outline-none border border-transparent focus:bg-white focus:border-[#3A6B47]/40 focus:ring-3 focus:ring-[#3A6B47]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4E7A5B] hover:text-[#274C35] cursor-pointer"
                aria-label="Lihat password"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 bg-[#3A6B47] hover:bg-[#2C5437] disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-full shadow-md shadow-[#3A6B47]/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              {isPending
                ? 'Memverifikasi...'
                : `Masuk sebagai ${role === 'GURU_BK' ? 'Guru BK' : 'Guru PJR'}`}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-zinc-400">
            Koordinator BK?{' '}
            <Link
              href="/admin/login"
              className="font-semibold text-[#3A6B47] hover:underline"
            >
              Masuk Panel Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
