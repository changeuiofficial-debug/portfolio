// 링크 미리보기 이미지(public/og.png)와 파비콘(app/icon.png, app/apple-icon.png)을 만든다.
// 한 줄 소개나 얼굴 그림을 바꿨을 때 다시 실행한다:  node scripts/make-og.mjs
// 글꼴은 macOS 기본 글꼴(Apple SD Gothic Neo, Menlo)을 쓴다. 다른 컴퓨터에서는 글꼴이 달라질 수 있다.
import sharp from 'sharp';

const BG = '#0e0e0f';
const TEXT = '#f2f2f2';
const SUB = '#8a8a8a';
const ACCENT = '#c6f432';
const ON_ACCENT = '#1a2400';
const SANS = 'Apple SD Gothic Neo';
const MONO = 'Menlo';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** 글자 한 덩어리를 그려서, 실제 글자 폭만큼 잘라 돌려준다 (세로는 줄 높이 그대로) */
async function chunk(text, { size, weight = 700, color = TEXT, font = SANS }) {
  const h = Math.round(size * 1.35);
  const w = Math.round(size * text.length * 1.2 + 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="20" y="${Math.round(size * 1.05)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(text)}</text></svg>`;
  const img = sharp(Buffer.from(svg));
  const { info } = await img.clone().trim().toBuffer({ resolveWithObject: true });
  const left = -info.trimOffsetLeft;
  const buf = await sharp(Buffer.from(svg)).extract({ left, top: 0, width: info.width, height: h }).png().toBuffer();
  return { buf, w: info.width, h };
}

async function og() {
  const W = 1200, H = 630, PAD = 80;
  const faceH = 400;
  const face = await sharp('public/profile/hong.png').resize({ height: faceH }).toBuffer({ resolveWithObject: true });
  const faceLeft = W - 70 - face.info.width;
  const maxText = faceLeft - PAD - 40;

  // 글자 크기는 둘째 줄이 그림과 겹치지 않는 가장 큰 값으로 고른다
  let size = 72, parts;
  for (; size >= 40; size -= 2) {
    const gap = Math.round(size * 0.28);
    const hlPad = Math.round(size * 0.12);
    parts = {
      l1: await chunk('AX 전환을 구현하는', { size }),
      hl: await chunk('AI 엔지니어', { size, color: ON_ACCENT }),
      name: await chunk('홍창의', { size }),
      tail: await chunk('입니다.', { size }),
      gap,
      hlPad,
    };
    const line2 = parts.hl.w + hlPad * 2 + gap + parts.name.w + 2 + parts.tail.w;
    if (line2 <= maxText && parts.l1.w <= maxText) break;
  }
  const { l1, hl, name, tail, gap, hlPad } = parts;
  const label = await chunk('AI Engineer', { size: 26, weight: 400, color: SUB, font: MONO });

  const lineH = Math.round(size * 1.3);
  const blockH = label.h + 28 + lineH * 2;
  const top = Math.round((H - blockH) / 2);
  const y1 = top + label.h + 28;
  const y2 = y1 + lineH;

  // 형광펜 판과 밑줄은 SVG 도형으로 그린다
  const hlX = PAD, hlW = hl.w + hlPad * 2;
  const nameX = hlX + hlW + gap;
  const shapes = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="${hlX}" y="${y2 + Math.round(size * 0.12)}" width="${hlW}" height="${Math.round(size * 1.12)}" rx="8" fill="${ACCENT}"/>
    <rect x="${nameX}" y="${y2 + Math.round(size * 1.2)}" width="${name.w}" height="${Math.max(4, Math.round(size * 0.09))}" fill="${ACCENT}"/>
  </svg>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite([
      { input: face.data, left: faceLeft, top: Math.round((H - faceH) / 2) },
      { input: label.buf, left: PAD, top },
      { input: Buffer.from(shapes), left: 0, top: 0 },
      { input: l1.buf, left: PAD, top: y1 },
      { input: hl.buf, left: hlX + hlPad, top: y2 },
      { input: name.buf, left: nameX, top: y2 },
      { input: tail.buf, left: nameX + name.w + 2, top: y2 },
    ])
    .png({ compressionLevel: 9 })
    .toFile('public/og.png');
  console.log('public/og.png', W, H, 'font', size);
}

async function icon(size, file) {
  const r = Math.round(size * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="${Math.round(size * 0.62)}" fill="${ACCENT}">홍</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log(file, size);
}

await og();
await icon(64, 'app/icon.png');
await icon(180, 'app/apple-icon.png');
