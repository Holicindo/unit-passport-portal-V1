import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Jika user mengakses root URL (/), langsung alihkan ke /login di level server
  // Ini mencegah adanya kedipan (glitch) rendering halaman di sisi klien
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'], // Hanya jalankan middleware ini untuk root URL
};
