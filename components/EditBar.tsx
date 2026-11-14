import Link from 'next/link';
import { logoutAction } from '@/app/actions';

/** 소유자에게만 보이는 "편집 모드" 표시줄 */
export default function EditBar() {
  return (
    <div className="editbar">
      <div className="wrap">
        <span className="l">
          <span className="dot" aria-hidden="true" />
          편집 모드
        </span>
        <div className="r">
          <Link href="/">사이트 보기</Link>
          <Link href="/admin/projects">작업물 관리</Link>
          <form action={logoutAction}>
            <button type="submit">로그아웃</button>
          </form>
        </div>
      </div>
    </div>
  );
}
