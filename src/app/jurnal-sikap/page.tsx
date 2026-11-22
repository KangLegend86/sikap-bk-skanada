import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Contact } from 'lucide-react';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';

export default async function JurnalSikapPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr');

  return (
    <AppShell
      session={session}
      title="Jurnal Penilaian Sikap"
      subtitle="Riwayat jurnal penilaian sikap siswa"
    >
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
          <Contact className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-zinc-900">
          Riwayat Jurnal Penilaian Sikap
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Halaman ini sedang dalam tahap pengembangan dan akan segera tersedia.
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#047857] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#065F46]"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
