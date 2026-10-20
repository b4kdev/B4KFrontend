// Naver Maps JS SDK globals (loaded by components/v2/map/V2MapCanvas.tsx).
export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { naver: any; navermap_authFailure?: () => void }
}
