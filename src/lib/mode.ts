import type { SessionPayload } from '@/lib/auth';

export type AppMode = 'BK' | 'PJR' | 'GURU' | 'ADMIN';

export const ACTIVE_MODE_COOKIE = 'sikap_active_mode';

export function isValidAppMode(value: string | undefined | null): value is AppMode {
  return value === 'BK' || value === 'PJR' || value === 'GURU' || value === 'ADMIN';
}

export function getDefaultModeForRole(role: SessionPayload['role']): AppMode {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'GURU_PJR') return 'PJR';
  if (role === 'GURU') return 'GURU';
  return 'BK';
}

export function getModeFromPathname(pathname: string): AppMode | null {
  if (pathname.startsWith('/guru')) return 'GURU';
  if (pathname.startsWith('/pjr')) return 'PJR';
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (
    pathname === '/' ||
    pathname.startsWith('/jurnal') ||
    pathname.startsWith('/siswa')
  ) {
    return 'BK';
  }
  // Halaman bersama seperti /akun/* -> pertahankan mode aktif sebelumnya
  return null;
}

export function isModeAllowedForSession(
  mode: AppMode,
  role: SessionPayload['role'],
  ruangKelasId?: string | null
): boolean {
  if (mode === 'GURU') return true;
  if (mode === 'ADMIN') return role === 'ADMIN';
  if (mode === 'BK') return role === 'GURU_BK' || role === 'ADMIN';
  if (mode === 'PJR') {
    return role === 'GURU_PJR' || (role === 'GURU_BK' && Boolean(ruangKelasId));
  }
  return false;
}

export function resolveActiveMode(params: {
  pathname: string;
  savedMode?: string | null;
  role: SessionPayload['role'];
  ruangKelasId?: string | null;
}): AppMode {
  const fromPath = getModeFromPathname(params.pathname);
  if (fromPath) return fromPath;

  if (
    isValidAppMode(params.savedMode) &&
    isModeAllowedForSession(params.savedMode, params.role, params.ruangKelasId)
  ) {
    return params.savedMode;
  }

  return getDefaultModeForRole(params.role);
}

export function getHomeHrefForMode(mode: AppMode): string {
  if (mode === 'GURU') return '/guru';
  if (mode === 'PJR') return '/pjr';
  if (mode === 'ADMIN') return '/admin';
  return '/';
}

export function readClientSavedMode(): AppMode | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACTIVE_MODE_COOKIE}=([^;]+)`)
  );
  const val = match ? decodeURIComponent(match[1]) : null;
  return isValidAppMode(val) ? val : null;
}

export function writeClientSavedMode(mode: AppMode): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACTIVE_MODE_COOKIE}=${mode}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
}
