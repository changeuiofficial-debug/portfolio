'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { saveProfileAction } from '@/app/actions';
import { LIMITS, type Lang, type Profile } from '@/lib/types';
import { Field, ImageDrop, useToast } from './form';

type LKey = 'label' | 'tagline' | 'highlight' | 'interests' | 'career' | 'education' | 'certs';

/** 소유자에게만 렌더링된다. "소개 편집"을 누르면 소개 영역이 입력 양식으로 바뀐다. */
export default function ProfileEditor({ profile, children }: { profile: Profile; children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(profile);
  const [tab, setTab] = useState<Lang>('ko');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  const setL = (key: LKey, value: string) => setP({ ...p, [key]: { ...p[key], [tab]: value } });

  const cancel = () => {
    setP(profile); // 저장 전 상태로 되돌린다
    setErrors({});
    setOpen(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await saveProfileAction(p);
      if (res.ok) {
        setErrors({});
        setOpen(false);
        showToast('저장했습니다');
        router.refresh();
      } else {
        setErrors(res.errors ?? {});
        showToast(res.error ?? '입력한 내용을 확인해주세요.', false);
      }
    } catch {
      // 입력한 내용은 그대로 둔다
      showToast('저장하지 못했습니다. 다시 시도해주세요', false);
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <>
        {children}
        <div className="edit-open">
          <button type="button" className="btn ghost sm" onClick={() => { setP(profile); setOpen(true); }}>
            소개 편집
          </button>
        </div>
        {toast}
      </>
    );
  }

  const area = (key: 'interests' | 'career' | 'education' | 'certs', label: string, hint: string) => (
    <Field label={label} hint={hint} error={errors[key]} count={p[key][tab].length} max={LIMITS.profileBody}>
      <textarea className="in" value={p[key][tab]} onChange={(e) => setL(key, e.target.value)} />
    </Field>
  );

  return (
    <div className="profile-form">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'ko'} onClick={() => setTab('ko')}>
          한국어
        </button>
        <button type="button" role="tab" aria-selected={tab === 'en'} onClick={() => setTab('en')}>
          English
        </button>
      </div>

      <Field label="이름" required error={errors.name}>
        <input className="in" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </Field>
      <Field
        label="한 줄 소개"
        required={tab === 'ko'}
        hint={tab === 'en' ? '비워 두면 영어 화면에 한국어 문구가 보입니다.' : '첫 화면에 가장 크게 보입니다.'}
        error={errors.tagline}
        count={p.tagline[tab].length}
        max={LIMITS.tagline}
      >
        <input className="in" value={p.tagline[tab]} onChange={(e) => setL('tagline', e.target.value)} />
      </Field>
      <Field label="형광펜으로 칠할 문구" hint="한 줄 소개 안에 있는 문구를 그대로 적습니다. 두 개를 | 로 나눠 적으면(예: AI 엔지니어 | 홍창의) 형광펜이 앞에서 뒤로 옮겨 갑니다.">
        <input className="in" value={p.highlight[tab]} onChange={(e) => setL('highlight', e.target.value)} />
      </Field>
      <Field label="라벨" hint="한 줄 소개 위의 작은 글자. 예: AI Engineer">
        <input className="in" value={p.label[tab]} onChange={(e) => setL('label', e.target.value)} />
      </Field>
      {area('interests', '관심 분야', '한 줄에 하나씩 적습니다.')}
      {area('career', '경력', '한 줄에 하나씩. "기간 | 내용" 형식으로 적습니다.')}
      {area('education', '학력·교육', '한 줄에 하나씩. "기간 | 내용" 형식으로 적습니다.')}
      {area('certs', '어학·자격', '한 줄에 하나씩. "이름 | 점수·등급" 형식. 예: TOEIC | 920')}

      <div className="more">언어와 상관없는 항목</div>
      <Field label="기술 스택" hint="한 줄에 하나씩, 강조하고 싶은 순서대로. 아이콘은 이름에 맞춰 자동으로 붙습니다." error={errors.stack}>
        <textarea className="in" value={p.stack} onChange={(e) => setP({ ...p, stack: e.target.value })} />
      </Field>
      <Field label="이메일" error={errors.email}>
        <input className="in" type="email" placeholder="name@example.com" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
      </Field>
      <Field label="GitHub 주소" error={errors.github}>
        <input className="in" type="url" placeholder="https://github.com/" value={p.github} onChange={(e) => setP({ ...p, github: e.target.value })} />
      </Field>
      <div className={`field${errors.photo ? ' bad' : ''}`}>
        <div className="lab">프로필 사진</div>
        <ImageDrop
          value={p.photo}
          small
          text="사진을 끌어다 놓거나 눌러서 선택 (비워 두면 사진 없이 보입니다)"
          onChange={(src) => setP((cur) => ({ ...cur, photo: src }))}
          onError={(m) => showToast(m, false)}
        />
      </div>

      <div className="savebar" style={{ marginTop: 32 }}>
        <div className="inner" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button type="button" className="tlink sub" onClick={cancel}>
            취소
          </button>
          <button type="button" className="btn primary sm" onClick={save} disabled={busy}>
            {busy ? <span className="spin" /> : '저장'}
          </button>
        </div>
      </div>
      {toast}
    </div>
  );
}
