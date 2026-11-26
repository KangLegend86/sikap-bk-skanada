import { redirect } from 'next/navigation';
import { ClipboardList, MessageSquare } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  formatNamaGuru,
  formatTanggalIndo,
  getMajorBadgeClass,
} from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';
import { PjrFeedbackFormClient } from '@/components/pjr/PjrFeedbackFormClient';


export default async function PjrKasusPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GURU_PJR') {
    redirect(session.role === 'ADMIN' ? '/admin' : '/');
  }

  const ruangId = session.ruangKelasId;
  const namaRuang = session.namaRuang ?? '-';

  const journals = ruangId
    ? await prisma.jurnalBk.findMany({
        where: {
          is_shared_with_pjr: true,
          siswa: { ruang_kelas_id: ruangId },
        },
        orderBy: [{ tanggal_konseling: 'desc' }, { created_at: 'desc' }],
        include: {
          siswa: { include: { jurusan: true } },
          guru_bk: true,
          kategori: { include: { kategori: true } },
          feedback: {
            orderBy: { created_at: 'desc' },
            include: {
              user_pjr: { include: { pegawai: true } },
            },
          },
        },
      })
    : [];

  return (
    <AppShell
      session={session}
      title={`Pantauan Kasus ${namaRuang}`}
      subtitle="Jurnal konseling yang dibagikan Guru BK untuk dipantau bersama"
    >
      {journals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <ClipboardList className="mx-auto h-9 w-9 text-zinc-300" />
          <p className="mt-2 text-sm font-semibold text-zinc-700">
            Belum ada kasus yang dibagikan ke PJR {namaRuang}.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Jurnal hanya tampil di sini apabila Guru BK mengaktifkan opsi bagikan ke PJR.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map((item) => (
            <article
              key={item.id}
              id={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-900">
                      {item.siswa.nama_lengkap}
                    </h2>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {item.snapshot_ruang}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${getMajorBadgeClass(
                        item.siswa.jurusan.kode
                      )}`}
                    >
                      {item.siswa.jurusan.kode}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatTanggalIndo(item.tanggal_konseling)} • Guru BK:{' '}
                    {formatNamaGuru(item.guru_bk.nama_lengkap)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === 'SELESAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status === 'SELESAI' ? 'Selesai' : 'Dalam Proses'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.kategori.map((k) => (
                  <span
                    key={k.kategori_id}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                  >
                    #{k.kategori.nama_kategori}
                  </span>
                ))}
              </div>

              {/* Full content visible since is_shared_with_pjr = true */}
              <div className="mt-4 space-y-2.5 rounded-lg bg-zinc-50 p-3.5 text-sm text-zinc-800">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Permasalahan:
                  </span>
                  <p className="mt-0.5 whitespace-pre-line">{item.permasalahan}</p>
                </div>
                {item.kendala && (
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      Kendala:
                    </span>
                    <p className="mt-0.5 whitespace-pre-line">{item.kendala}</p>
                  </div>
                )}
                {item.solusi && (
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      Solusi:
                    </span>
                    <p className="mt-0.5 whitespace-pre-line">{item.solusi}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Tindak Lanjut:
                  </span>
                  <p className="mt-0.5 whitespace-pre-line">{item.tindak_lanjut}</p>
                </div>
                {item.catatan && (
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase">
                      Catatan BK:
                    </span>
                    <p className="mt-0.5 whitespace-pre-line">{item.catatan}</p>
                  </div>
                )}
              </div>

              {/* Existing feedback + form */}
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                  <MessageSquare className="h-3.5 w-3.5 text-[#047857]" />
                  Riwayat Pantauan PJR ({item.feedback.length})
                </h3>

                {item.feedback.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {item.feedback.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-zinc-500">
                          <span className="font-semibold text-zinc-800">
                            {formatNamaGuru(fb.user_pjr.pegawai.nama_lengkap)}
                          </span>
                          <span>{formatTanggalIndo(fb.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm text-zinc-800">
                          {fb.pesan_pantauan}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <PjrFeedbackFormClient jurnalId={item.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

