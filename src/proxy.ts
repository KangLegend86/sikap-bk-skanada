import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function getHomePathForRole(role: 'ADMIN' | 'GURU_BK' | 'GURU_PJR' | 'GURU'): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'GURU_PJR') return '/pjr';
  if (role === 'GURU') return '/guru';
  return '/';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abaikan aset statis, API internal Next.js, manifest PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // 1. Halaman Login Publik
  if (pathname === '/admin/login') {
    if (session) {
      return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  // 2. Belum Login -> Arahkan ke halaman login tunggal
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Proteksi Rute per Role
  // Admin area: khusus ADMIN
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
  }

  // PJR area: khusus GURU_PJR atau GURU_BK yang merangkap PJR
  const canAccessPjr =
    session.role === 'GURU_PJR' ||
    (session.role === 'GURU_BK' && Boolean(session.ruangKelasId));

  if (pathname.startsWith('/pjr') && !canAccessPjr) {
    return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
  }

  // Mode Guru (/guru/*): semua role yang login boleh mengakses untuk mengisi Jurnal Sikap
  if (pathname.startsWith('/guru')) {
    return NextResponse.next();
  }

  // Rute khusus Guru BK / Admin: /, /jurnal, /jurnal-sikap, /siswa
  if (
    (session.role === 'GURU_PJR' || session.role === 'GURU') &&
    (pathname === '/' ||
      pathname.startsWith('/jurnal') ||
      pathname.startsWith('/siswa'))
  ) {
    return NextResponse.redirect(new URL(getHomePathForRole(session.role), request.url));
  }

  // Jika Admin mengakses root /, arahkan ke /admin
  if (session.role === 'ADMIN' && pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|icons|favicon.ico).*)'],
};
