'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions';
import { WarnIcon } from './form';

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: '' });
  return (
    <form action={action}>
      <label className="sr-only" htmlFor="password">
        관리자 비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className="in"
        placeholder="비밀번호"
        autoComplete="current-password"
        autoFocus
        required
      />
      {state.error && (
        <span className="under">
          <span className="err" role="alert">
            <WarnIcon />
            {state.error}
          </span>
        </span>
      )}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? <span className="spin" /> : '들어가기'}
      </button>
    </form>
  );
}
