import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, JenisKelamin } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_PATH = path.resolve(process.cwd(), 'DATA_SISWA_SKANADA.csv');

const MASTER_JURUSAN = [
  { kode: 'TKR', nama_lengkap: 'Teknik Kendaraan Ringan' },
  { kode: 'TSM', nama_lengkap: 'Teknik Sepeda Motor' },
  { kode: 'TKJ', nama_lengkap: 'Teknik Komputer dan Jaringan' },
  { kode: 'DKV', nama_lengkap: 'Desain Komunikasi Visual' },
  { kode: 'BISDIG', nama_lengkap: 'Bisnis Digital' },
  { kode: 'BISDIG 1', nama_lengkap: 'Bisnis Digital 1' },
  { kode: 'BISDIG 2', nama_lengkap: 'Bisnis Digital 2' },
  { kode: 'DPB', nama_lengkap: 'Desain dan Produksi Busana' },
] as const;

const JURUSAN_TYPO_MAP: Record<string, string> = {
  'BISGID 2': 'BISDIG 2',
  'X TSM': 'TSM',
};

interface ParsedSiswaRow {
  lineNumber: number;
  no_absen: number | null;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  jurusan_kode: string;
  ruang_nama: string;
  nama_wali: string | null;
  no_hp_ortu: string | null;
}

function normalizeJurusan(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ').toUpperCase();
  return JURUSAN_TYPO_MAP[cleaned] ?? cleaned;
}

function parseCsvRows(filePath: string): ParsedSiswaRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File CSV tidak ditemukan: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = rawContent.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('File CSV kosong atau tidak memiliki baris data.');
  }

  const validJurusanCodes = new Set<string>(MASTER_JURUSAN.map((j) => j.kode));
  const rows: ParsedSiswaRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const cols = lines[i].split(';').map((c) => c.trim());

    if (cols.length < 6) {
      throw new Error(`Baris ${lineNumber}: jumlah kolom kurang dari 6.`);
    }

    const [, rawAbsen, rawNama, rawJk, rawJurusan, rawRuang, rawWali = '', rawHp = ''] = cols;

    if (!rawNama) {
      throw new Error(`Baris ${lineNumber}: nama_lengkap kosong.`);
    }

    const jkUpper = rawJk.toUpperCase();
    if (jkUpper !== 'L' && jkUpper !== 'P') {
      throw new Error(`Baris ${lineNumber} (${rawNama}): jenis_kelamin tidak valid "${rawJk}".`);
    }

    const jurusanKode = normalizeJurusan(rawJurusan);
    if (!validJurusanCodes.has(jurusanKode)) {
      throw new Error(`Baris ${lineNumber} (${rawNama}): jurusan tidak dikenal "${rawJurusan}".`);
    }

    if (!rawRuang || !rawRuang.includes('-')) {
      throw new Error(`Baris ${lineNumber} (${rawNama}): format ruang kelas tidak valid "${rawRuang}".`);
    }

    let noAbsen: number | null = null;
    if (rawAbsen !== '') {
      const parsed = Number.parseInt(rawAbsen, 10);
      if (Number.isNaN(parsed)) {
        throw new Error(`Baris ${lineNumber} (${rawNama}): no_absen bukan angka "${rawAbsen}".`);
      }
      noAbsen = parsed;
    }

    rows.push({
      lineNumber,
      no_absen: noAbsen,
      nama_lengkap: rawNama,
      jenis_kelamin: jkUpper === 'L' ? JenisKelamin.L : JenisKelamin.P,
      jurusan_kode: jurusanKode,
      ruang_nama: rawRuang.toUpperCase(),
      nama_wali: rawWali || null,
      no_hp_ortu: rawHp || null,
    });
  }

  return rows;
}

function sortRuangKelas(a: string, b: string): number {
  const tingkatOrder: Record<string, number> = { X: 1, XI: 2, XII: 3 };
  const [tingkatA, abjadA = ''] = a.split('-');
  const [tingkatB, abjadB = ''] = b.split('-');
  const diff = (tingkatOrder[tingkatA] ?? 99) - (tingkatOrder[tingkatB] ?? 99);
  return diff !== 0 ? diff : abjadA.localeCompare(abjadB);
}

