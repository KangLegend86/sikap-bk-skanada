'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { loginAdminAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export default function AdminLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState(
    loginAdminAction,
    initialState
  );

  return (
    <div className="min-h-screen flex flex-col sm:items-center sm:justify-center sm:p-4 bg-white sm:bg-[#EEF2EE]">
      <div className="w-full flex-1 sm:flex-none sm:max-w-[400px] bg-white sm:rounded-[28px] sm:shadow-[0_20px_50px_rgba(27,59,40,0.12)] overflow-hidden sm:border sm:border-[#DCE5DD] flex flex-col">
        {/* Deep Forest Wave Header */}
        <div className="relative h-48 sm:h-40 bg-linear-to-br from-[#142D1E] via-[#214730] to-[#326144] overflow-hidden flex flex-col justify-center px-6 pb-6 shrink-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 180"
            className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d="M-20,140 C40,60 110,20 190,50 C140,100 90,145 -20,140 Z"
              fill="#86EFAC"
              fillOpacity="0.2"
            />
            <path
              d="M210,-10 C280,20 350,60 410,120 C330,115 250,70 210,-10 Z"
              fill="#A7F3D0"
              fillOpacity="0.16"
            />
          </svg>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center text-emerald-200 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/90">
                Koordinator BK Skanada
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                Portal Admin BK
              </h1>
            </div>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 400 48"
            className="absolute bottom-0 left-0 w-full h-11 text-white"
            preserveAspectRatio="none"
          >
            <path
              d="M0,34 C115,48 255,0 400,22 L400,48 L0,48 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="px-6 pt-1 pb-7">
          <div className="text-center mb-5">
            <h2 className="text-[21px] font-bold text-[#274C35] tracking-tight">
              Panel Administrator
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Masuk untuk mengelola rekap &amp; data master
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            {state.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
                {state.error}
              </div>
            )}

            <div className="relative">
              <User className="w-4 h-4 text-[#3A6B47] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Username Admin (mis. admin.bk)"
                className="w-full pl-11 pr-4 py-3 text-sm text-[#1E3A28] placeholder:text-[#6B8574] bg-[#E9F1EB] rounded-xl outline-none border border-transparent focus:bg-white focus:border-[#3A6B47]/40 focus:ring-3 focus:ring-[#3A6B47]/15 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#3A6B47] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Password Admin"
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
              className="w-full mt-2 bg-[#274C35] hover:bg-[#1A3524] disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-full shadow-md shadow-[#274C35]/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              {isPending ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-zinc-400">
            Guru BK atau Guru PJR?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#3A6B47] hover:underline"
            >
              Kembali ke Login Guru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
