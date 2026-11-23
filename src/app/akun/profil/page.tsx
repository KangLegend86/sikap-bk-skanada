import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  Pencil,
  Phone,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';

const ROLE_LABEL: Record<'ADMIN' | 'GURU_BK' | 'GURU_PJR', string> = {
  ADMIN: 'Admin / Koordinator BK',
  GURU_BK: 'Guru BK',
  GURU_PJR: 'Guru PJR',
};

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const account = await prisma.userAccount.findUnique({
    where: { id: session.userId },
    include: {
      pegawai: true,
      ruang_kelas: true,
    },
  });

  const fullName = formatNamaGuru(session.namaLengkap, session.gelar);
  const backHref =
    session.role === 'ADMIN'
      ? '/admin'
      : session.role === 'GURU_PJR'
        ? '/pjr'
        : '/';

  const detailItems = [
    {
      label: 'Nama Lengkap',
      value: fullName,
      Icon: User,
    },
    {
      label: 'Username Login',
      value: account?.username ?? session.username,
      Icon: BadgeCheck,
    },
    {
      label: 'Peran / Jabatan',
      value: ROLE_LABEL[session.role],
      Icon: ShieldCheck,
    },
    ...(account?.ruang_kelas?.nama_ruang || session.namaRuang
      ? [
          {
            label: 'Penanggung Jawab Ruang',
            value: account?.ruang_kelas?.nama_ruang ?? session.namaRuang ?? '-',
            Icon: Building2,
          },
        ]
      : []),
    {
      label: 'Jenis Kelamin',
      value: session.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      Icon: User,
    },
    {
      label: 'No. WhatsApp',
      value: account?.pegawai.no_whatsapp || 'Belum diatur',
      Icon: Phone,
    },
  ];

  return (
    <AppShell session={session} title="Profil Saya" backHref={backHref}>
      <div className="mx-auto max-w-xl space-y-4">
        {/* Profile Hero Card */}
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-zinc-950">
                {fullName}
              </h2>
              <span className="mt-1.5 inline-block rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
                {ROLE_LABEL[session.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Detail Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
              Informasi Akun
            </h3>
          </div>
          <dl className="divide-y divide-zinc-100">
            {detailItems.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] font-medium text-zinc-400">
                    {label}
                  </dt>
                  <dd className="truncate text-sm font-semibold text-zinc-900">
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/akun/profil/edit"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:border-[#047857]/30 hover:text-[#047857] active:scale-[0.985]"
          >
            <Pencil className="h-4 w-4" />
            Ubah Profil
          </Link>
          <Link
            href="/akun/pengaturan"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:border-[#047857]/30 hover:text-[#047857] active:scale-[0.985]"
          >
            <Settings className="h-4 w-4" />
            Setting Akun
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
