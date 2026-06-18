import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClickMultiQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { HARDENING_SCENARIOS } from '../../data/hardening'
import { WarnIcon } from '../../components/Icons'

const GAME_ID   = 'harden-target'
const GAME_NAME = 'HARDEN TARGET'
const DESC      = 'Audit running services and settings. Click every misconfiguration, insecure protocol, or unnecessary service.'
const TIMER: Record<string, number> = { E: 0, D: 70, C: 60, B: 50, A: 45, S: 35 }
const STACK: Record<string, number> = { E: 1, D: 2,  C: 2,  B: 3,  A: 3,  S: 4  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): ClickMultiQuestion[] {
  return shuffle([...HARDENING_SCENARIOS]).slice(0, STACK[rank]).map((s) => ({
    ...s, items: shuffle([...s.items]),
  }))
}

function HardenCard({
  question, onSubmit, snapshot,
}: {
  question: ClickMultiQuestion
  onSubmit?: (ids: string[]) => void
  snapshot?: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const isReview = !!snapshot
  const active = snapshot ? new Set(snapshot) : selected
  const correctIds = new Set(question.items.filter((i) => i.flag).map((i) => i.id))

  const toggle = (id: string) => {
    if (isReview) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const flagCount = question.items.filter((i) => i.flag).length
  const selectedCount = selected.size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-orange)', borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: 'var(--c-orange)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 6px' }}>SECURITY AUDIT</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
        {!isReview && (
          <p style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 6, marginBottom: 0 }}>
            {question.instruction} — {selectedCount} selected
          </p>
        )}
        {isReview && (
          <p style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 6, marginBottom: 0 }}>
            {flagCount} item{flagCount !== 1 ? 's' : ''} should have been flagged
          </p>
        )}
      </div>

      {/* Service list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {question.items.map((item) => {
          const isSelected = active.has(item.id)
          const isCorrect  = correctIds.has(item.id)

          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          let labelColor = 'var(--c-body)'
          let leftColor = 'var(--c-border)'

          if (!isReview && isSelected) {
            borderColor = 'var(--c-pink)'; bg = 'rgba(244,114,182,0.08)'; leftColor = 'var(--c-pink)'
          }
          if (isReview) {
            if (isCorrect && isSelected) {
              borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.08)'; labelColor = 'var(--c-green)'; leftColor = 'var(--c-green)'
            } else if (isCorrect && !isSelected) {
              borderColor = 'var(--c-amber)'; bg = 'rgba(251,191,36,0.08)'; labelColor = 'var(--c-amber)'; leftColor = 'var(--c-amber)'
            } else if (!isCorrect && isSelected) {
              borderColor = 'var(--c-pink)'; bg = 'rgba(244,114,182,0.08)'; labelColor = 'var(--c-pink)'; leftColor = 'var(--c-pink)'
            }
          }

          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: bg, border: `1px solid ${borderColor}`, borderLeft: `4px solid ${leftColor}`, borderRadius: 6, cursor: isReview ? 'default' : 'pointer', transition: 'all 0.12s', userSelect: 'none' }}
            >
              {/* Checkbox indicator */}
              <div style={{ width: 18, height: 18, border: `2px solid ${borderColor}`, borderRadius: 3, background: isSelected ? borderColor : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSelected && <span style={{ color: isReview && !isCorrect ? 'var(--c-pink)' : '#000', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✕</span>}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ color: labelColor, fontWeight: 700, fontSize: 13, margin: 0 }}>{item.label}</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0', lineHeight: 1.4 }}>{item.detail}</p>
              </div>

              {isReview && (
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isCorrect && isSelected  && <span style={{ color: 'var(--c-green)', fontSize: 13 }}>✓ correct flag</span>}
                  {isCorrect && !isSelected && <span style={{ color: 'var(--c-amber)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><WarnIcon size={13} color="var(--c-amber)" /> missed</span>}
                  {!isCorrect && isSelected && <span style={{ color: 'var(--c-pink)',  fontSize: 13 }}>✗ false positive</span>}
                  {!isCorrect && !isSelected && <span style={{ color: 'var(--c-dim)',  fontSize: 13 }}>— ok</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isReview && (
        <button
          className="btn-neon btn-orange"
          style={{ alignSelf: 'center', padding: '8px 28px' }}
          disabled={selected.size === 0}
          onClick={() => onSubmit?.([...selected])}
        >
          ▶ SUBMIT AUDIT FINDINGS
        </button>
      )}
    </div>
  )
}

export default function HardenTarget() {
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
          <HardenCard question={question as ClickMultiQuestion} snapshot={answerSnapshot as string[]} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as ClickMultiQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <HardenCard question={active} onSubmit={(ids) => actions.submitAnswer(ids)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HardenCard question={active} snapshot={lastAnswer as string[]} />
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} onRetry={lives > 0 ? actions.retryCard : undefined} />
        </div>
      )}
    </PlayHUD>
  )
}
