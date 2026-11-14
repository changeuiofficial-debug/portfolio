/**
 * 프로필 그림.
 * 얼굴 일러스트(public/profile/hong.png)일 때만 두 장을 겹쳐 그린다.
 *  - hong-face.png: 입 선만 지운 얼굴
 *  - hong-mouth.png: 입 선만 남긴 같은 크기의 투명 그림
 * 마우스를 올리면 입 선을 위아래로 뒤집어(︵ → ‿) 미소 짓는다. 움직임은 globals.css(.portrait)가 그린다.
 * 다른 사진을 올리면 평범한 이미지 한 장으로 보인다.
 */
const LAYERED: Record<string, { face: string; mouth: string }> = {
  '/profile/hong.png': { face: '/profile/hong-face.png', mouth: '/profile/hong-mouth.png' },
};

export default function Portrait({ src, alt }: { src: string; alt: string }) {
  const layers = LAYERED[src];
  if (!layers) return <img className="photo" src={src} alt={alt} />;
  return (
    <span className="photo portrait">
      <img src={layers.face} alt={alt} />
      <img className="mouth" src={layers.mouth} alt="" aria-hidden="true" />
    </span>
  );
}
