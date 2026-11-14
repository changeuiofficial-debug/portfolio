import { NextResponse, type NextRequest } from 'next/server';

// 주소 규칙 (prd.md 5장)
//   한국어:  /            /projects/주소     → 내부적으로 /ko/… 로 처리
//   영어:    /en          /en/projects/주소
// 방문자가 고른 언어는 쿠키(lang)에 기억한다.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 작업물 목록 페이지는 없앴다. 옛 주소로 들어오면 메인의 작업물 섹션으로 보낸다.
  if (/^\/(en\/)?projects\/?$/.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith('/en') ? '/en' : '/';
    url.hash = 'projects';
    return NextResponse.redirect(url);
  }

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
