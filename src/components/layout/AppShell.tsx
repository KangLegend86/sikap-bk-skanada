'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';
import { AccountMenuDropdown } from '@/components/layout/AccountMenuDropdown';

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
              <ChevronLeft className="w-4.5 h-4.5 stroke-[2.4]" />
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-1.5 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-sikap-bk.webp"
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
                  <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[11px] font-mono font-semibold uppercase shrink-0">
                    {roleBadge}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <AccountMenuDropdown session={session} />
      </header>

      {/* Page Body (pb-24 menjaga ruang untuk PersistentBottomNav) */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 pb-24">
        {children}
      </main>
    </div>
  );
}

export default AppShell;
