'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ClipboardList,
  Database,
  FileText,
  Home,
  Plus,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCenterAction?: boolean;
}

function getNavItems(role: SessionPayload['role']): NavItem[] {
  if (role === 'GURU_PJR') {
    return [
      { href: '/pjr', label: 'Beranda', icon: Home },
      { href: '/pjr/kasus', label: 'Pantauan', icon: ClipboardList },
      { href: '/pjr/siswa', label: 'Siswa', icon: Users },
      { href: '/akun', label: 'Akun', icon: User },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { href: '/admin', label: 'Beranda', icon: Home },
      { href: '/admin/rekap', label: 'Rekap', icon: FileText },
      { href: '/admin/master', label: 'Master', icon: Database },
      { href: '/admin/users', label: 'Akun', icon: Shield },
      { href: '/akun', label: 'Profil', icon: Settings },
    ];
  }

  // Default: GURU_BK
  return [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/jurnal', label: 'Jurnal', icon: FileText },
    { href: '/jurnal/baru', label: 'Catat', icon: Plus, isCenterAction: true },
    { href: '/siswa', label: 'Siswa', icon: Users },
    { href: '/akun', label: 'Akun', icon: User },
  ];
}

export function AppShell({
  session,
  title,
  subtitle,
  backHref,
  children,
}: {
  session: SessionPayload;
  title?: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getNavItems(session.role);
  const fullName = formatNamaGuru(session.namaLengkap, session.gelar);

  const isActive = (href: string) => {
    if (href === '/' || href === '/pjr' || href === '/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const roleBadge =
    session.role === 'ADMIN'
      ? 'Koordinator BK'
      : session.role === 'GURU_PJR'
      ? `PJR ${session.namaRuang || ''}`
      : 'Guru BK';

  return (
    <div className="min-h-screen bg-[#F2F4F7] lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200 z-40">
        <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-1.5 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-sikap-bk.svg"
              alt="Logo SiKAP BK Skanada"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-zinc-900 truncate">SiKAP BK Skanada</div>
            <div className="text-[11px] text-zinc-500 font-medium truncate">SMKS NU 2 Kedungpring</div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.isCenterAction
                    ? 'bg-[#0D6A37] text-white hover:bg-[#094D28] shadow-sm my-1'
                    : active
                    ? 'bg-[#ECFDF5] text-[#0D6A37] border border-[#A7F3D0]'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.isCenterAction ? 'Catat Jurnal Baru' : item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 truncate">{fullName}</div>
              <div className="text-[11px] font-medium text-[#0D6A37]">{roleBadge}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Sticky Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {backHref && (
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push(backHref);
                  }
                }}
                title="Kembali"
                className="w-9 h-9 rounded-[11px] bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-[18px] h-[18px] stroke-[2.4]" />
              </button>
            )}
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#ECFDF5] border border-[#A7F3D0] p-1 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-sikap-bk.svg"
                alt="Logo SiKAP BK Skanada"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-zinc-900 leading-tight tracking-tight truncate">
                {title || 'SiKAP BK Skanada'}
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium truncate">
                {subtitle || `${fullName} • ${roleBadge}`}
              </p>
            </div>
          </div>
          {!backHref && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#0D6A37] border border-[#A7F3D0] shrink-0">
              {roleBadge}
            </span>
          )}
        </header>

        {/* Desktop Top Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-8 py-4 items-center justify-between">
          <div className="flex items-center gap-3">
            {backHref && (
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push(backHref);
                  }
                }}
                title="Kembali"
                className="w-9 h-9 rounded-[11px] bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-[18px] h-[18px] stroke-[2.4]" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-zinc-900">
                {title || 'SiKAP BK Skanada'}
              </h1>
              {subtitle && (
                <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600">{fullName}</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ECFDF5] text-[#0D6A37] border border-[#A7F3D0]">
              {roleBadge}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 pb-24 lg:p-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.isCenterAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-5"
                >
                  <span className="w-12 h-12 rounded-2xl bg-[#0D6A37] text-white flex items-center justify-center shadow-lg shadow-[#0D6A37]/30 border-4 border-white">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold text-[#0D6A37] mt-0.5">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  active ? 'text-[#0D6A37]' : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default AppShell;

