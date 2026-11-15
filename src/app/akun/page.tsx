import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { formatNamaGuru } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { AkunSettingsClient } from '@/components/akun/AkunSettingsClient';


const ROLE_LABEL: Record<'ADMIN' | 'GURU_BK' | 'GURU_PJR', string> = {
  ADMIN: 'Admin / Koordinator BK',
  GURU_BK: 'Guru BK',
  GURU_PJR: 'Guru PJR',
};

export default async function AkunPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AppShell
      session={session}
      title="Pengaturan Akun"
      subtitle="Kelola informasi login pribadi Anda"
    >
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Identity Summary */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0D6A37]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {formatNamaGuru(session.namaLengkap, session.gelar)}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-[#0D6A37]">
                  {ROLE_LABEL[session.role]}
                </span>
                {session.namaRuang && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-medium text-zinc-700">
                    Ruang {session.namaRuang}
                  </span>
                )}
                <span className="text-zinc-400">
                  • Gender: {session.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <AkunSettingsClient currentUsername={session.username} />
      </div>
    </AppShell>
  );
}

