// 관리자 비밀번호를 설정합니다.  사용법: npm run set-password
// 비밀번호 원문은 어디에도 저장하지 않고, 암호화된 값만 .env.local 에 적습니다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

const envPath = path.join(process.cwd(), '.env.local');

let password = process.argv[2];
if (!password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  password = (await rl.question('새 관리자 비밀번호 (8자 이상): ')).trim();
  rl.close();
}
if (!password || password.length < 8) {
  console.error('비밀번호는 8자 이상이어야 합니다.');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');

const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n') : [];
const env = new Map();
for (const line of lines) {
  const i = line.indexOf('=');
  if (i > 0 && !line.startsWith('#')) env.set(line.slice(0, i), line.slice(i + 1));
}
env.set('ADMIN_PASSWORD_HASH', `scrypt:${salt}:${hash}`);
if (!env.get('SESSION_SECRET')) env.set('SESSION_SECRET', crypto.randomBytes(32).toString('hex'));
if (!env.get('SITE_URL')) env.set('SITE_URL', 'http://localhost:3000');

fs.writeFileSync(envPath, [...env].map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
console.log('.env.local 에 저장했습니다. 개발 서버를 다시 시작하세요.');
