import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DragMatchQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { NET_ZONE_SCENARIOS, ZONES, ZONE_COLORS, ZONE_DESCRIPTIONS } from '../../data/netZones'
import { CloudIcon, FlameIcon } from '../../components/Icons'

const GAME_ID   = 'net-zones'
const GAME_NAME = 'NET ZONES'
const DESC      = 'Place servers, firewalls, and services into the correct network zone: DMZ, Internal LAN, or Secure Zone.'
const TIMER: Record<string, number> = { E: 0, D: 0, C: 120, B: 90, A: 75, S: 60 }
const STACK: Record<string, number> = { E: 1, D: 2, C: 2,   B: 3,  A: 3,  S: 4  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): DragMatchQuestion[] {
  return shuffle([...NET_ZONE_SCENARIOS]).slice(0, STACK[rank])
}

// ─── Zone placement game ──────────────────────────────────────────────────────
function ZonePlacement({
  question, onSubmit, snapshot,
}: {
  question: DragMatchQuestion
  onSubmit?: (ans: Record<string, string>) => void
  snapshot?: Record<string, string>
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const isReview = !!snapshot
  const active = snapshot ?? assignments

  const correctMap: Record<string, string> = {}
  question.pairs.forEach((p) => { correctMap[p.label] = p.match })

  const devicesInZone = (zone: string) =>
    question.pairs.filter((p) => active[p.label] === zone)

  const unplaced = question.pairs.filter((p) => !active[p.label])
  const allPlaced = question.pairs.every((p) => !!assignments[p.label])

  const handleDeviceClick = (label: string) => {
    if (isReview) return
    setSelected(selected === label ? null : label)
  }

  const handleZoneClick = (zone: string) => {
    if (isReview || !selected) return
    setAssignments((prev) => ({ ...prev, [selected]: zone }))
    setSelected(null)
  }

  const handleUnplace = (label: string) => {
    if (isReview) return
    const next = { ...assignments }
    delete next[label]
    setAssignments(next)
    setSelected(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Scenario */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-amber)', borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: 'var(--c-amber)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 6px' }}>SCENARIO</p>
        <p style={{ color: 'var(--c-body)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{question.prompt}</p>
        {!isReview && selected && (
          <p style={{ color: 'var(--c-cyan)', fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
            "{selected}" selected — click a zone to place it
          </p>
        )}
      </div>

      {/* Network diagram — zones */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
          {/* Internet label */}
          <div style={{ textAlign: 'center', padding: '0 8px', minWidth: 60 }}>
            <p style={{ color: 'var(--c-dim)', fontSize: 9, letterSpacing: '0.08em', margin: 0 }}>INTERNET</p>
            <CloudIcon size={22} color="var(--c-dim)" style={{ margin: '2px auto 0', display: 'block' }} />
          </div>
          <span style={{ color: 'var(--c-dim)', fontSize: 18 }}>→</span>
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            {ZONES.map((zone, idx) => {
              const color = ZONE_COLORS[zone]
              const isClickable = !isReview && !!selected
              return (
                <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  {/* Firewall divider (between zones) */}
                  {idx > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <FlameIcon size={16} color="var(--c-amber)" />
                      <span style={{ color: 'var(--c-dim)', fontSize: 8 }}>FW</span>
                    </div>
                  )}
                  <div
                    onClick={() => handleZoneClick(zone)}
                    style={{
                      flex: 1, minHeight: 120,
                      border: `2px solid ${isClickable ? color : 'var(--c-border)'}`,
                      borderRadius: 8, padding: '8px 10px',
                      background: isClickable ? `rgba(${zone === 'DMZ' ? '251,191,36' : zone === 'Internal LAN' ? '96,165,250' : '244,114,182'},0.04)` : 'var(--c-surface)',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <p style={{ color, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', margin: '0 0 6px' }}>{zone.toUpperCase()}</p>
                    <p style={{ color: 'var(--c-dim)', fontSize: 9, lineHeight: 1.4, margin: '0 0 8px' }}>{ZONE_DESCRIPTIONS[zone].slice(0, 70)}…</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {devicesInZone(zone).map((p) => {
                        const correct = isReview ? correctMap[p.label] === zone : undefined
                        return (
                          <div
                            key={p.label}
                            onClick={(e) => { e.stopPropagation(); handleUnplace(p.label) }}
                            style={{
                              padding: '5px 8px',
                              background: isReview
                                ? (correct ? 'rgba(74,222,128,0.12)' : 'rgba(244,114,182,0.12)')
                                : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${isReview ? (correct ? 'var(--c-green)' : 'var(--c-pink)') : color}`,
                              borderRadius: 4, fontSize: 11,
                              color: isReview ? (correct ? 'var(--c-green)' : 'var(--c-pink)') : 'var(--c-body)',
                              cursor: isReview ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                            }}
                          >
                            <span style={{ lineHeight: 1.3 }}>{p.label}</span>
                            {isReview && <span>{correct ? '✓' : '✗'}</span>}
                            {!isReview && <span style={{ color: 'var(--c-dim)', fontSize: 9 }}>✕</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Unplaced devices pool */}
      {!isReview && unplaced.length > 0 && (
        <div>
          <p style={{ color: 'var(--c-dim)', fontSize: 10, letterSpacing: '0.08em', margin: '0 0 8px' }}>UNPLACED COMPONENTS — click to select, then click a zone</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unplaced.map((p) => (
              <button
                key={p.label}
                onClick={() => handleDeviceClick(p.label)}
                style={{
                  padding: '8px 14px',
                  background: selected === p.label ? 'rgba(34,211,238,0.12)' : 'var(--c-surface)',
                  border: `1px solid ${selected === p.label ? 'var(--c-cyan)' : 'var(--c-border)'}`,
                  borderRadius: 6,
                  color: selected === p.label ? 'var(--c-cyan)' : 'var(--c-body)',
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'all 0.12s',
                  boxShadow: selected === p.label ? '0 0 8px rgba(34,211,238,0.3)' : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Correct answer panel (review only) */}
      {isReview && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
          <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 8px' }}>CORRECT PLACEMENTS:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {question.pairs.map((p) => (
              <div key={p.label} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--c-body)', flex: 1 }}>{p.label}</span>
                <span style={{ color: ZONE_COLORS[p.match as keyof typeof ZONE_COLORS], fontWeight: 700 }}>→ {p.match}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--c-dim)', fontSize: 12, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>{question.explanation}</p>
        </div>
      )}

      {!isReview && (
        <button
          className="btn-neon btn-amber"
          style={{ alignSelf: 'center', padding: '8px 28px' }}
          disabled={!allPlaced}
          onClick={() => {
            const ans: Record<string, string> = {}
            question.pairs.forEach((p) => { ans[p.label] = assignments[p.label] ?? '' })
            onSubmit?.(ans)
          }}
        >
          ▶ DEPLOY ARCHITECTURE
        </button>
      )}
    </div>
  )
}

export default function NetZones() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])
  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank) => generateStack(rank),
    timerByRank: TIMER as never, stackSizeByRank: STACK as never,
  })
  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lastCorrect, lives } = state

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => (
          <ZonePlacement question={question as DragMatchQuestion} snapshot={answerSnapshot as Record<string, string>} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as DragMatchQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <ZonePlacement question={active} onSubmit={(ans) => actions.submitAnswer(ans)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ZonePlacement question={active} snapshot={lastAnswer as Record<string, string>} />
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} onRetry={lives > 0 ? actions.retryCard : undefined} />
        </div>
      )}
    </PlayHUD>
  )
}
