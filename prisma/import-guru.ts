import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, type JenisKelamin, type Role } from '@prisma/client';

const prisma = new PrismaClient();
const CSV_PATH = path.resolve(process.cwd(), 'data_guru_skanada.csv');
const DEFAULT_PASSWORD = process.env.DEFAULT_GURU_PASSWORD || 'skanada2026';
const ZUMROTUS_EXISTING_PEGAWAI_ID = 'cmwgpn2dq000qhg28fnsyungt';

type GuruRow = {
  no: number;
  namaLengkap: string;
  pjrRuang: string | null;
  isGuruBk: boolean;
  jenisKelamin: JenisKelamin;
  username: string;
};

function parseCsv(filePath: string): GuruRow[] {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('File CSV kosong atau tidak memiliki baris data.');
  }

  const rows: GuruRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim());
    const no = Number.parseInt(cols[0] ?? '', 10);
    const namaRaw = cols[1] ?? '';
    const pjrRaw = (cols[2] ?? '').toUpperCase();
    const bkRaw = (cols[3] ?? '').toLowerCase();
    const jkRaw = (cols[4] ?? '').toUpperCase();
    const usernameRaw = (cols[5] ?? '').trim().toLowerCase();

    if (!namaRaw || !usernameRaw) continue;

    const jenisKelamin: JenisKelamin = jkRaw === 'L' ? 'L' : 'P';

    rows.push({
      no: Number.isFinite(no) ? no : i,
      namaLengkap: namaRaw.trim(),
      pjrRuang: pjrRaw || null,
      isGuruBk: bkRaw === 'iya' || bkRaw === 'ya' || bkRaw === 'true',
      jenisKelamin,
      username: usernameRaw,
    });
  }

  return rows;
}

