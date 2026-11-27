import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/layout/AppShell';
import { JurnalSikapDetailView } from '@/components/jurnal-sikap/JurnalSikapDetailView';

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
      siswa: { include: { jurusan: true } },
      konselor: true,
      foto_list: { orderBy: { urutan: 'asc' } },
    },
  });

  if (!item) notFound();

  return (
    <AppShell
      session={session}
      title="Detail Jurnal Sikap"
      subtitle={`${item.siswa.nama_lengkap} • ${item.snapshot_ruang}`}
      backHref="/jurnal-sikap"
    >
      <JurnalSikapDetailView
        item={item}
        canViewSiswaProfile={true}
        canModify={true}
        deleteRedirectTo="/jurnal-sikap"
      />
    </AppShell>
  );
}
