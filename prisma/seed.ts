import { PrismaClient, Role, JenisKelamin } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding data eJurnal BK Skanada...');

  // 1. Seed 6 Jurusan Skanada
  const jurusanList = [
    { kode: 'TKR', nama_lengkap: 'Teknik Kendaraan Ringan' },
    { kode: 'TSM', nama_lengkap: 'Teknik Sepeda Motor' },
    { kode: 'TKJ', nama_lengkap: 'Teknik Komputer dan Jaringan' },
    { kode: 'DKV', nama_lengkap: 'Desain Komunikasi Visual' },
    { kode: 'BISDIG', nama_lengkap: 'Bisnis Digital' },
    { kode: 'DPB', nama_lengkap: 'Desain dan Produksi Busana' },
  ];

  for (const j of jurusanList) {
    await prisma.jurusan.upsert({
      where: { kode: j.kode },
      update: { nama_lengkap: j.nama_lengkap },
      create: j,
    });
  }
  console.log('✅ 6 Jurusan berhasil di-seed');

  // 2. Seed Ruang Kelas (X-A s/d XII-E)
  const tingkatList = ['X', 'XI', 'XII'];
  const abjadList = ['A', 'B', 'C', 'D', 'E'];

  for (const tingkat of tingkatList) {
    for (const abjad of abjadList) {
      const nama_ruang = `${tingkat}-${abjad}`;
      await prisma.ruangKelas.upsert({
        where: { nama_ruang },
        update: { tingkat },
        create: { nama_ruang, tingkat },
      });
    }
  }
  console.log('✅ Ruang Kelas (X-A s/d XII-E) berhasil di-seed');

  // 3. Seed Kategori BK Default
  const kategoriList = ['Kedisiplinan', 'Belajar', 'Pribadi', 'Sosial', 'Karir'];
  for (const nama_kategori of kategoriList) {
    await prisma.kategoriBk.upsert({
      where: { nama_kategori },
      update: {},
      create: { nama_kategori },
    });
  }
  console.log('✅ Kategori BK default berhasil di-seed');

  // 4. Seed Pegawai & User Accounts
  const defaultPasswordHash = await bcrypt.hash('skanada2026', 10);

  const ruang12A = await prisma.ruangKelas.findUniqueOrThrow({ where: { nama_ruang: 'XII-A' } });
  const ruang11D = await prisma.ruangKelas.findUniqueOrThrow({ where: { nama_ruang: 'XI-D' } });

  // Pegawai 1: Bu Siti Aminah (Admin / Koordinator BK & Merangkap PJR XII-A)
  const pegSiti = await prisma.pegawai.upsert({
    where: { nip_nik: '198503152010012001' },
    update: {},
    create: {
      nip_nik: '198503152010012001',
      nama_lengkap: 'Siti Aminah',
      gelar: 'S.Pd',
      jenis_kelamin: JenisKelamin.P,
      no_whatsapp: '6281234567890',
    },
  });

  await prisma.userAccount.upsert({
    where: { username: 'admin.bk' },
    update: {},
    create: {
      username: 'admin.bk',
      password_hash: defaultPasswordHash,
      role: Role.ADMIN,
      pegawai_id: pegSiti.id,
    },
  });

  await prisma.userAccount.upsert({
    where: { username: 'bk.siti' },
    update: {},
    create: {
      username: 'bk.siti',
      password_hash: defaultPasswordHash,
      role: Role.GURU_BK,
      pegawai_id: pegSiti.id,
    },
  });

  await prisma.userAccount.upsert({
    where: { username: 'pjr.12a' },
    update: {},
    create: {
      username: 'pjr.12a',
      password_hash: defaultPasswordHash,
      role: Role.GURU_PJR,
      pegawai_id: pegSiti.id,
      ruang_kelas_id: ruang12A.id,
    },
  });

  // Pegawai 2: Pak Ahmad Farhan (Guru BK Anggota)
  const pegFarhan = await prisma.pegawai.upsert({
    where: { nip_nik: '199201102019031002' },
    update: {},
    create: {
      nip_nik: '199201102019031002',
      nama_lengkap: 'Ahmad Farhan',
      gelar: 'S.Sos',
      jenis_kelamin: JenisKelamin.L,
      no_whatsapp: '6281345678901',
    },
  });

  await prisma.userAccount.upsert({
    where: { username: 'bk.farhan' },
    update: {},
    create: {
      username: 'bk.farhan',
      password_hash: defaultPasswordHash,
      role: Role.GURU_BK,
      pegawai_id: pegFarhan.id,
    },
  });

  // Pegawai 3: Pak Bambang Sutrisno (PJR XI-D)
  const pegBambang = await prisma.pegawai.upsert({
    where: { nip_nik: '198807202015021003' },
    update: {},
    create: {
      nip_nik: '198807202015021003',
      nama_lengkap: 'Bambang Sutrisno',
      gelar: 'S.Pd',
      jenis_kelamin: JenisKelamin.L,
      no_whatsapp: '6281298765432',
    },
  });

  await prisma.userAccount.upsert({
    where: { username: 'pjr.11d' },
    update: {},
    create: {
      username: 'pjr.11d',
      password_hash: defaultPasswordHash,
      role: Role.GURU_PJR,
      pegawai_id: pegBambang.id,
      ruang_kelas_id: ruang11D.id,
    },
  });

  console.log('✅ Pegawai & Akun Login (admin.bk, bk.siti, bk.farhan, pjr.12a, pjr.11d) berhasil di-seed');

  // 5. Seed Contoh Siswa (Tanpa NISN)
  const existingSiswaCount = await prisma.siswa.count();
  if (existingSiswaCount === 0) {
    const tkj = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'TKJ' } });
    const tkr = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'TKR' } });
    const bisdig = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'BISDIG' } });
    const dkv = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'DKV' } });
    const tsm = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'TSM' } });
    const dpb = await prisma.jurusan.findUniqueOrThrow({ where: { kode: 'DPB' } });

    const ruang10A = await prisma.ruangKelas.findUniqueOrThrow({ where: { nama_ruang: 'X-A' } });
    const ruang11B = await prisma.ruangKelas.findUniqueOrThrow({ where: { nama_ruang: 'XI-B' } });
    const ruang12E = await prisma.ruangKelas.findUniqueOrThrow({ where: { nama_ruang: 'XII-E' } });

    await prisma.siswa.createMany({
      data: [
        {
          no_absen: 1,
          nama_lengkap: 'Ahmad Dani Pratama',
          jenis_kelamin: JenisKelamin.L,
          jurusan_id: tkj.id,
          ruang_kelas_id: ruang12A.id,
          nama_wali: 'Slamet Pratama',
          no_hp_ortu: '6281234567811',
        },
        {
          no_absen: 2,
          nama_lengkap: 'Budi Santoso',
          jenis_kelamin: JenisKelamin.L,
          jurusan_id: tkr.id,
          ruang_kelas_id: ruang12A.id,
        },
        {
          no_absen: 5,
          nama_lengkap: 'Citra Lestari',
          jenis_kelamin: JenisKelamin.P,
          jurusan_id: bisdig.id,
          ruang_kelas_id: ruang11D.id,
          nama_wali: 'Dewi Ratnasari',
          no_hp_ortu: '6281345678933',
        },
        {
          no_absen: 8,
          nama_lengkap: 'Dimas Bagus Saputra',
          jenis_kelamin: JenisKelamin.L,
          jurusan_id: dkv.id,
          ruang_kelas_id: ruang10A.id,
        },
        {
          no_absen: 12,
          nama_lengkap: 'Fajar Ramadhan',
          jenis_kelamin: JenisKelamin.L,
          jurusan_id: tsm.id,
          ruang_kelas_id: ruang12E.id,
          nama_wali: 'Agus Salim',
          no_hp_ortu: '6282123456766',
        },
        {
          no_absen: 14,
          nama_lengkap: 'Nadia Putri Rahmawati',
          jenis_kelamin: JenisKelamin.P,
          jurusan_id: dpb.id,
          ruang_kelas_id: ruang11B.id,
        },
      ],
    });
    console.log('✅ Data contoh siswa berhasil di-seed');
  }

  console.log('🎉 Seeding eJurnal BK Skanada selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

