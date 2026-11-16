import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abaikan aset statis, API internal Next.js, manifest PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
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
      if (session.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (session.role === 'GURU_PJR') return NextResponse.redirect(new URL('/pjr', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login') {
    if (session) {
      if (session.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (session.role === 'GURU_PJR') return NextResponse.redirect(new URL('/pjr', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Belum Login -> Arahkan ke halaman login tunggal
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Proteksi Rute per Role
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    if (session.role === 'GURU_PJR') return NextResponse.redirect(new URL('/pjr', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/pjr') && session.role !== 'GURU_PJR') {
    if (session.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jika Guru PJR mencoba akses rute Guru BK (/ atau /jurnal atau /siswa)
  if (
    session.role === 'GURU_PJR' &&
    (pathname === '/' || pathname.startsWith('/jurnal') || pathname.startsWith('/siswa'))
  ) {
    return NextResponse.redirect(new URL('/pjr', request.url));
  }

  // Jika Admin mengakses root /, arahkan ke /admin
  if (session.role === 'ADMIN' && pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

