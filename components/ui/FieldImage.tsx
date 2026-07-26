import Image from 'next/image'

interface FieldImageProps {
  src: string
  alt: string
  systemCode?: string    // e.g. "SEL·001·KP" — shown top-left. If absent, omit overlay.
  coordinates?: string   // e.g. "37.5665°N 126.9780°E" — shown bottom-right. If absent, omit.
  domain?: string        // e.g. "K-POP" — shown bottom-left. If absent, omit.
  className?: string     // passed to outer wrapper
  aspectRatio?: string   // default "3/2". Ignored when fillContainer is true.
  priority?: boolean     // Next.js Image priority
  fillContainer?: boolean // fills parent absolutely (position:absolute;inset:0) instead of aspect-ratio sizing
  sizes?: string         // Next.js Image sizes — pass for any fillContainer usage that spans the viewport
}

export default function FieldImage({
  src,
  alt,
  systemCode,
  coordinates,
  domain,
  className,
  aspectRatio = '3/2',
  priority = false,
  fillContainer = false,
  sizes,
}: FieldImageProps) {
  const wrapperStyle = fillContainer
    ? { position: 'absolute' as const, inset: 0, overflow: 'hidden', borderRadius: 0 }
    : { position: 'relative' as const, overflow: 'hidden', borderRadius: 0, aspectRatio }

  return (
    <div
      className={className}
      style={wrapperStyle}
    >
      {/* Photo */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ filter: 'brightness(0.85) saturate(1.05)', objectFit: 'cover' }}
      />

      {/* Top gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.70), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(10,10,10,0.70), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Corner marks — L-shaped brackets */}
      {/* Top-left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 18,
          height: 18,
          borderTop: '1px solid rgba(255,255,255,0.30)',
          borderLeft: '1px solid rgba(255,255,255,0.30)',
          pointerEvents: 'none',
        }}
      />
      {/* Top-right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 18,
          height: 18,
          borderTop: '1px solid rgba(255,255,255,0.30)',
          borderRight: '1px solid rgba(255,255,255,0.30)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom-left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          width: 18,
          height: 18,
          borderBottom: '1px solid rgba(255,255,255,0.30)',
          borderLeft: '1px solid rgba(255,255,255,0.30)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom-right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          width: 18,
          height: 18,
          borderBottom: '1px solid rgba(255,255,255,0.30)',
          borderRight: '1px solid rgba(255,255,255,0.30)',
          pointerEvents: 'none',
        }}
      />

      {/* System code — top-left (system-sm: font-mono 9px 0.22em tracking uppercase) */}
      {systemCode && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            fontFamily: 'var(--f-mono)',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.50)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          {systemCode}
        </span>
      )}

      {/* Coordinates — bottom-right (system-xs: font-mono --f-xxs 0.18em tracking uppercase) */}
      {coordinates && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            fontFamily: 'var(--f-mono)',
            fontSize: 'var(--f-xxs)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          {coordinates}
        </span>
      )}

      {/* Domain — bottom-left (system-xs: font-mono --f-xxs 0.18em tracking uppercase) */}
      {domain && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            fontFamily: 'var(--f-mono)',
            fontSize: 'var(--f-xxs)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.40)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          {domain}
        </span>
      )}
    </div>
  )
}
