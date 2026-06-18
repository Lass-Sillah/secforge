import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DragOrderQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { IR_STEPS, IR_DESCRIPTIONS, OOV_STEPS, OOV_DESCRIPTIONS } from '../../data/incidents'
import { useTouchDrag } from '../../components/engine/useTouchDrag'

const GAME_ID   = 'incident-order'
const GAME_NAME = 'INCIDENT ORDER'
const DESC      = 'Sequence the IR lifecycle (PICERL) and forensic Order of Volatility. Drag steps into the correct order.'
const TIMER: Record<string, number> = { E: 0,  D: 90, C: 75, B: 60, A: 50, S: 40 }
const STACK: Record<string, number> = { E: 1,  D: 2,  C: 2,  B: 3,  A: 3,  S: 4  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): DragOrderQuestion[] {
  return Array.from({ length: STACK[rank] }, (_, i) => {
    const isIR = i % 2 === 0
    return {
      id: `io-${isIR ? 'ir' : 'oov'}-${i}`,
      kind: 'drag-order' as const,
      prompt: isIR
        ? 'Order the Incident Response lifecycle phases (PICERL) from first to last.'
        : 'Order forensic collection by Order of Volatility — most volatile first.',
      items: isIR ? IR_STEPS : OOV_STEPS,
      shuffled: shuffle(isIR ? IR_STEPS : OOV_STEPS),
      explanation: isIR
        ? 'PICERL: Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned. Cannot skip phases — you must contain before eradicating, and eradicate before recovering.'
        : 'Collect most volatile data first: CPU → RAM → Network → Processes → Disk → Logs → Backups. Power loss permanently destroys registers and RAM evidence.',
    }
  })
}

function OrderCard({
  question, onSubmit, snapshot, descriptions,
}: {
  question: DragOrderQuestion
  onSubmit?: (ordered: string[]) => void
  snapshot?: string[]
  descriptions: Record<string, string>
}) {
  const initial = snapshot ?? question.shuffled ?? question.items
  const [items, setItems] = useState([...initial])
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const { dragProps } = useTouchDrag(items, setItems, setDragOver)

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return
    const newItems = [...items]
    const [moved] = newItems.splice(dragIdx.current, 1)
    newItems.splice(targetIdx, 0, moved)
    setItems(newItems)
    dragIdx.current = null
    setDragOver(null)
  }

  const isReview = !!snapshot
  const isIR = question.id.includes('ir')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Prompt */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: `3px solid ${isIR ? 'var(--c-orange)' : 'var(--c-blue)'}`, borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: isIR ? 'var(--c-orange)' : 'var(--c-blue)', fontWeight: 700, fontSize: 14, margin: 0 }}>{question.prompt}</p>
        {!isReview && <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>Drag steps to reorder • 1 = first action • Touch drag supported</p>}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => {
          const correct = snapshot ? item === question.items[i] : undefined
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          if (correct === true)  { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
          if (correct === false) { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }
          if (dragOver === i && !isReview) { borderColor = 'var(--c-cyan)'; bg = 'rgba(34,211,238,0.06)' }

          return (
            <div
              key={`${item}-${i}`}
              draggable={!isReview}
              onDragStart={() => { dragIdx.current = i }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(i) }}
              {...(!isReview ? dragProps(i) : {})}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px',
                background: bg, border: `1px solid ${borderColor}`,
                borderLeft: `3px solid ${borderColor}`,
                borderRadius: 6,
                cursor: isReview ? 'default' : 'grab',
                transition: 'background 0.12s, border-color 0.12s',
                userSelect: 'none',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, minWidth: 22, color: correct === false ? 'var(--c-pink)' : 'var(--c-dim)' }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: correct === true ? 'var(--c-green)' : correct === false ? 'var(--c-pink)' : 'var(--c-body)', fontWeight: 700, fontSize: 14, margin: 0 }}>{item}</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '3px 0 0', lineHeight: 1.4 }}>{descriptions[item]}</p>
              </div>
              {isReview && <span style={{ color: correct ? 'var(--c-green)' : 'var(--c-pink)', fontSize: 14, marginTop: 2 }}>{correct ? '✓' : '✗'}</span>}
            </div>
          )
        })}
      </div>

      {isReview && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
          <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>CORRECT ORDER:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, marginBottom: 8 }}>
            {question.items.map((s, i) => (
              <span key={s} style={{ color: 'var(--c-green)' }}>{i + 1}. {s}</span>
            ))}
          </div>
          <p style={{ color: 'var(--c-dim)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{question.explanation}</p>
        </div>
      )}

      {!isReview && (
        <button className="btn-neon btn-cyan" style={{ alignSelf: 'center', padding: '8px 28px' }}
          onClick={() => onSubmit?.(items)}>
          ▶ LOCK IN ORDER
        </button>
      )}
    </div>
  )
}

export default function IncidentOrder() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])
  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank) => generateStack(rank),
    timerByRank: TIMER as never, stackSizeByRank: STACK as never,
  })
  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lastCorrect, lives } = state

  const getDescs = (q: DragOrderQuestion) => q.id.includes('ir') ? IR_DESCRIPTIONS : OOV_DESCRIPTIONS

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => {
          const q = question as DragOrderQuestion
          return <OrderCard question={q} snapshot={answerSnapshot as string[]} descriptions={getDescs(q)} />
        }}
      />
    )
  }

  const active = stack[activeIndex]?.question as DragOrderQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <OrderCard question={active} onSubmit={(o) => actions.submitAnswer(o)} descriptions={getDescs(active)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OrderCard question={active} snapshot={lastAnswer as string[]} descriptions={getDescs(active)} />
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} onRetry={lives > 0 ? actions.retryCard : undefined} />
        </div>
      )}
    </PlayHUD>
  )
}
