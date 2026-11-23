import { redirect } from 'next/navigation';
import { Lock, User } from 'lucide-react';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { UsernameFormClient } from '@/components/akun/UsernameFormClient';
import { PasswordFormClient } from '@/components/akun/PasswordFormClient';

export default async function PengaturanAkunPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const backHref =
    session.role === 'ADMIN'
      ? '/admin'
      : session.role === 'GURU_PJR'
        ? '/pjr'
        : '/';

  return (
    <AppShell session={session} title="Setting Akun" backHref={backHref}>
      <div className="mx-auto max-w-xl space-y-4">
        {/* Ringkasan Kredensial Saat Ini */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07),0_1px_3px_-1px_rgba(15,23,42,0.04)]">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h2 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
              Kredensial Login Saat Ini
            </h2>
          </div>
          <dl className="divide-y divide-zinc-100">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#047857]">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium text-zinc-400">
                  Username
                </dt>
                <dd className="truncate text-sm font-semibold text-zinc-900">
                  {session.username}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-medium text-zinc-400">
                  Password
                </dt>
                <dd className="flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-900">
                  <span>••••••••</span>
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-zinc-500">
                    Terenkripsi
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Form Ubah Username */}
        <UsernameFormClient currentUsername={session.username} />

        {/* Form Ubah Password (komponen yang sama dengan menu Ubah Password) */}
        <PasswordFormClient />
      </div>
    </AppShell>
  );
}
