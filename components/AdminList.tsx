'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  deleteProjectAction,
  duplicateProjectAction,
  reorderProjectsAction,
  setProjectFlagAction,
  type Result,
} from '@/app/actions';
import type { Project } from '@/lib/types';
import { Confirm, useToast } from './form';

export default function AdminList({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [list, setList] = useState(projects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Project | null>(null);
  const [toast, showToast] = useToast();

  useEffect(() => setList(projects), [projects]);

  const run = async (job: Promise<Result>, done?: string) => {
    try {
      const res = await job;
      if (res.ok) {
        if (done) showToast(done);
        router.refresh();
      } else {
        showToast(res.error ?? '처리하지 못했습니다. 다시 시도해주세요', false);
        setList(projects);
      }
    } catch {
      showToast('처리하지 못했습니다. 다시 시도해주세요', false);
      setList(projects);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setList(next);
    run(reorderProjectsAction(next.map((p) => p.id)));
  };

  if (!list.length) {
    return <p className="empty">아직 작업물이 없습니다. 첫 작업물을 추가해보세요.</p>;
  }

  return (
    <>
      <ul className="plist">
        {list.map((p, i) => (
          <li
            key={p.id}
            draggable
            className={`${dragId === p.id ? 'dragging' : ''} ${overId === p.id && dragId !== p.id ? 'target' : ''}`.trim()}
            onDragStart={() => setDragId(p.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(p.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              move(list.findIndex((x) => x.id === dragId), i);
              setDragId(null);
              setOverId(null);
            }}
          >
            <span className="grip" aria-hidden="true" title="끌어서 순서 바꾸기">
              ⠿
            </span>
            {p.cover ? <img src={p.cover} alt="" /> : <div className="noimg" />}
            <div>
              <Link className="t" href={`/admin/projects/${p.id}`}>
                {p.title.ko || '(제목 없음)'}
              </Link>
              <div className="s">
                <span>{p.status === 'published' ? '공개' : '임시저장'}</span>
                {p.featured && <span className="feat">● 대표작</span>}
                {p.status === 'published' && (
                  <Link className="ulink" href={`/projects/${p.slug}`}>
                    보기
                  </Link>
                )}
              </div>
            </div>
            <div className="ops">
              <button type="button" className="btn ghost" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`${p.title.ko} 위로`}>
                ↑
              </button>
              <button type="button" className="btn ghost" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label={`${p.title.ko} 아래로`}>
                ↓
              </button>
              <button type="button" className="btn ghost" onClick={() => run(setProjectFlagAction(p.id, { featured: !p.featured }))}>
                {p.featured ? '대표작 해제' : '대표작 지정'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  run(
                    setProjectFlagAction(p.id, { status: p.status === 'published' ? 'draft' : 'published' }),
                    p.status === 'published' ? '숨겼습니다' : '공개했습니다',
                  )
                }
              >
                {p.status === 'published' ? '숨기기' : '공개'}
              </button>
              <button type="button" className="btn ghost" onClick={() => run(duplicateProjectAction(p.id), '복제했습니다')}>
                복제
              </button>
              <button type="button" className="btn ghost" onClick={() => setRemoving(p)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Confirm
        open={!!removing}
        title={`'${removing?.title.ko ?? ''}'를 삭제할까요?`}
        body="되돌릴 수 없습니다. 딸린 이미지도 함께 지워집니다."
        action="삭제"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (target) run(deleteProjectAction(target.id), '삭제했습니다');
        }}
      />
      {toast}
    </>
  );
}
