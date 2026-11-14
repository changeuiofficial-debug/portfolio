import type { NextConfig } from 'next';

const config: NextConfig = {
  // 확인용 서버를 따로 띄울 때 빌드 폴더가 겹치지 않게 한다 (같은 폴더를 두 서버가 쓰면 캐시가 꼬인다)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // 이미지 업로드(5MB)를 서버 액션으로 받기 위한 한도
    serverActions: { bodySizeLimit: '6mb' },
  },
};

export default config;
