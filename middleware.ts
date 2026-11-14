import { NextResponse, type NextRequest } from 'next/server';

// 주소 규칙 (prd.md 5장)
//   한국어:  /            /projects          → 내부적으로 /ko/… 로 처리
//   영어:    /en          /en/projects
// 방문자가 고른 언어는 쿠키(lang)에 기억한다.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();

  if (pathname === '/ko' || pathname.startsWith('/ko/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  if (req.cookies.get('lang')?.value === 'en') {
    url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
    return NextResponse.redirect(url);
  }
  url.pathname = pathname === '/' ? '/ko' : `/ko${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|admin|uploads|seed|api|.*\\..*).*)'],
};
