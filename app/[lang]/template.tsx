/** 페이지를 옮길 때 내용 영역만 짧게 나타난다 (헤더는 그대로). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
