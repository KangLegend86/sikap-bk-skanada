'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Database,
  FileText,
  Home,
  NotebookPen,
  Pencil,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import {
  type AppMode,
  getModeFromPathname,
  readClientSavedMode,
  resolveActiveMode,
  writeClientSavedMode,
} from '@/lib/mode';
import BottomNav, { type BottomNavItem } from '@/components/BottomNav';

const PJR_NAV_ITEMS: BottomNavItem[] = [
  { path: '/pjr', label: 'Beranda', Icon: Home },
  { path: '/pjr/kasus', label: 'Pantauan', Icon: ClipboardList },
  { path: '/pjr/siswa', label: 'Siswa', Icon: Users },
  { path: '/akun/profil', label: 'Profil', Icon: User },
];

const GURU_NAV_ITEMS: BottomNavItem[] = [
  { path: '/guru', label: 'Riwayat', Icon: NotebookPen },
  { path: '/guru/baru', label: 'Catat Sikap', Icon: Pencil, isCenter: true },
  { path: '/akun/profil', label: 'Profil', Icon: User },
];

const ADMIN_NAV_ITEMS: BottomNavItem[] = [
  { path: '/admin', label: 'Beranda', Icon: Home },
  { path: '/admin/rekap', label: 'Rekap', Icon: FileText },
  { path: '/admin/master', label: 'Master', Icon: Database },
  { path: '/admin/users', label: 'Akun', Icon: Shield },
  { path: '/akun/profil', label: 'Profil', Icon: Settings },
];

export function PersistentBottomNav({
  role,
  ruangKelasId = null,
  initialSavedMode = null,
}: {
  role: SessionPayload['role'] | null;
  ruangKelasId?: string | null;
  initialSavedMode?: AppMode | null;
}) {
  const pathname = usePathname();

  // Sinkronkan cookie setiap kali masuk rute yang spesifik ke suatu mode
  useEffect(() => {
    if (!role) return;
    const modeFromPath = getModeFromPathname(pathname);
    if (modeFromPath) {
      writeClientSavedMode(modeFromPath);
    }
  }, [pathname, role]);

  if (!role || pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  const clientSaved = readClientSavedMode() ?? initialSavedMode;
  const activeMode = resolveActiveMode({
    pathname,
    savedMode: clientSaved,
    role,
    ruangKelasId,
  });

  if (activeMode === 'GURU') {
    return <BottomNav items={GURU_NAV_ITEMS} />;
  }

  if (activeMode === 'PJR') {
    return <BottomNav items={PJR_NAV_ITEMS} />;
  }

  if (activeMode === 'ADMIN') {
    return <BottomNav items={ADMIN_NAV_ITEMS} />;
  }

  // Default: Mode BK
  return <BottomNav />;
}
