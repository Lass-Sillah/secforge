import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion, DragOrderQuestion, Question, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import {
  PKI_CERT_SCENARIOS, PKI_ISSUE_SCENARIOS, TLS_HANDSHAKE_QUESTION,
  TLS_HANDSHAKE_STEPS, TLS_HANDSHAKE_DESCRIPTIONS,
  CERT_TYPES, type CertIssueScenario,
} from '../../data/pki'
import { WarnIcon } from '../../components/Icons'

const GAME_ID   = 'pki-lab'
const GAME_NAME = 'PKI LAB'
const DESC      = 'Select the right certificate type, diagnose cert issues from a mock viewer, and sequence the TLS handshake.'
const TIMER: Record<string, number> = { E: 0, D: 60, C: 50, B: 45, A: 35, S: 30 }
const STACK: Record<string, number> = { E: 2, D: 3,  C: 4,  B: 5,  A: 5,  S: 6  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): Question[] {
  const count = STACK[rank]
  const pool = shuffle([...PKI_CERT_SCENARIOS, ...PKI_ISSUE_SCENARIOS])
  const picked: Question[] = pool.slice(0, count - 1)
  // Always include TLS handshake at ranks C+
  if (RANKS.indexOf(rank) >= 2) picked.push({ ...TLS_HANDSHAKE_QUESTION, shuffled: shuffle(TLS_HANDSHAKE_STEPS) })
  else picked.push(pool[count - 1] ?? pool[0])
  return picked
}

