import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  Edit3,
  ExternalLink,
  Home,
  User,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  getMajorBadgeClass,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { DeleteJurnalSikapButton } from '@/components/jurnal-sikap/DeleteJurnalSikapButton';

export default async function JurnalSikapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'GURU_PJR') redirect('/pjr');
  if (session.role === 'GURU') redirect('/guru');

  const { id } = await params;

  const item = await prisma.jurnalSikap.findUnique({
    where: { id },
    include: {
      siswa: { include: { jurusan: true, ruang_kelas: true } },
      konselor: true,
      created_by: { include: { pegawai: true } },
    },
  });

  if (!item) notFound();

  const badge =
    item.jenis === 'BERPRESTASI'
      ? {
          cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Berprestasi',
          Icon: Award,
        }
      : item.jenis === 'HOME_VISIT'
        ? {
            cls: 'bg-blue-100 text-blue-800 border-blue-200',
            label: 'Home Visit',
            Icon: Home,
          }
        : {
            cls: 'bg-amber-100 text-amber-800 border-amber-200',
            label: 'Bermasalah / Butuh Bimbingan',
            Icon: AlertTriangle,
          };

  const JenisIcon = badge.Icon;

  return (
    <AppShell
      session={session}
      title="Detail Jurnal Sikap"
      subtitle={`${item.siswa.nama_lengkap} • ${item.snapshot_ruang}`}
      backHref="/jurnal-sikap"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header Card */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}
                >
                  <JenisIcon className="h-3.5 w-3.5" />
                  {badge.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatTanggalIndo(item.tanggal)}
                </span>
              </div>

              <h2 className="mt-2.5 text-lg font-extrabold text-zinc-900">
                <Link
                  href={`/siswa/${item.siswa_id}`}
                  className="hover:text-[#047857] hover:underline"
                >
                  {item.siswa.nama_lengkap}
                </Link>
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">
                  Kelas saat kejadian: {item.snapshot_ruang}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${getMajorBadgeClass(
                    item.siswa.jurusan.kode
                  )}`}
                >
                  {item.siswa.jurusan.kode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href={`/guru/${item.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Link>
              <DeleteJurnalSikapButton id={item.id} redirectTo="/jurnal-sikap" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Konselor:{' '}
              <strong className="text-zinc-900">
                {formatNamaGuru(item.konselor.nama_lengkap)}
              </strong>
            </span>
            <span className="text-zinc-400">
              Diinput oleh: {formatNamaGuru(item.created_by.pegawai.nama_lengkap)} (
              {item.created_by.username})
            </span>
          </div>
        </section>

        {/* Content Details */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          {item.jenis === 'BERPRESTASI' ? (
            <>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Berprestasi dalam hal
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                  {item.prestasi_dalam || '-'}
                </p>
              </div>
              <div className="border-t border-zinc-100 pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sikap / Perilaku
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                  {item.sikap_perilaku || '-'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Permasalahan
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                  {item.permasalahan || '-'}
                </p>
              </div>
              {item.kendala && (
                <div className="border-t border-zinc-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Kendala
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                    {item.kendala}
                  </p>
                </div>
              )}
              {item.solusi && (
                <div className="border-t border-zinc-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Solusi
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                    {item.solusi}
                  </p>
                </div>
              )}
            </>
          )}

          {item.catatan && (
            <div className="border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Catatan
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                {item.catatan}
              </p>
            </div>
          )}

          <div className="border-t border-zinc-100 pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#047857]">
              Tindak Lanjut
            </h3>
            <p className="mt-1 whitespace-pre-line text-sm font-medium text-zinc-900">
              {item.tindak_lanjut}
            </p>
          </div>
        </section>

        {/* Bukti Foto Home Visit */}
        {item.foto_drive_id && (
          <section className="rounded-2xl border border-blue-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Camera className="h-4 w-4" />
                Bukti Foto Home Visit
              </h3>
              <a
                href={`https://drive.google.com/file/d/${item.foto_drive_id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka di Google Drive
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/jurnal-sikap/foto/${item.foto_drive_id}`}
                alt={item.foto_file_name || 'Bukti Foto Home Visit'}
                className="max-h-[480px] w-full object-contain"
              />
            </div>
            {item.foto_file_name && (
              <p className="text-[11px] font-mono text-zinc-400">
                {item.foto_file_name}
              </p>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
