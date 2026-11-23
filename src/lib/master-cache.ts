import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const getCachedActiveRuangList = unstable_cache(
  async () =>
    prisma.ruangKelas.findMany({
      where: { is_active: true },
      orderBy: { nama_ruang: 'asc' },
      select: { id: true, nama_ruang: true },
    }),
  ['active-ruang-kelas-list'],
  { revalidate: 1800, tags: ['master-data'] }
);

export const getCachedActiveJurusanList = unstable_cache(
  async () =>
    prisma.jurusan.findMany({
      where: { is_active: true },
      orderBy: { kode: 'asc' },
      select: { id: true, kode: true },
    }),
  ['active-jurusan-list'],
  { revalidate: 1800, tags: ['master-data'] }
);
