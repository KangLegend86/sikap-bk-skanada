/* eslint-disable */
/**
 * ============================================================================
 * GOOGLE APPS SCRIPT — JEMBATAN UPLOAD & HAPUS FOTO HOME VISIT SiKAP BK SKANADA
 * ============================================================================
 *
 * CARA PASANG (1x saja — 2 menit):
 * 1. Buka https://script.google.com menggunakan akun Google yang ingin dipakai
 *    (sekarang bisa akun pribadi; nanti tinggal ulangi di akun sekolah).
 * 2. Klik "Project Baru" (New Project), beri nama: "SiKAP BK - Upload Home Visit".
 * 3. Hapus isi default, lalu copy-paste seluruh kode file ini.
 * 4. Ganti nilai `SECRET_KEY` di bawah sesuai yang ada di `.env` (`GDRIVE_SCRIPT_SECRET`).
 *    (Opsional: Jika ingin memakai folder induk yang sudah ada, isi `ROOT_FOLDER_ID`;
 *     jika dibiarkan kosong '', script otomatis membuat folder "SiKAP BK Skanada" di My Drive.)
 * 5. Klik "Terapkan" (Deploy) -> "Deployment baru" (New deployment):
 *    - Jenis: Aplikasi Web (Web app)
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 6. Klik "Terapkan" -> Izinkan akses Google Drive -> Salin URL Web App.
 * 7. Tempel URL tersebut ke file `.env` Next.js:
 *      GDRIVE_SCRIPT_URL="https://script.google.com/macros/s/..../exec"
 *      GDRIVE_SCRIPT_SECRET="rahasia-sikap-skanada-2026"
 *
 * CARA PINDAH KE AKUN GOOGLE SEKOLAH NANTI:
 * - Cukup ulangi langkah 1–7 di akun sekolah, lalu ganti `GDRIVE_SCRIPT_URL` di `.env`
 *   (dan di Environment Variables Vercel/server). Tidak perlu ubah kode Next.js!
 */

const SECRET_KEY = 'rahasia-sikap-skanada-2026'; // Samakan dengan GDRIVE_SCRIPT_SECRET di .env
const ROOT_FOLDER_ID = ''; // Kosongkan agar otomatis membuat folder "SiKAP BK Skanada"
const ROOT_FOLDER_NAME = 'SiKAP BK Skanada';

const BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  if (iter.hasNext()) {
    return iter.next();
  }
  return parent.createFolder(name);
}

function getRootFolder() {
  if (ROOT_FOLDER_ID) {
    return DriveApp.getFolderById(ROOT_FOLDER_ID);
  }
  return getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
}

function getTargetHomeVisitFolder(tanggalIso) {
  const date = tanggalIso ? new Date(tanggalIso) : new Date();
  const year = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  const monthIdx = isNaN(date.getTime()) ? new Date().getMonth() : date.getMonth(); // 0..11
  const monthNum = String(monthIdx + 1).padStart(2, '0');

  // Tahun Ajaran: Jul-Des -> TA YYYY-(YYYY+1), Jan-Jun -> TA (YYYY-1)-YYYY
  const taStart = monthIdx >= 6 ? year : year - 1;
  const taFolderName = 'TA ' + taStart + '-' + (taStart + 1);
  const bulanFolderName = year + '-' + monthNum + ' (' + BULAN_INDO[monthIdx] + ')';

  const root = getRootFolder();
  const hvFolder = getOrCreateFolder(root, 'Home Visit');
  const taFolder = getOrCreateFolder(hvFolder, taFolderName);
  return getOrCreateFolder(taFolder, bulanFolderName);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    if (!payload.secret || payload.secret !== SECRET_KEY) {
      return jsonResponse({ ok: false, error: 'Unauthorized: secret tidak cocok.' });
    }

    const action = payload.action;

    if (action === 'upload') {
      const base64Data = String(payload.base64Data || '');
      const mimeType = String(payload.mimeType || 'image/jpeg');
      const fileName = String(payload.fileName || 'home-visit.jpg');
      const tanggalIso = String(payload.tanggalIso || '');

      if (!base64Data) {
        return jsonResponse({ ok: false, error: 'Data foto kosong.' });
      }

      const bytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(bytes, mimeType, fileName);
      const folder = getTargetHomeVisitFolder(tanggalIso);
      const file = folder.createFile(blob);

      // Agar dapat dirender oleh proxy gambar aplikasi & dibuka lewat tombol "Buka di Drive"
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return jsonResponse({
        ok: true,
        fileId: file.getId(),
        fileName: file.getName(),
        webViewLink: file.getUrl(),
      });
    }

    if (action === 'delete') {
      const fileId = String(payload.fileId || '').trim();
      if (!fileId) {
        return jsonResponse({ ok: false, error: 'fileId wajib diisi.' });
      }

      try {
        const file = DriveApp.getFileById(fileId);
        file.setTrashed(true);
      } catch (err) {
        // Jika file sudah terhapus sebelumnya, tetap anggap berhasil
      }

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Action tidak dikenal: ' + action });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}