// ─── Cert type question ───────────────────────────────────────────────────────
function CertTypeQuestion({
  question, onAnswer, submittedIndex,
}: {
  question: MultipleChoiceQuestion
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
}) {
  const isReview = submittedIndex != null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-violet)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-violet)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 8px' }}>SCENARIO — WHICH CERT TYPE?</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {question.options.map((opt, i) => {
          const ct = CERT_TYPES[opt]
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          if (isReview) {
            if (i === question.correctIndex) { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
            else if (i === submittedIndex)    { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }
          }
          const nameColor = isReview && i === question.correctIndex ? 'var(--c-green)'
            : isReview && i === submittedIndex ? 'var(--c-pink)'
            : ct?.color ?? 'var(--c-body)'
          return (
            <button key={i} disabled={isReview} onClick={() => onAnswer?.(i)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 14px', background: bg, border: `1px solid ${borderColor}`, borderLeft: `4px solid ${isReview ? borderColor : (ct?.color ?? 'var(--c-border)')}`, borderRadius: 6, cursor: isReview ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s' }}
              onMouseEnter={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = bg }}
            >
              <span style={{ color: nameColor, fontWeight: 900, fontSize: 18 }}>{opt}</span>
              {ct && <span style={{ color: 'var(--c-dim)', fontSize: 10, marginTop: 3 }}>{ct.full}</span>}
              {ct && <span style={{ color: 'var(--c-dim)', fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{ct.useCase}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cert issue question (with mock cert viewer) ──────────────────────────────
function CertIssueQuestion({
  question, onAnswer, submittedIndex,
}: {
  question: CertIssueScenario
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
}) {
  const isReview = submittedIndex != null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-cyan)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 8px' }}>CERTIFICATE ANALYSIS — WHAT IS WRONG?</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
      </div>

      {/* Mock cert viewer */}
      <div style={{ background: '#080c10', border: '1px solid var(--c-border)', borderRadius: 6, padding: '16px 20px' }}>
        <p style={{ color: 'var(--c-dim)', fontSize: 10, letterSpacing: '0.1em', margin: '0 0 12px' }}>▸ CERTIFICATE DETAILS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {question.certDisplay.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 10px', borderRadius: 4, background: row.flagged ? 'rgba(244,114,182,0.1)' : 'transparent', border: row.flagged ? '1px solid rgba(244,114,182,0.3)' : '1px solid transparent', fontSize: 13 }}>
              <span style={{ color: 'var(--c-dim)', minWidth: 120, flexShrink: 0 }}>{row.field}:</span>
              <span style={{ color: row.flagged ? 'var(--c-pink)' : 'var(--c-body)', fontWeight: row.flagged ? 700 : 400 }}>{row.value}{row.flagged ? <WarnIcon size={12} color="var(--c-pink)" style={{ marginLeft: 6, verticalAlign: 'middle' }} /> : null}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {question.options.map((opt, i) => {
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          let textColor = 'var(--c-body)'
          if (isReview) {
            if (i === question.correctIndex) { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)'; textColor = 'var(--c-green)' }
            else if (i === submittedIndex)    { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)'; textColor = 'var(--c-pink)' }
          }
          return (
            <button key={i} disabled={isReview} onClick={() => onAnswer?.(i)}
              style={{ padding: '10px 14px', background: bg, border: `1px solid ${borderColor}`, borderRadius: 6, cursor: isReview ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', color: textColor, fontSize: 12, fontWeight: 600, transition: 'all 0.12s' }}
              onMouseEnter={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = bg }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── TLS Handshake drag-order ─────────────────────────────────────────────────
function TLSHandshake({
  question, onSubmit, snapshot,
}: {
  question: DragOrderQuestion
  onSubmit?: (ordered: string[]) => void
  snapshot?: string[]
}) {
  const initial = snapshot ?? question.shuffled ?? question.items
  const [items, setItems] = useState([...initial])
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const isReview = !!snapshot

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return
    const next = [...items]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(targetIdx, 0, moved)
    setItems(next)
    dragIdx.current = null
    setDragOver(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-green)', borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: 'var(--c-green)', fontWeight: 700, fontSize: 14, margin: 0 }}>{question.prompt}</p>
        {!isReview && <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>Drag steps to reorder • 1 = first</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((step, i) => {
          const correct = isReview ? step === question.items[i] : undefined
          let borderColor = dragOver === i && !isReview ? 'var(--c-cyan)' : 'var(--c-border)'
          let bg = dragOver === i && !isReview ? 'rgba(34,211,238,0.06)' : 'var(--c-surface)'
          if (correct === true)  { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
          if (correct === false) { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }

          return (
            <div key={`${step}-${i}`}
              draggable={!isReview}
              onDragStart={() => { dragIdx.current = i }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(i) }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: bg, border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 6, cursor: isReview ? 'default' : 'grab', userSelect: 'none', transition: 'all 0.12s' }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, minWidth: 20, color: 'var(--c-dim)' }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: correct === true ? 'var(--c-green)' : correct === false ? 'var(--c-pink)' : 'var(--c-cyan)', fontWeight: 700, fontSize: 13, margin: 0 }}>{step}</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '3px 0 0', lineHeight: 1.4 }}>{TLS_HANDSHAKE_DESCRIPTIONS[step]}</p>
              </div>
              {isReview && <span style={{ color: correct ? 'var(--c-green)' : 'var(--c-pink)', fontSize: 14 }}>{correct ? '✓' : '✗'}</span>}
            </div>
          )
        })}
      </div>

      {isReview && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
          <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>CORRECT ORDER:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, marginBottom: 8 }}>
            {question.items.map((s, i) => <span key={s} style={{ color: 'var(--c-green)' }}>{i + 1}. {s}</span>)}
          </div>
          <p style={{ color: 'var(--c-dim)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{question.explanation}</p>
        </div>
      )}

      {!isReview && (
        <button className="btn-neon btn-green" style={{ alignSelf: 'center', padding: '8px 28px' }} onClick={() => onSubmit?.(items)}>
          ▶ LOCK IN HANDSHAKE
        </button>
      )}
    </div>
  )
}

export default function PkiLab() {
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
        renderReviewCard={({ question, answerSnapshot }) => {
          if (question.kind === 'drag-order')
            return <TLSHandshake question={question as DragOrderQuestion} snapshot={answerSnapshot as string[]} />
          if ((question as MultipleChoiceQuestion & { certDisplay?: unknown }).certDisplay)
            return <CertIssueQuestion question={question as CertIssueScenario} submittedIndex={answerSnapshot as number} />
          return <CertTypeQuestion question={question as MultipleChoiceQuestion} submittedIndex={answerSnapshot as number} />
        }}
      />
    )
  }

  const active = stack[activeIndex]?.question

  function renderActive(submit?: boolean) {
    if (!active) return null
    const onMC = submit ? (i: number) => actions.submitAnswer(i) : undefined
    const onOrder = submit ? (o: string[]) => actions.submitAnswer(o) : undefined
    const snap = !submit ? lastAnswer : undefined

    if (active.kind === 'drag-order')
      return <TLSHandshake question={active as DragOrderQuestion} onSubmit={onOrder} snapshot={snap as string[] | undefined} />
    if ((active as MultipleChoiceQuestion & { certDisplay?: unknown }).certDisplay)
      return <CertIssueQuestion question={active as CertIssueScenario} onAnswer={onMC} submittedIndex={snap != null ? snap as number : null} />
    return <CertTypeQuestion question={active as MultipleChoiceQuestion} onAnswer={onMC} submittedIndex={snap != null ? snap as number : null} />
  }

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && renderActive(true)}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {renderActive(false)}
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} onRetry={lives > 0 ? actions.retryCard : undefined} />
        </div>
      )}
    </PlayHUD>
  )
}