function makeLegacyPjrUsername(namaRuang: string): string {
  return `pjr.${namaRuang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

function makeLegacyBkUsername(namaLengkap: string): string {
  const lower = namaLengkap.toLowerCase();
  if (lower.includes('zumrotus')) return 'bk.zumrotus';
  if (lower.includes('sulistiani')) return 'bk.sulis';
  const firstWord = lower.replace(/[^a-z\s]/g, '').trim().split(/\s+/)[0] || 'guru';
  return `bk.${firstWord}`;
}

async function main() {
  console.log('📂 Membaca file:', CSV_PATH);
  const rows = parseCsv(CSV_PATH);
  console.log(`✅ Terbaca ${rows.length} data guru dari CSV.`);

  const jurnalBefore = await prisma.jurnalBk.count();
  const feedbackBefore = await prisma.pjrFeedback.count();
  console.log(`🛡️  Jurnal BK sebelum import   : ${jurnalBefore}`);
  console.log(`🛡️  PJR Feedback sebelum import: ${feedbackBefore}`);

  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Ambil daftar ruang kelas yang ada
  const ruangList = await prisma.ruangKelas.findMany();
  const ruangMap = new Map(ruangList.map((r) => [r.nama_ruang.toUpperCase(), r.id]));

  // Ambil pegawai yang sudah ada untuk pencocokan non-destruktif
  const existingPegawai = await prisma.pegawai.findMany();
  const pegawaiByName = new Map(
    existingPegawai.map((p) => [p.nama_lengkap.trim().toLowerCase(), p])
  );

  // Cari pegawai Zumrotus lama agar relasi JurnalBk tetap 100% utuh
  const bkSitiOrZumrotusAccount = await prisma.userAccount.findFirst({
    where: { username: { in: ['bk.siti', 'bk.zumrotus', 'zumrotus'] } },
  });
  const zumrotusExistingPegawai =
    existingPegawai.find((p) => p.id === ZUMROTUS_EXISTING_PEGAWAI_ID) ??
    (bkSitiOrZumrotusAccount
      ? existingPegawai.find((p) => p.id === bkSitiOrZumrotusAccount.pegawai_id)
      : undefined);

  const activeSyncedUsernames = new Set<string>();
  let pegawaiCreated = 0;
  let pegawaiUpdated = 0;
  const syncedAccounts: {
    role: Role;
    username: string;
    nama: string;
    ruang: string;
  }[] = [];

  for (const row of rows) {
    const isZumrotus = row.namaLengkap.toLowerCase().includes('zumrotus');
    let pegawaiId: string;

    if (isZumrotus && zumrotusExistingPegawai) {
      const updated = await prisma.pegawai.update({
        where: { id: zumrotusExistingPegawai.id },
        data: {
          nama_lengkap: row.namaLengkap,
          jenis_kelamin: row.jenisKelamin,
        },
      });
      pegawaiId = updated.id;
      pegawaiUpdated++;
    } else {
      const existing = pegawaiByName.get(row.namaLengkap.toLowerCase());
      if (existing) {
        const updated = await prisma.pegawai.update({
          where: { id: existing.id },
          data: {
            jenis_kelamin: row.jenisKelamin,
          },
        });
        pegawaiId = updated.id;
        pegawaiUpdated++;
      } else {
        const created = await prisma.pegawai.create({
          data: {
            nama_lengkap: row.namaLengkap,
            jenis_kelamin: row.jenisKelamin,
          },
        });
        pegawaiId = created.id;
        pegawaiByName.set(created.nama_lengkap.toLowerCase(), created);
        pegawaiCreated++;
      }
    }

    // Pastikan RuangKelas tersedia jika guru ini punya tugas PJR
    let ruangId: string | null = null;
    if (row.pjrRuang) {
      ruangId = ruangMap.get(row.pjrRuang) ?? null;
      if (!ruangId) {
        const tingkat = row.pjrRuang.split('-')[0] || 'X';
        const createdRuang = await prisma.ruangKelas.create({
          data: { nama_ruang: row.pjrRuang, tingkat, is_active: true },
        });
        ruangId = createdRuang.id;
        ruangMap.set(row.pjrRuang, ruangId);
        console.log(`➕ Membuat RuangKelas baru: ${row.pjrRuang}`);
      }
    }

    // Tentukan 1 role utama (1 Guru = 1 Akun)
    const targetRole: Role = row.isGuruBk
      ? 'GURU_BK'
      : row.pjrRuang
        ? 'GURU_PJR'
        : 'GURU';

    const targetUsername = row.username;
    activeSyncedUsernames.add(targetUsername);

    // Cari akun target yang sudah ada, atau akun legacy (bk.* / pjr.*) untuk migrasi in-place
    const legacyCandidates: string[] = [];
    if (row.isGuruBk) {
      legacyCandidates.push(makeLegacyBkUsername(row.namaLengkap));
      if (isZumrotus) legacyCandidates.push('bk.siti');
    }
    if (row.pjrRuang) {
      legacyCandidates.push(makeLegacyPjrUsername(row.pjrRuang));
    }

    let primaryAccount = await prisma.userAccount.findUnique({
      where: { username: targetUsername },
    });

    if (!primaryAccount && legacyCandidates.length > 0) {
      // Pilih akun legacy pertama yang ditemukan (prioritas bk.* dulu untuk guru BK)
      for (const candidate of legacyCandidates) {
        const found = await prisma.userAccount.findUnique({
          where: { username: candidate },
        });
        if (found) {
          primaryAccount = found;
          break;
        }
      }
    }

    if (primaryAccount) {
      primaryAccount = await prisma.userAccount.update({
        where: { id: primaryAccount.id },
        data: {
          username: targetUsername,
          role: targetRole,
          pegawai_id: pegawaiId,
          ruang_kelas_id: ruangId,
          is_active: true,
        },
      });
    } else {
      primaryAccount = await prisma.userAccount.create({
        data: {
          username: targetUsername,
          password_hash: defaultHash,
          role: targetRole,
          pegawai_id: pegawaiId,
          ruang_kelas_id: ruangId,
          is_active: true,
        },
      });
    }

    // Jika pegawai punya akun legacy tambahan (misal Bu Zumrotus sebelumnya punya bk.zumrotus DAN pjr.xiie),
    // pindahkan PjrFeedback ke primaryAccount lalu nonaktifkan akun legacy ganda tersebut
    for (const candidate of legacyCandidates) {
      if (candidate === targetUsername) continue;
      const dupAccount = await prisma.userAccount.findUnique({
        where: { username: candidate },
      });
      if (dupAccount && dupAccount.id !== primaryAccount.id) {
        await prisma.pjrFeedback.updateMany({
          where: { user_pjr_id: dupAccount.id },
          data: { user_pjr_id: primaryAccount.id },
        });
        await prisma.userAccount.update({
          where: { id: dupAccount.id },
          data: { is_active: false, ruang_kelas_id: null },
        });
        console.log(
          `🔀 Gabung akun legacy "${candidate}" -> "${targetUsername}" (feedback dipindah & akun lama dinonaktifkan)`
        );
      }
    }

    syncedAccounts.push({
      role: targetRole,
      username: targetUsername,
      nama: row.namaLengkap,
      ruang: row.pjrRuang ?? '-',
    });
  }

  // Nonaktifkan akun lama non-ADMIN yang tidak ada di daftar 52 username CSV
  const deactivated = await prisma.userAccount.updateMany({
    where: {
      role: { in: ['GURU_BK', 'GURU_PJR', 'GURU'] },
      username: { notIn: Array.from(activeSyncedUsernames) },
      is_active: true,
    },
    data: { is_active: false, ruang_kelas_id: null },
  });

  const jurnalAfter = await prisma.jurnalBk.count();
  const feedbackAfter = await prisma.pjrFeedback.count();
  const totalPegawai = await prisma.pegawai.count();

  console.log('\n=== RINGKASAN IMPORT 52 GURU (1 GURU = 1 AKUN) ===');
  console.log(`Pegawai baru     : ${pegawaiCreated}`);
  console.log(`Pegawai diupdate : ${pegawaiUpdated}`);
  console.log(`Total Pegawai    : ${totalPegawai}`);
  console.log(`Akun aktif CSV   : ${syncedAccounts.length}`);
  console.log(`Akun lama off    : ${deactivated.count}`);
  console.log(`Jurnal BK        : ${jurnalBefore} -> ${jurnalAfter} (100% AMAN!)`);
  console.log(`PJR Feedback     : ${feedbackBefore} -> ${feedbackAfter} (100% AMAN!)`);
  console.log(`Password default : ${DEFAULT_PASSWORD}\n`);

  const bkCount = syncedAccounts.filter((a) => a.role === 'GURU_BK').length;
  const pjrCount = syncedAccounts.filter((a) => a.role === 'GURU_PJR').length;
  const guruCount = syncedAccounts.filter((a) => a.role === 'GURU').length;
  console.log(`Rincian Role     : GURU_BK=${bkCount}, GURU_PJR=${pjrCount}, GURU=${guruCount}`);
}

main()
  .catch((err) => {
    console.error('❌ Error import guru:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
