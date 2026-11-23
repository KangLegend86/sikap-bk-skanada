'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  ClipboardList,
  Database,
  FileText,
  Home,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';
import BottomNav, { type BottomNavItem } from '@/components/BottomNav';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';

const PJR_NAV_ITEMS: BottomNavItem[] = [
  { path: '/pjr', label: 'Beranda', Icon: Home },
  { path: '/pjr/kasus', label: 'Pantauan', Icon: ClipboardList },
  { path: '/pjr/siswa', label: 'Siswa', Icon: Users },
  { path: '/akun/profil', label: 'Profil', Icon: User },
];

const ADMIN_NAV_ITEMS: BottomNavItem[] = [
  { path: '/admin', label: 'Beranda', Icon: Home },
  { path: '/admin/rekap', label: 'Rekap', Icon: FileText },
  { path: '/admin/master', label: 'Master', Icon: Database },
  { path: '/admin/users', label: 'Akun', Icon: Shield },
  { path: '/akun/profil', label: 'Profil', Icon: Settings },
];

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
  const fullName = formatNamaGuru(session.namaLengkap, session.gelar);

  const roleBadge =
    session.role === 'ADMIN'
      ? 'Koordinator BK'
      : session.role === 'GURU_PJR'
        ? `PJR ${session.namaRuang || ''}`
        : 'Guru BK';

  const roleNavItems =
    session.role === 'GURU_PJR'
      ? PJR_NAV_ITEMS
      : session.role === 'ADMIN'
        ? ADMIN_NAV_ITEMS
        : undefined;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Sticky Header (Mobile-first untuk semua ukuran layar) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#D1FAE5] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              title="Kembali"
              aria-label="Kembali"
              className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#17331E] hover:bg-[#D1FAE5] flex items-center justify-center shrink-0 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-[18px] h-[18px] stroke-[2.4]" />
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-1.5 flex items-center justify-center shrink-0">
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
                {subtitle && (
                  <p className="text-[11px] text-[#495E4E] font-medium truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </>
            ) : (
              <>
                <h1 className="text-[15px] font-extrabold text-[#17331E] leading-tight truncate">
                  {fullName}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[11px] font-mono font-semibold uppercase shrink-0">
                    {roleBadge}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <AccountMenuDropdown session={session} />
      </header>

      {/* Page Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation Bar (untuk semua ukuran layar & semua role) */}
      <BottomNav items={roleNavItems} />
    </div>
  );
}

export default AppShell;
