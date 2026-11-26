import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, type JenisKelamin } from '@prisma/client';

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

    if (!namaRaw) continue;

    const jenisKelamin: JenisKelamin = jkRaw === 'L' ? 'L' : 'P';

    rows.push({
      no: Number.isFinite(no) ? no : i,
      namaLengkap: namaRaw.trim(),
      pjrRuang: pjrRaw || null,
      isGuruBk: bkRaw === 'iya' || bkRaw === 'ya' || bkRaw === 'true',
      jenisKelamin,
    });
  }

  return rows;
}

function makePjrUsername(namaRuang: string): string {
  return `pjr.${namaRuang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

function makeBkUsername(namaLengkap: string): string {
  const lower = namaLengkap.toLowerCase();
  if (lower.includes('zumrotus')) return 'bk.zumrotus';
  if (lower.includes('sulistiani')) return 'bk.sulis';
  const firstWord = lower.replace(/[^a-z\s]/g, '').trim().split(/\s+/)[0] || 'guru';
  return `bk.${firstWord}`;
}

async function main() {
  console.log('📂 Membaca file:', CSV_PATH);
  const rows = parseCsv(CSV_PATH);
  console.log(`✅ Terbaca ${rows.length} data guru.`);

  const jurnalBefore = await prisma.jurnalBk.count();
  console.log(`🛡️  Total Jurnal BK sebelum import: ${jurnalBefore}`);

  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Ambil daftar ruang kelas yang ada
  const ruangList = await prisma.ruangKelas.findMany();
  const ruangMap = new Map(ruangList.map((r) => [r.nama_ruang.toUpperCase(), r.id]));

  // Ambil pegawai yang sudah ada untuk pencocokan non-destruktif
  const existingPegawai = await prisma.pegawai.findMany();
  const pegawaiByName = new Map(
    existingPegawai.map((p) => [p.nama_lengkap.trim().toLowerCase(), p])
  );

  // Cari akun bk.siti atau pegawai Zumrotus lama agar relasi JurnalBk tetap 100% utuh
  const bkSitiAccount = await prisma.userAccount.findFirst({
    where: { username: { in: ['bk.siti', 'bk.zumrotus'] } },
  });
  const zumrotusExistingPegawai =
    existingPegawai.find((p) => p.id === ZUMROTUS_EXISTING_PEGAWAI_ID) ??
    (bkSitiAccount
      ? existingPegawai.find((p) => p.id === bkSitiAccount.pegawai_id)
      : undefined);

  const activeSyncedUsernames = new Set<string>();
  let pegawaiCreated = 0;
  let pegawaiUpdated = 0;
  const createdOrUpdatedAccounts: {
    role: string;
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
      console.log(
        `🔄 Update Pegawai lama (${updated.id}) -> ${updated.nama_lengkap}`
      );
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

    const displayName = row.namaLengkap;

    // 1. Akun GURU_BK
    if (row.isGuruBk) {
      const bkUsername = makeBkUsername(row.namaLengkap);
      activeSyncedUsernames.add(bkUsername);

      if (isZumrotus && bkSitiAccount) {
        await prisma.userAccount.update({
          where: { id: bkSitiAccount.id },
          data: {
            username: bkUsername,
            role: 'GURU_BK',
            pegawai_id: pegawaiId,
            ruang_kelas_id: null,
            is_active: true,
          },
        });
      } else {
        await prisma.userAccount.upsert({
          where: { username: bkUsername },
          update: {
            role: 'GURU_BK',
            pegawai_id: pegawaiId,
            ruang_kelas_id: null,
            is_active: true,
          },
          create: {
            username: bkUsername,
            password_hash: defaultHash,
            role: 'GURU_BK',
            pegawai_id: pegawaiId,
            is_active: true,
          },
        });
      }

      createdOrUpdatedAccounts.push({
        role: 'GURU_BK',
        username: bkUsername,
        nama: displayName,
        ruang: '-',
      });
    }

    // 2. Akun GURU_PJR
    if (row.pjrRuang) {
      let ruangId = ruangMap.get(row.pjrRuang);
      if (!ruangId) {
        const tingkat = row.pjrRuang.split('-')[0] || 'X';
        const createdRuang = await prisma.ruangKelas.create({
          data: { nama_ruang: row.pjrRuang, tingkat, is_active: true },
        });
        ruangId = createdRuang.id;
        ruangMap.set(row.pjrRuang, ruangId);
        console.log(`➕ Membuat RuangKelas baru: ${row.pjrRuang}`);
      }

      const pjrUsername = makePjrUsername(row.pjrRuang);
      activeSyncedUsernames.add(pjrUsername);

      await prisma.userAccount.upsert({
        where: { username: pjrUsername },
        update: {
          role: 'GURU_PJR',
          pegawai_id: pegawaiId,
          ruang_kelas_id: ruangId,
          is_active: true,
        },
        create: {
          username: pjrUsername,
          password_hash: defaultHash,
          role: 'GURU_PJR',
          pegawai_id: pegawaiId,
          ruang_kelas_id: ruangId,
          is_active: true,
        },
      });

      createdOrUpdatedAccounts.push({
        role: 'GURU_PJR',
        username: pjrUsername,
        nama: displayName,
        ruang: row.pjrRuang,
      });
    }
  }

  // Nonaktifkan akun dummy lama GURU_BK / GURU_PJR yang tidak ada di CSV (ADMIN tetap aman!)
  const deactivated = await prisma.userAccount.updateMany({
    where: {
      role: { in: ['GURU_BK', 'GURU_PJR'] },
      username: { notIn: Array.from(activeSyncedUsernames) },
      is_active: true,
    },
    data: { is_active: false },
  });

  const jurnalAfter = await prisma.jurnalBk.count();
  const totalPegawai = await prisma.pegawai.count();

  console.log('\n=== RINGKASAN IMPORT GURU ===');
  console.log(`Pegawai baru    : ${pegawaiCreated}`);
  console.log(`Pegawai diupdate: ${pegawaiUpdated}`);
  console.log(`Total Pegawai   : ${totalPegawai}`);
  console.log(`Akun aktif CSV  : ${createdOrUpdatedAccounts.length}`);
  console.log(`Akun lama off   : ${deactivated.count}`);
  console.log(`Jurnal BK       : ${jurnalBefore} -> ${jurnalAfter} (100% AMAN!)`);
  console.log(`Password default akun baru: ${DEFAULT_PASSWORD}\n`);
  console.log('=== DAFTAR AKUN AKTIF (BK & PJR) ===');
  for (const acc of createdOrUpdatedAccounts) {
    console.log(
      `${acc.role.padEnd(9)} | ${acc.username.padEnd(13)} | ${acc.ruang.padEnd(5)} | ${acc.nama}`
    );
  }
}

main()
  .catch((err) => {
    console.error('❌ Error import guru:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
