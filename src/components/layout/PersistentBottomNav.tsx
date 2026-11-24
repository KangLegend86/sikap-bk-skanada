'use client';

import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Database,
  FileText,
  Home,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import BottomNav, { type BottomNavItem } from '@/components/BottomNav';

const PJR_NAV_ITEMS: BottomNavItem[] = [
  { path: '/pjr', label: 'Beranda', Icon: Home },
  { path: '/pjr/kasus', label: 'Pantauan', Icon: ClipboardList },
  { path: '/pjr/siswa', label: 'Siswa', Icon: Users },
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
}: {
  role: SessionPayload['role'] | null;
}) {
  const pathname = usePathname();

  if (!role || pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  const roleNavItems =
    role === 'GURU_PJR'
      ? PJR_NAV_ITEMS
      : role === 'ADMIN'
        ? ADMIN_NAV_ITEMS
        : undefined;

  return <BottomNav items={roleNavItems} />;
}