async function main() {
  console.log('📂 Membaca file:', CSV_PATH);
  const rows = parseCsvRows(CSV_PATH);
  const uniqueRuangList = [...new Set(rows.map((r) => r.ruang_nama))].sort(sortRuangKelas);

  console.log(`✅ Terbaca ${rows.length} baris siswa valid dari ${uniqueRuangList.length} ruang kelas.`);

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Hapus bersih jurnal uji coba, siswa dummy, dan seluruh RuangKelas lama
      // (KategoriBk, Pegawai, dan UserAccount tetap dipertahankan; UserAccount.ruang_kelas_id otomatis SetNull)
      const deletedFeedback = await tx.pjrFeedback.deleteMany();
      const deletedJurnalKat = await tx.jurnalKategori.deleteMany();
      const deletedJurnal = await tx.jurnalBk.deleteMany();
      const deletedSiswa = await tx.siswa.deleteMany();
      const deletedRuang = await tx.ruangKelas.deleteMany();

      // 2. Pastikan master Jurusan lengkap (termasuk BISDIG, BISDIG 1, BISDIG 2)
      const jurusanIdByKode = new Map<string, string>();
      for (const j of MASTER_JURUSAN) {
        const upserted = await tx.jurusan.upsert({
          where: { kode: j.kode },
          update: { nama_lengkap: j.nama_lengkap, is_active: true },
          create: { kode: j.kode, nama_lengkap: j.nama_lengkap, is_active: true },
        });
        jurusanIdByKode.set(j.kode, upserted.id);
      }

      // 3. Isi ulang RuangKelas murni sesuai daftar dari CSV
      const ruangIdByNama = new Map<string, string>();
      for (const namaRuang of uniqueRuangList) {
        const [tingkat] = namaRuang.split('-');
        const created = await tx.ruangKelas.create({
          data: {
            nama_ruang: namaRuang,
            tingkat,
            is_active: true,
          },
        });
        ruangIdByNama.set(namaRuang, created.id);
      }

      // 4. Import seluruh data siswa
      const insertedSiswa = await tx.siswa.createMany({
        data: rows.map((row) => ({
          no_absen: row.no_absen,
          nama_lengkap: row.nama_lengkap,
          jenis_kelamin: row.jenis_kelamin,
          jurusan_id: jurusanIdByKode.get(row.jurusan_kode)!,
          ruang_kelas_id: ruangIdByNama.get(row.ruang_nama)!,
          nama_wali: row.nama_wali,
          no_hp_ortu: row.no_hp_ortu,
          is_active: true,
        })),
      });

      const totalKategori = await tx.kategoriBk.count();
      const totalAkun = await tx.userAccount.count();

      return {
        deletedFeedback: deletedFeedback.count,
        deletedJurnalKat: deletedJurnalKat.count,
        deletedJurnal: deletedJurnal.count,
        deletedSiswa: deletedSiswa.count,
        deletedRuang: deletedRuang.count,
        totalJurusan: jurusanIdByKode.size,
        totalRuangBaru: ruangIdByNama.size,
        insertedSiswa: insertedSiswa.count,
        totalKategori,
        totalAkun,
      };
    },
    { timeout: 30000 }
  );

  console.log('\n🧹 Data lama yang dibersihkan:');
  console.log(`   - PjrFeedback : ${result.deletedFeedback}`);
  console.log(`   - JurnalKat   : ${result.deletedJurnalKat}`);
  console.log(`   - JurnalBk    : ${result.deletedJurnal}`);
  console.log(`   - Siswa       : ${result.deletedSiswa}`);
  console.log(`   - RuangKelas  : ${result.deletedRuang}`);

  console.log('\n✅ Hasil import ke Neon:');
  console.log(`   - Master Jurusan : ${result.totalJurusan}`);
  console.log(`   - RuangKelas     : ${result.totalRuangBaru} (${uniqueRuangList.join(', ')})`);
  console.log(`   - Siswa          : ${result.insertedSiswa}`);
  console.log(`   - Kategori BK    : ${result.totalKategori} (dipertahankan)`);
  console.log(`   - Akun Login     : ${result.totalAkun} (dipertahankan)`);
}

main()
  .catch((err) => {
    console.error('❌ Import gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
