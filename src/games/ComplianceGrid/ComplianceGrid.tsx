import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import {
  ALL_COMPLIANCE_QUESTIONS, COMPLIANCE_BY_DIFFICULTY,
  CATEGORY_LABELS, CATEGORY_COLORS, type ComplianceQuestion,
} from '../../data/compliance'

const GAME_ID   = 'compliance-grid'
const GAME_NAME = 'COMPLIANCE GRID'
const DESC      = 'Domain 5 GRC — scenario-based MCQs covering risk management (SLE/ALE/ARO formulas), regulatory compliance (GDPR, HIPAA, PCI-DSS, SOX), security frameworks (NIST CSF, ISO 27001, CIS, CMMC), BCP/DR planning (RTO, RPO, RAID, backup types), and data governance roles.'

const TIMER: Record<string, number> = { E: 0, D: 0, C: 60, B: 50, A: 40, S: 30 }
const STACK: Record<string, number> = { E: 4, D: 5, C: 6, B: 7, A: 8, S: 10 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// At lower ranks use easier questions; higher ranks include hard questions
function generateStack(rank: Rank, _attempt: number): ComplianceQuestion[] {
  const count = STACK[rank]
  let pool: ComplianceQuestion[]

  if (rank === 'E') {
    pool = shuffle([...COMPLIANCE_BY_DIFFICULTY.easy])
  } else if (rank === 'D') {
    pool = shuffle([...COMPLIANCE_BY_DIFFICULTY.easy, ...COMPLIANCE_BY_DIFFICULTY.medium])
  } else if (rank === 'C' || rank === 'B') {
    pool = shuffle([...COMPLIANCE_BY_DIFFICULTY.medium, ...COMPLIANCE_BY_DIFFICULTY.easy])
  } else {
    // A and S: all difficulties weighted toward hard
    pool = shuffle([
      ...COMPLIANCE_BY_DIFFICULTY.hard,
      ...COMPLIANCE_BY_DIFFICULTY.hard,   // doubled weight
      ...COMPLIANCE_BY_DIFFICULTY.medium,
      ...COMPLIANCE_BY_DIFFICULTY.easy,
    ])
  }

  // Deduplicate by id and slice to needed count
  const seen = new Set<string>()
  const unique: ComplianceQuestion[] = []
  for (const q of pool) {
    if (!seen.has(q.id)) {
      seen.add(q.id)
      unique.push(q)
    }
    if (unique.length >= count) break
  }

  // Pad with any remaining questions if not enough in difficulty tier
  if (unique.length < count) {
    for (const q of shuffle([...ALL_COMPLIANCE_QUESTIONS])) {
      if (!seen.has(q.id)) {
        seen.add(q.id)
        unique.push(q)
      }
      if (unique.length >= count) break
    }
  }

  // Shuffle each MCQ's options so the correct answer isn't always in a predictable position
  return unique.map((q) => {
    const indexed = q.options.map((o, i) => ({ o, correct: i === q.correctIndex }))
    const shuffled = shuffle(indexed)
    return {
      ...q,
      options: shuffled.map((x) => x.o),
      correctIndex: shuffled.findIndex((x) => x.correct),
    }
  })
}

// ─── Question card ────────────────────────────────────────────────────────────

function ComplianceCard({
  question,
  onSubmit,
  snapshot,
}: {
  question: ComplianceQuestion
  onSubmit?: (idx: number) => void
  snapshot?: number
}) {
  const [picked, setPicked] = useState<number | null>(snapshot ?? null)
  const isReview = snapshot !== undefined
  const catColor = CATEGORY_COLORS[question.category]

  // Bold **...** sections
  const renderText = (text: string) => {
    const parts = text.split('**')
    return (
      <span>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <span key={i} style={{ color: 'var(--c-amber)', fontWeight: 700 }}>{p}</span>
            : <span key={i}>{p}</span>
        )}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          color: catColor, borderBottom: `1px solid ${catColor}`,
          paddingBottom: 1, fontFamily: 'var(--font-mono)',
        }}>{CATEGORY_LABELS[question.category]}</span>
        <span style={{
          fontSize: 9, letterSpacing: '0.1em',
          fontFamily: 'var(--font-mono)',
          color: question.difficulty === 'hard' ? 'var(--c-pink)' : question.difficulty === 'medium' ? 'var(--c-amber)' : 'var(--c-green)',
        }}>{question.difficulty.toUpperCase()}</span>
      </div>

      {/* Prompt */}
      <div style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderLeft: `3px solid ${catColor}`, borderRadius: 6, padding: '14px 18px',
      }}>
        <p style={{ color: 'var(--c-body)', fontSize: 14, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
          {renderText(question.prompt)}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options.map((opt, i) => {
          let border = 'var(--c-border)'
          let bg     = 'var(--c-surface)'
          let color  = 'var(--c-body)'

          if (isReview) {
            if (i === question.correctIndex)     { border = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)'; color = 'var(--c-green)' }
            else if (i === snapshot && snapshot !== question.correctIndex) { border = 'var(--c-pink)'; bg = 'rgba(244,114,182,0.07)'; color = 'var(--c-pink)' }
          } else if (picked === i) {
            border = catColor; bg = `${catColor}15`
          }

          return (
            <button
              key={i}
              onClick={() => { if (!isReview) setPicked(i) }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '11px 16px', background: bg, border: `1px solid ${border}`,
                borderRadius: 6, cursor: isReview ? 'default' : 'pointer',
                textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'all 0.12s',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, minWidth: 24,
                color: isReview
                  ? (i === question.correctIndex ? 'var(--c-green)' : i === snapshot ? 'var(--c-pink)' : 'var(--c-dim)')
                  : (picked === i ? catColor : 'var(--c-dim)'),
                flexShrink: 0,
              }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ color, fontSize: 13, lineHeight: 1.55, flex: 1 }}>{opt}</span>
              {isReview && i === question.correctIndex && <span style={{ color: 'var(--c-green)', marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
              {isReview && i === snapshot && snapshot !== question.correctIndex && <span style={{ color: 'var(--c-pink)', marginLeft: 'auto', flexShrink: 0 }}>✗</span>}
            </button>
          )
        })}
      </div>

      {!isReview && (
        <button
          className="btn-neon btn-cyan"
          style={{ alignSelf: 'center', padding: '8px 28px' }}
          disabled={picked === null}
          onClick={() => { if (picked !== null) onSubmit?.(picked) }}
        >
          ▶ CONFIRM ANSWER
        </button>
      )}
    </div>
  )
}

// ─── Game root ────────────────────────────────────────────────────────────────

export default function ComplianceGrid() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])

  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank, attempt) => generateStack(rank, attempt) as never,
    timerByRank: TIMER as never,
    stackSizeByRank: STACK as never,
  })

  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lastCorrect } = state

  if (phase === 'menu')     return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')   return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup')  return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory')  return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => (
          <ComplianceCard question={question as ComplianceQuestion} snapshot={answerSnapshot as number} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as ComplianceQuestion | undefined
  if (!active) return null

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {!pendingAdvance && (
        <ComplianceCard question={active} onSubmit={(idx) => actions.submitAnswer(idx)} />
      )}
      {pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ComplianceCard question={active} snapshot={lastAnswer as number} />
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} />
        </div>
      )}
    </PlayHUD>
  )
}
