import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DragMatchQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { ATTACKS } from '../../data/attacks'

const GAME_ID   = 'attack-match'
const GAME_NAME = 'ATTACK MATCH'
const DESC      = 'Click an attack name to select it, then click its matching description. Cover social engineering, credential attacks, network exploits, and more.'
const TIMER: Record<string, number> = { E: 0,  D: 90, C: 75, B: 60, A: 50, S: 40 }
const STACK: Record<string, number> = { E: 3,  D: 4,  C: 4,  B: 5,  A: 5,  S: 6  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

const CATEGORY_COLORS: Record<string, string> = {
  network:    'var(--c-blue)',
  credential: 'var(--c-amber)',
  web:        'var(--c-cyan)',
  social:     'var(--c-violet)',
  malware:    'var(--c-pink)',
  crypto:     'var(--c-green)',
}

function generateStack(rank: Rank): DragMatchQuestion[] {
  const count = STACK[rank]
  const pool  = shuffle([...ATTACKS])
  const qs: DragMatchQuestion[] = []
  // batch into groups of 4
  for (let i = 0; i < pool.length && qs.length < count; i += 4) {
    const batch = pool.slice(i, i + 4)
    if (batch.length < 2) break
    qs.push({
      id: `am-q-${i}`,
      kind: 'drag-match',
      prompt: 'Match each attack name to its correct description.',
      pairs: batch.map((a) => ({ label: a.name, match: a.description })),
      explanation: batch.map((a) => `${a.name} [${a.category}]: ${a.description}`).join('\n\n'),
    })
  }
  return qs
}

// ─── Click-to-match UI ────────────────────────────────────────────────────────
function MatchGame({
  question, onSubmit, snapshot,
}: {
  question: DragMatchQuestion
  onSubmit?: (ans: Record<string, string>) => void
  snapshot?: Record<string, string>
}) {
  const [selected, setSelected] = useState<string | null>(null) // selected name
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const correctMap: Record<string, string> = {}
  question.pairs.forEach((p) => { correctMap[p.label] = p.match })

  const allMatched = question.pairs.every((p) => assignments[p.label])

  const handleNameClick = (label: string) => {
    if (snapshot) return
    setSelected(selected === label ? null : label)
  }

  const handleDescClick = (match: string) => {
    if (snapshot || !selected) return
    // If this description is already taken, unassign the old name
    const prevOwner = Object.keys(assignments).find((k) => assignments[k] === match)
    const next = { ...assignments }
    if (prevOwner) delete next[prevOwner]
    next[selected] = match
    setAssignments(next)
    setSelected(null)
  }

  const handleUnassign = (label: string) => {
    if (snapshot) return
    const next = { ...assignments }
    delete next[label]
    setAssignments(next)
  }

  // Descriptions not yet assigned
  const unassignedDescs = question.pairs.map((p) => p.match).filter((m) => !Object.values(assignments).includes(m))
  const isReview = !!snapshot

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Prompt */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-violet)', borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: 'var(--c-violet)', fontWeight: 700, fontSize: 14, margin: 0 }}>{question.prompt}</p>
        {!isReview && <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>
          {selected ? `"${selected}" selected — click a description to assign it` : 'Click an attack name to select it'}
        </p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: attack names */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ color: 'var(--c-dim)', fontSize: 10, letterSpacing: '0.12em', margin: '0 0 4px' }}>ATTACK NAMES</p>
          {question.pairs.map((p) => {
            const atk    = ATTACKS.find((a) => a.name === p.label)
            const cat    = atk?.category ?? 'network'
            const color  = CATEGORY_COLORS[cat]
            const isAssigned = !!assignments[p.label] || (isReview && !!snapshot![p.label])
            const isSel  = selected === p.label

            let bg      = 'var(--c-surface)'
            let border  = 'var(--c-border)'
            let opacity = 1
            if (isSel)       { bg = 'rgba(167,139,250,0.12)'; border = 'var(--c-violet)' }
            if (isAssigned && !isReview) { opacity = 0.5 }

            // Review coloring
            if (isReview) {
              const userMatch = snapshot![p.label]
              const ok = userMatch === correctMap[p.label]
              border = ok ? 'var(--c-green)' : 'var(--c-pink)'
              bg = ok ? 'rgba(74,222,128,0.07)' : 'rgba(244,114,182,0.07)'
            }

            return (
              <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  onClick={() => handleNameClick(p.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px',
                    background: bg, border: `1px solid ${border}`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 6, cursor: isReview ? 'default' : 'pointer',
                    textAlign: 'left', fontFamily: 'inherit', opacity, transition: 'all 0.12s',
                  }}
                >
                  <span style={{ color, fontSize: 10, fontWeight: 700, minWidth: 40, letterSpacing: '0.05em' }}>{cat.toUpperCase()}</span>
                  <span style={{ color: 'var(--c-body)', fontSize: 13, fontWeight: 700, flex: 1 }}>{p.label}</span>
                  {isAssigned && !isReview && (
                    <button onClick={(e) => { e.stopPropagation(); handleUnassign(p.label) }}
                      style={{ color: 'var(--c-dim)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                  )}
                  {isReview && <span style={{ fontSize: 13, color: snapshot![p.label] === correctMap[p.label] ? 'var(--c-green)' : 'var(--c-pink)' }}>
                    {snapshot![p.label] === correctMap[p.label] ? '✓' : '✗'}
                  </span>}
                </button>
                {/* Show assigned description below the name */}
                {assignments[p.label] && !isReview && (
                  <div style={{ fontSize: 11, color: 'var(--c-dim)', padding: '4px 12px', borderLeft: `3px solid ${color}`, marginLeft: 3, lineHeight: 1.4 }}>
                    {assignments[p.label].slice(0, 80)}…
                  </div>
                )}
                {isReview && (
                  <div style={{ fontSize: 11, lineHeight: 1.4, padding: '4px 12px', borderLeft: `3px solid ${snapshot![p.label] === correctMap[p.label] ? 'var(--c-green)' : 'var(--c-pink)'}`, marginLeft: 3 }}>
                    <span style={{ color: 'var(--c-dim)' }}>Correct: </span>
                    <span style={{ color: 'var(--c-green)' }}>{correctMap[p.label].slice(0, 80)}…</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: description pool */}
        {!isReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ color: 'var(--c-dim)', fontSize: 10, letterSpacing: '0.12em', margin: '0 0 4px' }}>DESCRIPTIONS — click to assign</p>
            {unassignedDescs.map((desc) => (
              <button
                key={desc}
                onClick={() => handleDescClick(desc)}
                disabled={!selected}
                style={{
                  padding: '10px 12px',
                  background: selected ? 'rgba(167,139,250,0.05)' : 'var(--c-surface)',
                  border: `1px solid ${selected ? 'var(--c-violet)' : 'var(--c-border)'}`,
                  borderRadius: 6, cursor: selected ? 'pointer' : 'default',
                  textAlign: 'left', fontFamily: 'inherit',
                  color: 'var(--c-body)', fontSize: 12, lineHeight: 1.5,
                  transition: 'all 0.12s',
                }}
              >
                {desc}
              </button>
            ))}
            {unassignedDescs.length === 0 && (
              <p style={{ color: 'var(--c-green)', fontSize: 12, fontStyle: 'italic', padding: 8 }}>All descriptions assigned ✓</p>
            )}
          </div>
        )}
      </div>

      {!isReview && (
        <button
          className="btn-neon btn-violet"
          style={{ alignSelf: 'center', padding: '8px 28px' }}
          disabled={!allMatched}
          onClick={() => {
            const ans: Record<string, string> = {}
            question.pairs.forEach((p) => { ans[p.label] = assignments[p.label] ?? '' })
            onSubmit?.(ans)
          }}
        >
          ▶ SUBMIT MATCHES
        </button>
      )}
    </div>
  )
}

export default function AttackMatch() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])
  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank) => generateStack(rank),
    timerByRank: TIMER as never, stackSizeByRank: STACK as never,
  })
  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lastCorrect } = state

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => (
          <MatchGame question={question as DragMatchQuestion} snapshot={answerSnapshot as Record<string, string>} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as DragMatchQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <MatchGame question={active} onSubmit={(ans) => actions.submitAnswer(ans)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MatchGame question={active} snapshot={lastAnswer as Record<string, string>} />
          <ExplainBanner
            correct={lastCorrect}
            explanation={active.explanation}
            onAdvance={actions.advanceCard}
          />
        </div>
      )}
    </PlayHUD>
  )
}
