import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/layout/AppShell';
import { JurnalSikapDetailView } from '@/components/jurnal-sikap/JurnalSikapDetailView';

export default async function GuruJurnalSikapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const item = await prisma.jurnalSikap.findUnique({
    where: { id },
    include: {
      siswa: { include: { jurusan: true } },
      konselor: true,
      foto_list: { orderBy: { urutan: 'asc' } },
    },
  });

  if (!item) notFound();

  const canView =
    item.created_by_id === session.userId ||
    item.konselor_id === session.pegawaiId ||
    session.role === 'GURU_BK' ||
    session.role === 'ADMIN';

  if (!canView) redirect('/guru');

  const canModify =
    item.created_by_id === session.userId ||
    session.role === 'ADMIN' ||
    session.role === 'GURU_BK';

  return (
    <AppShell
      session={session}
      title="Detail Jurnal Sikap"
      subtitle={`${item.siswa.nama_lengkap} • ${item.snapshot_ruang}`}
      backHref="/guru/riwayat"
    >
      <JurnalSikapDetailView
        item={item}
        canViewSiswaProfile={false}
        canModify={canModify}
        deleteRedirectTo="/guru/riwayat"
      />
    </AppShell>
  );
}
