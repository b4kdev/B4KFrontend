import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'B4K — Korea Travel & Culture';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          width={480}
          height={108}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  );
}
