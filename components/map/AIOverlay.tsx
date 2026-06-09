'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { X, Minus, ArrowLeft, Send, Sparkles, Plus, Check, Loader2, ArrowRight } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { saveDraftPlan } from '@/lib/draft-plan'
import type { MapPoi } from '@/hooks/useMapPois'

// ─── Types ──────────────────────────────────────────────────────
type MessageRole = 'user' | 'assistant'
type MessageType = 'text' | 'poi-cards' | 'plan-result'

interface ChatMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  pois?: MapPoi[]
  planStops?: MapPoi[]
}

interface Props {
  open:         boolean
  pois:         MapPoi[]
  planStopIds:  string[]
  onAddToPlan:  (id: string) => void
  onMinimize:   () => void
  onClose:      () => void
}

// ─── Mock AI ────────────────────────────────────────────────────
let _id = 0
function uid() { return `msg-${++_id}` }

async function getMockResponse(input: string, pois: MapPoi[]): Promise<ChatMessage> {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))

  // Simulate occasional timeout (MP_35) — ~8% chance
  if (Math.random() < 0.08) throw new Error('timeout')

  const q = input.toLowerCase()

  // Plan intent
  if (/plan|day trip|itinerary|schedule|route/.test(q)) {
    const stops = pois.slice(0, Math.min(4, pois.length))
    return { id: uid(), role: 'assistant', type: 'plan-result', content: '', planStops: stops }
  }

  // POI search by category keyword
  const catMap: Record<string, string[]> = {
    Restaurants: ['food', 'eat', 'restaurant', 'street food', 'dining', 'hungry'],
    Cafes:       ['cafe', 'coffee', 'tea', 'dessert'],
    Palaces:     ['palace', 'royal', 'joseon', 'historic', 'history'],
    Temples:     ['temple', 'buddhist', 'zen', 'spiritual'],
    Parks:       ['park', 'nature', 'outdoor', 'beach', 'hike', 'scenic'],
    Shopping:    ['shop', 'buy', 'market', 'souvenir', 'fashion'],
    Museums:     ['museum', 'art', 'culture', 'exhibit'],
    Hotels:      ['hotel', 'stay', 'accommodation', 'sleep'],
  }

  let filtered: MapPoi[] = []
  for (const [cat, keywords] of Object.entries(catMap)) {
    if (keywords.some(k => q.includes(k))) {
      filtered = pois.filter(p => p.display_domain === cat)
      break
    }
  }

  // K-culture keyword → popular / trending
  if (/kpop|k-pop|bts|blackpink|drama|k-drama/.test(q)) {
    filtered = pois.filter(p => p.is_trending)
  }

  const results = (filtered.length > 0 ? filtered : pois).slice(0, 3)
  return { id: uid(), role: 'assistant', type: 'poi-cards', content: '', pois: results }
}

// ─── Sub-components ──────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-sp-3 py-sp-2 bg-bg-3 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted"
          style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function POICard({ poi, isInPlan, planFull, onAdd }: {
  poi: MapPoi
  isInPlan: boolean
  planFull: boolean
  onAdd: () => void
}) {
  const t = useTranslations('map.aiOverlay')
  const name = getDisplayName(poi)
  const disabled = planFull && !isInPlan

  return (
    <div
      className="flex items-center justify-between gap-sp-3 p-sp-3 rounded-xl bg-bg-2"
      style={{ border: '1px solid var(--bdr)' }}
    >
      <div className="min-w-0">
        <p className="text-fg text-sm font-medium truncate">{name}</p>
        <p className="text-muted text-xs">{poi.display_domain} · {poi.display_region}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={disabled}
        aria-label={isInPlan ? t('added') : t('addToPlan')}
        className={[
          'shrink-0 min-w-touch min-h-touch flex items-center justify-center gap-1 px-sp-3 rounded-lg text-xs font-semibold transition-all',
          isInPlan
            ? 'bg-lav-dim text-lav cursor-default'
            : disabled
              ? 'bg-muted-3 text-muted cursor-not-allowed'
              : 'bg-lav text-bg hover:opacity-90',
        ].join(' ')}
      >
        {isInPlan
          ? <Check size={13} strokeWidth={2} aria-hidden="true" />
          : <Plus  size={13} strokeWidth={2} aria-hidden="true" />
        }
        <span>{isInPlan ? t('added') : t('addToPlan')}</span>
      </button>
    </div>
  )
}

