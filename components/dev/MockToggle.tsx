'use client'

import { useState, useEffect } from 'react'

export default function MockToggle() {
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setActive(document.cookie.includes('x-b4k-mock=1'))
  }, [])

  async function toggle() {
    setBusy(true)
    await fetch('/api/mock/dev-toggle', { method: 'POST' })
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={active ? 'Mock data active — click to disable' : 'Mock data inactive — click to enable'}
      style={{
        position: 'fixed',
        bottom: 76,
        right: 14,
        zIndex: 9999,
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        fontFamily: 'monospace',
        border: 'none',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.6 : 1,
        background: active ? 'var(--lav)' : 'var(--bg-3)',
        color: active ? 'var(--bg)' : 'var(--muted)',
        outline: active ? 'none' : '1px solid var(--bdr)',
        transition: 'background 150ms, color 150ms',
      }}
    >
      {active ? 'MOCK ON' : 'MOCK OFF'}
    </button>
  )
}
