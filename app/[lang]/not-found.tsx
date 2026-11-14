import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-head" style={{ minHeight: '50vh' }}>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="sub">Page not found</p>
      <p>
        <Link className="tlink" href="/">
          메인으로 <span className="arr">→</span>
        </Link>
      </p>
    </div>
  );
}