function PlanResult({ stops }: { stops: MapPoi[] }) {
  const t      = useTranslations('map.aiOverlay')
  const router = useRouter()

  function handlePreviewPlan() {
    const durations: Record<string, number> = {}
    stops.forEach(s => { durations[s.place_id] = 60 })
    saveDraftPlan({ stops, durations, transport: 'public' })
    router.push('/plan/preview')
  }

  return (
    <div className="flex flex-col gap-sp-2">
      {stops.map((poi, i) => (
        <div key={poi.place_id} className="flex items-center gap-sp-2">
          <span className="w-5 h-5 rounded-full bg-lav text-bg text-[10px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <span className="text-fg text-sm truncate">{getDisplayName(poi)}</span>
        </div>
      ))}
      <button
        onClick={handlePreviewPlan}
        className="mt-sp-2 w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-xl font-semibold text-sm bg-lav text-bg hover:opacity-90 active:opacity-75 transition-opacity"
      >
        {t('previewPlan')}
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function AIOverlay({
  open, pois, planStopIds, onAddToPlan, onMinimize, onClose,
}: Props) {
  const t = useTranslations('map.aiOverlay')
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [input, setInput]           = useState('')
  const [status, setStatus]         = useState<'idle' | 'typing' | 'error'>('idle')
  const [lastQuery, setLastQuery]   = useState('')
  const scrollRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function sendMessage(text: string) {
    if (!text.trim() || status === 'typing') return
    const userMsg: ChatMessage = { id: uid(), role: 'user', type: 'text', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLastQuery(text.trim())
    setStatus('typing')

    try {
      const response = await getMockResponse(text.trim(), pois)
      setMessages(prev => [...prev, response])
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  function handleRetry() {
    setStatus('idle')
    sendMessage(lastQuery)
  }

  function handleChip(chip: string) { sendMessage(chip) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const chips = [
    t('chips.bts'),
    t('chips.kdrama'),
    t('chips.food'),
  ]

  const showChips = messages.length === 0 && status === 'idle'

  if (!open) return null

  // ─── Shared chat content ─────────────────────────────────────
  const chatContent = (
    <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto themed-scrollbar p-sp-4 flex flex-col gap-sp-3">

        {/* Prompt chips — MP_31 */}
        {showChips && (
          <div className="flex flex-col items-center gap-sp-3 py-sp-6">
            <Sparkles size={28} strokeWidth={1.5} className="text-lav" aria-hidden="true" />
            <p className="text-muted text-sm text-center">{t('greeting')}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-sp-2">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="px-sp-3 py-1.5 rounded-full bg-lav-dim text-lav text-xs font-medium hover:bg-lav-mid transition-colors min-h-[32px]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] px-sp-3 py-sp-2 bg-lav text-bg rounded-2xl rounded-tr-sm text-sm">
                  {msg.content}
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className="flex flex-col gap-sp-2">
              {msg.type === 'text' && (
                <div className="px-sp-3 py-sp-2 bg-bg-3 rounded-2xl rounded-tl-sm text-fg text-sm max-w-[85%]">
                  {msg.content}
                </div>
              )}

              {/* FL3_03 / MP_32 — POI cards */}
              {msg.type === 'poi-cards' && msg.pois && (
                <div className="flex flex-col gap-sp-2 max-w-full">
                  <p className="text-muted text-xs">{t('poiFound')}</p>
                  {msg.pois.map(poi => {
                    const isInPlan = planStopIds.includes(poi.place_id)
                    return (
                      <POICard
                        key={poi.place_id}
                        poi={poi}
                        isInPlan={isInPlan}
                        planFull={planStopIds.length >= 10 && !isInPlan}
                        onAdd={() => onAddToPlan(poi.place_id)}
                      />
                    )
                  })}
                </div>
              )}

              {/* FL3_04 / MP_33 — Plan result */}
              {msg.type === 'plan-result' && msg.planStops && (
                <div className="flex flex-col gap-sp-2 max-w-full">
                  <p className="text-muted text-xs">{t('planBuilt')}</p>
                  <div
                    className="p-sp-3 rounded-xl bg-bg-3 flex flex-col gap-sp-2"
                    style={{ border: '1px solid var(--lav-border)' }}
                  >
                    <PlanResult stops={msg.planStops!} />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {status === 'typing' && <TypingIndicator />}

        {/* MP_35 — Error state */}
        {status === 'error' && (
          <div className="flex flex-col gap-sp-2">
            <p className="text-muted text-sm">{t('error')}</p>
            <button
              onClick={handleRetry}
              className="text-lav text-sm hover:underline text-left"
            >
              {t('retry')}
            </button>
          </div>
        )}
      </div>

      {/* Input — MP_30 */}
      <div
        className="flex items-center gap-sp-2 p-sp-3 shrink-0"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          disabled={status === 'typing'}
          aria-label={t('inputPlaceholder')}
          className="flex-1 bg-bg-3 text-fg text-sm rounded-xl px-sp-3 py-sp-2 outline-none focus:ring-1 focus:ring-lav placeholder:text-muted disabled:opacity-50 min-h-[36px]"
          style={{ border: '1px solid var(--bdr)' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || status === 'typing'}
          aria-label={t('send')}
          className="min-w-touch min-h-touch flex items-center justify-center text-lav hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {status === 'typing'
            ? <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden="true" />
            : <Send    size={18} strokeWidth={2} aria-hidden="true" />
          }
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop panel — FL3_01 / MP_30-35 ── */}
      <div
        className="hidden lg:flex flex-col absolute bottom-0 right-0 z-20 w-[380px] bg-bg-2 rounded-tl-2xl ai-overlay-panel"
        style={{
          border: '1px solid var(--lav-border)',
          borderRight: 'none',
          borderBottom: 'none',
          maxHeight: '65%',
        }}
        role="dialog"
        aria-label={t('title')}
        aria-modal="false"
      >
        {/* Header */}
        <div
          className="flex items-center gap-sp-2 px-sp-4 py-sp-3 shrink-0"
          style={{ borderBottom: '1px solid var(--bdr)' }}
        >
          <Sparkles size={16} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
          <span className="text-fg text-sm font-semibold flex-1">{t('title')}</span>
          {/* FL3_05 / MP_34 — Minimize to pill */}
          <button
            onClick={onMinimize}
            aria-label={t('minimize')}
            className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
          >
            <Minus size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        {chatContent}
      </div>

      {/* ── Mobile full-screen — FL3_02 ── */}
      <div
        className="lg:hidden fixed inset-x-0 top-[52px] bottom-14 z-30 bg-bg flex flex-col ai-overlay-panel"
        role="dialog"
        aria-label={t('title')}
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="flex items-center gap-sp-3 px-sp-4 py-sp-3 shrink-0"
          style={{ borderBottom: '1px solid var(--bdr)' }}
        >
          {/* FL3_06 — Back to map */}
          <button
            onClick={onClose}
            aria-label={t('back')}
            className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <Sparkles size={16} strokeWidth={2} className="text-lav" aria-hidden="true" />
          <span className="text-fg text-sm font-semibold flex-1">{t('title')}</span>
        </div>
        {chatContent}
      </div>
    </>
  )
}
