import { useState, useRef } from 'react'
import { useTouchDrag } from '../../components/engine/useTouchDrag'
import { useNavigate } from 'react-router-dom'
import type { DragRulesetQuestion, FirewallRule, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { FIREWALL_SCENARIOS } from '../../data/firewall'
import { WarnIcon } from '../../components/Icons'

const GAME_ID   = 'firewall-forge'
const GAME_NAME = 'FIREWALL FORGE'
const DESC      = 'Drag firewall rules into the correct top-down order. First match wins — specificity before generality.'

const TIMER: Record<string, number> = { E: 0,   D: 0,   C: 120, B: 90,  A: 75,  S: 60  }
const STACK: Record<string, number> = { E: 1,   D: 2,   C: 2,   B: 3,   A: 3,   S: 3   }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): DragRulesetQuestion[] {
  return shuffle([...FIREWALL_SCENARIOS]).slice(0, STACK[rank]).map((s) => ({
    ...s, shuffledRules: shuffle(s.rules),
  }))
}

function RuleRow({
  rule, index, draggable, isDragging,
  onDragStart, onDragOver, onDrop,
  isCorrect, isReview,
}: {
  rule: FirewallRule; index: number; draggable: boolean; isDragging: boolean
  onDragStart: () => void; onDragOver: () => void; onDrop: () => void
  isCorrect?: boolean; isReview?: boolean
}) {
  const allow  = rule.action === 'ALLOW'
  const acBg   = allow ? 'rgba(74,222,128,0.15)'  : 'rgba(244,114,182,0.15)'
  const acText = allow ? 'var(--c-green)'           : 'var(--c-pink)'
  let leftClr  = 'var(--c-border)'
  if (isReview) leftClr = isCorrect ? 'var(--c-green)' : 'var(--c-pink)'

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'var(--c-surface)',
        border: `1px solid ${isReview ? leftClr : 'var(--c-border)'}`,
        borderLeft: `3px solid ${leftClr}`,
        borderRadius: 6,
        cursor: draggable ? 'grab' : 'default',
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{ color: 'var(--c-dim)', fontSize: 12, fontWeight: 700, minWidth: 20 }}>{index + 1}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
        background: acBg, color: acText, minWidth: 46, textAlign: 'center',
      }}>{rule.action}</span>
      <span style={{ flex: 1, color: 'var(--c-body)', fontSize: 13 }}>{rule.label}</span>
      <span style={{ color: 'var(--c-dim)', fontSize: 10, display: 'flex', gap: 10 }}>
        <span>SRC: {rule.src}</span><span>DST: {rule.dst}</span><span>PORT: {rule.port}</span>
      </span>
      {isReview && <span style={{ color: isCorrect ? 'var(--c-green)' : 'var(--c-pink)', fontSize: 14 }}>{isCorrect ? '✓' : '✗'}</span>}
    </div>
  )
}

function FirewallQuestion({
  question, onSubmit, snapshot,
}: {
  question: DragRulesetQuestion
  onSubmit?: (ids: string[]) => void
  snapshot?: string[]
}) {
  const initial = snapshot
    ? snapshot.map((id) => question.rules.find((r) => r.id === id)!).filter(Boolean)
    : (question.shuffledRules ?? question.rules)
  const [rules, setRules] = useState<FirewallRule[]>(initial)
  const [_dragOver, setDragOver] = useState<number | null>(null)
  const dragIdx = useRef<number | null>(null)
  const correctIds = question.rules.map((r) => r.id)
  const { dragProps } = useTouchDrag(rules, setRules as (items: FirewallRule[]) => void, setDragOver)

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return
    const newRules = [...rules]
    const [moved] = newRules.splice(dragIdx.current, 1)
    newRules.splice(targetIdx, 0, moved)
    setRules(newRules)
    dragIdx.current = null
    setDragOver(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Scenario */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-amber)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-amber)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', margin: '0 0 6px' }}>SCENARIO</p>
        <p style={{ color: 'var(--c-body)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{question.scenario}</p>
        {question.trap && (
          <p style={{ color: 'var(--c-pink)', fontSize: 11, marginTop: 8, padding: '6px 10px', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 4, background: 'rgba(244,114,182,0.06)' }}>
            <WarnIcon size={12} color="var(--c-pink)" style={{ marginRight: 5, flexShrink: 0, verticalAlign: 'middle' }} /> TRAP: {question.trap}
          </p>
        )}
      </div>

      {!snapshot && (
        <p style={{ color: 'var(--c-dim)', fontSize: 11, textAlign: 'center', letterSpacing: '0.08em' }}>
          DRAG rules into correct top-down order — first match wins • Touch drag supported
        </p>
      )}

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rules.map((rule, i) => (
          <div key={rule.id} {...(!snapshot ? dragProps(i) : {})}>
          <RuleRow
            rule={rule} index={i}
            draggable={!snapshot}
            isDragging={dragIdx.current === i}
            onDragStart={() => { dragIdx.current = i }}
            onDragOver={() => setDragOver(i)}
            onDrop={() => handleDrop(i)}
            isReview={!!snapshot}
            isCorrect={snapshot ? correctIds[i] === rule.id : undefined}
          />
          </div>
        ))}
      </div>

      {snapshot && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
          <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>WHY THIS ORDER:</p>
          <p style={{ color: 'var(--c-dim)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{question.explanation}</p>
        </div>
      )}

      {!snapshot && (
        <button className="btn-neon btn-amber" style={{ alignSelf: 'center', padding: '8px 28px' }}
          onClick={() => onSubmit?.(rules.map((r) => r.id))}>
          ▶ COMMIT RULESET
        </button>
      )}
    </div>
  )
}

export default function FirewallForge() {
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
          <FirewallQuestion question={question as DragRulesetQuestion} snapshot={answerSnapshot as string[]} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as DragRulesetQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <FirewallQuestion question={active} onSubmit={(ids) => actions.submitAnswer(ids)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FirewallQuestion question={active} snapshot={lastAnswer as string[]} />
          <ExplainBanner
            correct={lastCorrect}
            explanation={active.explanation}
            onAdvance={actions.advanceCard}
            onRetry={lives > 0 ? actions.retryCard : undefined}
          />
        </div>
      )}
    </PlayHUD>
  )
}
