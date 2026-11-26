import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/layout/AppShell';
import { EditProfileFormClient } from '@/components/akun/EditProfileFormClient';

export default async function EditProfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const pegawai = await prisma.pegawai.findUnique({
    where: { id: session.pegawaiId },
  });

  return (
    <AppShell session={session} title="Ubah Profil" backHref="/akun/profil">
      <div className="mx-auto max-w-xl">
        <EditProfileFormClient
          namaLengkap={pegawai?.nama_lengkap ?? session.namaLengkap}
          jenisKelamin={pegawai?.jenis_kelamin ?? session.jenisKelamin}
          noWhatsapp={pegawai?.no_whatsapp ?? null}
        />
      </div>
    </AppShell>
  );
}
