import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, FilePenLine } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNamaGuru, formatTanggalIndo } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import {
  GuruRiwayatClient,
  type GuruRiwayatItem,
} from '@/components/jurnal-sikap/GuruRiwayatClient';

export default async function GuruDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const journals = await prisma.jurnalSikap.findMany({
    where: {
      OR: [
        { created_by_id: session.userId },
        { konselor_id: session.pegawaiId },
      ],
    },
    orderBy: [{ tanggal: 'desc' }, { created_at: 'desc' }],
    include: {
      siswa: { include: { jurusan: true } },
      konselor: true,
    },
  });

  const items: GuruRiwayatItem[] = journals.map((j) => ({
    id: j.id,
    tanggalFormatted: formatTanggalIndo(j.tanggal),
    jenis: j.jenis,
    siswaNama: j.siswa.nama_lengkap,
    snapshotRuang: j.snapshot_ruang,
    jurusanKode: j.siswa.jurusan.kode,
    konselorNama: formatNamaGuru(j.konselor.nama_lengkap),
    prestasiDalam: j.prestasi_dalam,
    sikapPerilaku: j.sikap_perilaku,
    permasalahan: j.permasalahan,
    kendala: j.kendala,
    solusi: j.solusi,
    catatan: j.catatan,
    tindakLanjut: j.tindak_lanjut,
    fotoDriveId: j.foto_drive_id,
    fotoFileName: j.foto_file_name,
    canModify:
      j.created_by_id === session.userId ||
      session.role === 'ADMIN' ||
      session.role === 'GURU_BK',
  }));

  const todayLabel = formatTanggalIndo(new Date());

  return (
    <AppShell session={session}>
      <div className="flex flex-col gap-4">
        {/* Bar Tanggal Ringkas & Identitas (selaras dengan Beranda Guru BK) */}
        <div className="flex items-center justify-between rounded-[10px] border border-zinc-200/80 bg-white px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-600">
            <Calendar className="h-4 w-4 shrink-0 text-[#047857]" />
            <span>{todayLabel}</span>
          </div>
          <span className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#047857]">
            JURNAL SIKAP
          </span>
        </div>

        {/* Tombol Aksi Utama (CTA) — selaras dengan Beranda Guru BK */}
        <Link
          href="/guru/baru"
          className="skanada-btn-primary flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3.5 text-[15px] hover:bg-emerald-800"
        >
          <FilePenLine className="h-5 w-5 shrink-0" />
          <span>Catat Jurnal Sikap Baru</span>
        </Link>

        {/* Ringkasan Angka + Pencarian + Daftar Riwayat Catatan Saya */}
        <GuruRiwayatClient items={items} />
      </div>
    </AppShell>
  );
}
