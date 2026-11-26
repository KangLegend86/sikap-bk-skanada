'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  LogOut,
  Settings,
  User,
  UserCircle2,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';

export function AccountMenuDropdown({ session }: { session: SessionPayload }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const fullName = formatNamaGuru(session.namaLengkap);
  const roleBadge =
    session.role === 'ADMIN'
      ? 'Koordinator BK'
      : session.role === 'GURU_PJR'
        ? `PJR ${session.namaRuang || ''}`
        : 'Guru BK';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menuItems = [
    {
      href: '/akun/profil',
      label: 'Profil',
      desc: 'Lihat informasi akun Anda',
      Icon: UserCircle2,
    },
    {
      href: '/akun/pengaturan',
      label: 'Setting Akun',
      desc: 'Kelola username & password',
      Icon: Settings,
    },
  ];

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Menu Akun"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Menu Akun"
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95 ${
          open
            ? 'border-[#047857] bg-[#047857] text-white shadow-sm shadow-[#047857]/25'
            : 'border-[#D1FAE5] bg-[#ECFDF5] text-[#17331E] hover:bg-[#D1FAE5]'
        }`}
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2.5 w-64 origin-top-right overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.16),0_4px_12px_-4px_rgba(15,23,42,0.08)] z-50"
        >
          {/* User Identity Header */}
          <div className="border-b border-zinc-100 bg-[#ECFDF5]/60 px-4 py-3">
            <p className="truncate text-sm font-bold text-zinc-950">{fullName}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded-md border border-[#A7F3D0] bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#047857]">
                {roleBadge}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5">
            {menuItems.map(({ href, label, desc, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    active
                      ? 'bg-[#ECFDF5] text-[#047857]'
                      : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-[#047857] text-white'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-tight">
                      {label}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                      {desc}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-100 p-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-600 transition-colors hover:bg-rose-50 active:bg-rose-100/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <LogOut className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold leading-tight">
                    Log Out
                  </div>
                  <div className="mt-0.5 text-[11px] text-rose-400">
                    Keluar dari sesi ini
                  </div>
                </div>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
