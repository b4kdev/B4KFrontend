'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '80px 24px', borderRadius: 12, maxWidth: 480, width: '100%',
            background: '#111111', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <AlertTriangle size={48} strokeWidth={2} style={{ color: '#F87171', marginBottom: 16 }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', maxWidth: 300 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 20px',
              borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: '#C4A8E0', background: 'rgba(196,168,224,0.12)', border: '1px solid rgba(196,168,224,0.18)',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
