import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes & static assets
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/logo.jpg' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const tokenRole = (token?.role as string)?.toLowerCase();

  // API Routes
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (pathname.startsWith('/api/owner/')) {
      if (tokenRole !== 'owner') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (pathname.startsWith('/api/manager/')) {
      if (tokenRole !== 'manager' && tokenRole !== 'owner') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  // Page Routes
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Root redirect
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (tokenRole === 'owner') {
      url.pathname = '/owner/dashboard';
    } else if (tokenRole === 'manager') {
      url.pathname = '/manager/dashboard';
    } else {
      url.pathname = '/login'; // fallback
    }
    return NextResponse.redirect(url);
  }

  // Owner pages
  if (pathname.startsWith('/owner/')) {
    if (tokenRole !== 'owner') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo.jpg|images/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)'],
};
