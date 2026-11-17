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
    <div className="min-h-screen bg-[#FAFAFA] lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200/80 z-40">
        <div className="p-5 border-b border-[#DCE6DE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F2EB] border border-[#C9D6CC] p-1.5 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-sikap-bk.svg"
                alt="Logo SiKAP BK Skanada"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold italic text-[#045A19] truncate">
                SiKAP BK Skanada
              </div>
              <div className="text-[11px] text-[#495E4E] font-medium truncate">
                SMKS NU 2 Kedungpring
              </div>
            </div>
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
                    ? 'bg-[#045A19] text-white hover:bg-[#034212] shadow-xs my-1'
                    : active
                    ? 'bg-[#E9F2EB] text-[#045A19] border border-[#C9D6CC]'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.isCenterAction ? 'Catat Jurnal Baru' : item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#DCE6DE] bg-[#EEF3EF]/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#045A19] ring-2 ring-[#FFCC00]/50 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#17331E] truncate">{fullName}</div>
              <div className="text-[11px] font-semibold text-[#045A19]">{roleBadge}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Sticky Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCE6DE] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {backHref ? (
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
                className="w-10 h-10 rounded-xl bg-[#EEF3EF] border border-[#C9D6CC] text-[#17331E] hover:bg-[#DCE6DE] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-[18px] h-[18px] stroke-[2.4]" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#E9F2EB] border border-[#C9D6CC] p-1.5 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-sikap-bk.svg"
                  alt="Logo SiKAP BK Skanada"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="min-w-0">
              {title ? (
                <>
                  <h1 className="text-[15px] font-extrabold text-[#17331E] leading-tight tracking-tight truncate">
                    {title}
                  </h1>
                  <p className="text-[11px] text-[#495E4E] font-medium truncate mt-0.5">
                    {subtitle || `${fullName} • ${roleBadge}`}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-[15px] font-extrabold text-[#17331E] leading-tight truncate">
                    {fullName}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#E9F2EB] text-[#045A19] border border-[#C9D6CC] text-[11px] font-mono font-semibold uppercase shrink-0">
                      {roleBadge}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {!backHref && (
            <Link
              href="/akun"
              aria-label="Profil Akun"
              title="Pengaturan Akun"
              className="w-10 h-10 rounded-xl bg-[#EEF3EF] hover:bg-[#DCE6DE] border border-[#DCE6DE] text-[#17331E] flex items-center justify-center shrink-0 transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </header>

        {/* Desktop Top Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#DCE6DE] px-8 py-4 items-center justify-between">
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
                className="w-9 h-9 rounded-xl bg-[#EEF3EF] border border-[#C9D6CC] text-[#17331E] hover:bg-[#DCE6DE] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-[18px] h-[18px] stroke-[2.4]" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-[#17331E]">
                {title || fullName}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#495E4E] font-medium">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {title && (
              <span className="text-xs font-semibold text-[#495E4E]">{fullName}</span>
            )}
            <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-[#E9F2EB] text-[#045A19] border border-[#C9D6CC]">
              {roleBadge}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 pb-24 lg:p-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE6DE] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(4,90,25,0.06)]">
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
                  <span className="w-12 h-12 rounded-2xl bg-[#045A19] text-white flex items-center justify-center shadow-lg shadow-[#045A19]/25 border-4 border-white">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold text-[#045A19] mt-0.5">
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
                  active ? 'text-[#045A19]' : 'text-[#6D8272] hover:text-[#17331E]'
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

