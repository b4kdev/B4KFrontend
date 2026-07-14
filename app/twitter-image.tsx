import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'B4K — Korea Travel & Culture';
export const size = { width: 800, height: 418 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080610', // allow-hex — ImageResponse requires literal colours
        }}
      >
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/brand/B4K_BrandLogo_Horizontal_White.svg`}
          width={400}
          height={90}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  );
}
