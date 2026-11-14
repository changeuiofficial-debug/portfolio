import { notFound } from 'next/navigation';

/** 없는 주소는 모두 "페이지를 찾을 수 없습니다" 화면으로 보낸다. */
export default function CatchAll() {
  notFound();
}
