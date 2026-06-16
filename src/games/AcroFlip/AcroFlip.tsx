import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { ACRONYMS_UNIQUE } from '../../data/acronyms'

const GAME_ID   = 'acro-flip'
const GAME_NAME = 'ACRO FLIP'
const DESC      = 'Master Security+ acronyms through memory card matching and fill-in-the-blank challenges. Flip pairs, spell out expansions, identify acronyms from definitions.'
const TIMER: Record<string, number> = { E: 0,  D: 90, C: 75, B: 60, A: 50, S: 40 }
const STACK: Record<string, number> = { E: 4,  D: 5,  C: 6,  B: 7,  A: 8,  S: 10 }

const DOMAIN_COLORS: Record<string, string> = {
  D1: 'var(--c-blue)',
  D2: 'var(--c-pink)',
  D3: 'var(--c-cyan)',
  D4: 'var(--c-green)',
  D5: 'var(--c-violet)',
}
const DOMAIN_LABELS: Record<string, string> = {
  D1: 'D1 General', D2: 'D2 Threats', D3: 'D3 Architecture', D4: 'D4 Operations', D5: 'D5 Governance',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Question generators ───────────────────────────────────────────────────────

function makeMultipleChoiceQ(index: number, mode: 'expansion' | 'acronym'): MultipleChoiceQuestion {
  const pool = shuffle([...ACRONYMS_UNIQUE])
  const correct = pool[0]
  const distractors = pool.slice(1, 4)
  const options =
    mode === 'expansion'
      ? shuffle([correct.expansion, ...distractors.map((d) => d.expansion)])
      : shuffle([correct.acronym, ...distractors.map((d) => d.acronym)])
  const correctIndex = mode === 'expansion'
    ? options.indexOf(correct.expansion)
    : options.indexOf(correct.acronym)

  return {
    id: `af-mc-${mode}-${index}`,
    kind: 'multiple-choice',
    prompt: mode === 'expansion'
      ? `What does **${correct.acronym}** stand for?`
      : `Which acronym means: "${correct.expansion}"?`,
    options,
    correctIndex,
    explanation: `**${correct.acronym}** = ${correct.expansion}\n\n${correct.hint}`,
  }
}

function generateStack(rank: Rank, attempt: number): MultipleChoiceQuestion[] {
  const count = STACK[rank]
  return Array.from({ length: count }, (_, i) =>
    makeMultipleChoiceQ(attempt * 100 + i, i % 2 === 0 ? 'expansion' : 'acronym')
  )
}

// ─── Memory Card Flip Mini-game ───────────────────────────────────────────────

interface MemCard {
  id: string
  text: string
  pairId: string
  side: 'acronym' | 'expansion'
}

function MemoryFlipGame({ onComplete }: { onComplete: (success: boolean) => void }) {
  const pairCount = 6
  const pairs = shuffle([...ACRONYMS_UNIQUE]).slice(0, pairCount)

  const [cards] = useState<MemCard[]>(() =>
    shuffle(
      pairs.flatMap((p) => [
        { id: `${p.acronym}-a`, text: p.acronym, pairId: p.acronym, side: 'acronym' as const },
        { id: `${p.acronym}-e`, text: p.expansion, pairId: p.acronym, side: 'expansion' as const },
      ])
    )
  )

  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<MemCard | null>(null)
  const [locked, setLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(90)
  const [shake, setShake] = useState<string | null>(null)

  // timer
  useEffect(() => {
    if (matched.size === cards.length) return
    if (timeLeft <= 0) { onComplete(false); return }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, matched.size, cards.length, onComplete])

  // success
  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      setTimeout(() => onComplete(true), 500)
    }
  }, [matched.size, cards.length, onComplete])

  const handleFlip = useCallback((card: MemCard) => {
    if (locked || matched.has(card.pairId) || flipped.has(card.id)) return

    const newFlipped = new Set(flipped)
    newFlipped.add(card.id)
    setFlipped(newFlipped)

    if (!selected) {
      setSelected(card)
      return
    }

    // second card picked
    setLocked(true)
    if (selected.pairId === card.pairId && selected.id !== card.id) {
      // match!
      setTimeout(() => {
        setMatched((prev) => new Set([...prev, card.pairId]))
        setSelected(null)
        setLocked(false)
      }, 500)
    } else {
      // no match — flip back after delay
      setShake(card.pairId)
      setTimeout(() => {
        setFlipped((prev) => {
          const next = new Set(prev)
          next.delete(selected.id)
          next.delete(card.id)
          return next
        })
        setSelected(null)
        setLocked(false)
        setShake(null)
      }, 900)
    }
  }, [locked, matched, flipped, selected])

  const pct = (timeLeft / 90) * 100
  const timerColor = pct > 50 ? 'var(--c-green)' : pct > 25 ? 'var(--c-amber)' : 'var(--c-pink)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-cyan)', borderRadius: 6, padding: '12px 16px' }}>
        <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 14, margin: 0 }}>MEMORY FLIP — Find all {pairCount} matching pairs</p>
        <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>Click a card to flip it. Match each acronym to its full expansion.</p>
      </div>

      {/* Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: timerColor, fontWeight: 700, fontSize: 13, minWidth: 28 }}>{timeLeft}s</span>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background 0.5s' }} />
        </div>
        <span style={{ color: 'var(--c-dim)', fontSize: 11 }}>{matched.size / 2}/{pairCount} matched</span>
      </div>

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cards.map((card) => {
          const isFlipped = flipped.has(card.id) || matched.has(card.pairId)
          const isMatched = matched.has(card.pairId)
          const isShaking = shake === card.pairId && flipped.has(card.id)

          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              style={{
                position: 'relative',
                height: 80,
                background: isMatched
                  ? 'rgba(74,222,128,0.1)'
                  : isFlipped
                  ? 'var(--c-surface)'
                  : 'rgba(34,211,238,0.06)',
                border: `1px solid ${isMatched ? 'var(--c-green)' : isFlipped ? (card.side === 'acronym' ? 'var(--c-cyan)' : 'var(--c-violet)') : 'var(--c-border)'}`,
                borderRadius: 6,
                cursor: isMatched || locked ? 'default' : 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: 'inherit',
                transition: 'all 0.18s',
                animation: isShaking ? 'shakeCard 0.4s ease' : undefined,
                boxShadow: isMatched ? '0 0 8px rgba(74,222,128,0.2)' : undefined,
              }}
            >
              {isFlipped ? (
                <div>
                  {card.side === 'acronym' && (
                    <p style={{ color: 'var(--c-dim)', fontSize: 8, letterSpacing: '0.1em', margin: '0 0 2px' }}>ACRONYM</p>
                  )}
                  <p style={{
                    color: isMatched ? 'var(--c-green)' : card.side === 'acronym' ? 'var(--c-cyan)' : 'var(--c-violet)',
                    fontWeight: card.side === 'acronym' ? 700 : 400,
                    fontSize: card.side === 'acronym' ? 16 : 10,
                    lineHeight: 1.3,
                    margin: 0,
                    wordBreak: 'break-word',
                  }}>
                    {card.text}
                  </p>
                  {isMatched && <span style={{ fontSize: 14, color: 'var(--c-green)' }}>✓</span>}
                </div>
              ) : (
                <span style={{ fontSize: 22, color: 'var(--c-border)', userSelect: 'none' }}>?</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Multiple Choice Question UI ───────────────────────────────────────────────

function ChoiceCard({
  question, onSubmit, snapshot,
}: {
  question: MultipleChoiceQuestion
  onSubmit?: (idx: number) => void
  snapshot?: number
}) {
  const [picked, setPicked] = useState<number | null>(snapshot ?? null)
  const isReview = snapshot !== undefined

  const promptParts = question.prompt.split('**')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Prompt */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-cyan)', borderRadius: 6, padding: '14px 18px' }}>
        <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          {promptParts.map((part, i) =>
            i % 2 === 1
              ? <span key={i} style={{ color: 'var(--c-amber)', letterSpacing: '0.06em' }}>{part}</span>
              : <span key={i}>{part}</span>
          )}
        </p>
        {!isReview && <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>Select the correct answer</p>}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options.map((opt, i) => {
          let border = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          let textColor = 'var(--c-body)'

          if (isReview) {
            if (i === question.correctIndex) { border = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)'; textColor = 'var(--c-green)' }
            else if (i === snapshot && snapshot !== question.correctIndex) { border = 'var(--c-pink)'; bg = 'rgba(244,114,182,0.07)'; textColor = 'var(--c-pink)' }
          } else if (picked === i) {
            border = 'var(--c-cyan)'; bg = 'rgba(34,211,238,0.07)'
          }

          return (
            <button
              key={i}
              onClick={() => { if (!isReview) setPicked(i) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: bg, border: `1px solid ${border}`,
                borderRadius: 6, cursor: isReview ? 'default' : 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              <span style={{
                fontWeight: 700, fontSize: 13, minWidth: 24, color:
                  isReview
                    ? (i === question.correctIndex ? 'var(--c-green)' : i === snapshot ? 'var(--c-pink)' : 'var(--c-dim)')
                    : (picked === i ? 'var(--c-cyan)' : 'var(--c-dim)'),
              }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ color: textColor, fontSize: 13, lineHeight: 1.5 }}>{opt}</span>
              {isReview && i === question.correctIndex && <span style={{ marginLeft: 'auto', color: 'var(--c-green)' }}>✓</span>}
              {isReview && i === snapshot && snapshot !== question.correctIndex && <span style={{ marginLeft: 'auto', color: 'var(--c-pink)' }}>✗</span>}
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

// ─── Memory Flip as a scored question ─────────────────────────────────────────

function MemoryFlipQuestion({
  onSubmit,
}: {
  onSubmit: (correct: boolean) => void
}) {
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)

  const handleComplete = useCallback((success: boolean) => {
    if (done) return
    setDone(true)
    setResult(success)
    setTimeout(() => onSubmit(success), 400)
  }, [done, onSubmit])

  return (
    <div>
      <MemoryFlipGame onComplete={handleComplete} />
      {done && result !== null && (
        <div style={{ marginTop: 12, textAlign: 'center', color: result ? 'var(--c-green)' : 'var(--c-pink)', fontWeight: 700 }}>
          {result ? '✓ ALL PAIRS MATCHED!' : '✗ TIME UP!'}
        </div>
      )}
    </div>
  )
}

// ─── Acro Flip game entry point ───────────────────────────────────────────────

type AcroQuestion =
  | MultipleChoiceQuestion
  | { id: string; kind: 'memory-flip'; prompt: string; explanation: string }

function generateAcroStack(rank: Rank, attempt: number): AcroQuestion[] {
  const count = STACK[rank]
  const mcCount = Math.max(1, count - (rank >= 'C' ? 1 : 0))
  const mcQuestions = generateStack(rank, attempt).slice(0, mcCount)
  const result: AcroQuestion[] = [...mcQuestions]

  // insert a memory flip round at rank C+
  if (rank >= 'C') {
    result.splice(Math.floor(mcCount / 2), 0, {
      id: `af-flip-${attempt}`,
      kind: 'memory-flip',
      prompt: 'Find all matching acronym/expansion pairs before time runs out.',
      explanation: 'Memory flip: acronyms paired with their full expansions. Fastest way to drill recognition.',
    } as AcroQuestion)
  }
  return result
}

export default function AcroFlip() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])

  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank, attempt) => generateAcroStack(rank, attempt) as never,
    timerByRank: TIMER as never,
    stackSizeByRank: STACK as never,
  })

  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lastCorrect } = state
  const [flipDone, setFlipDone] = useState(false)

  // reset flipDone when advancing to a new card
  useEffect(() => { setFlipDone(false) }, [activeIndex])

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => {
          const q = question as AcroQuestion
          if (q.kind === 'memory-flip') {
            return (
              <div style={{ padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6 }}>
                <p style={{ color: 'var(--c-cyan)', fontWeight: 700, marginBottom: 8 }}>MEMORY FLIP</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 12 }}>{q.explanation}</p>
              </div>
            )
          }
          return (
            <ChoiceCard
              question={q as MultipleChoiceQuestion}
              snapshot={answerSnapshot as number}
            />
          )
        }}
      />
    )
  }

  const active = stack[activeIndex]?.question as AcroQuestion | undefined
  if (!active) return null

  const isFlipCard = active.kind === 'memory-flip'

  const handleFlipResult = (success: boolean) => {
    if (flipDone) return
    setFlipDone(true)
    actions.submitAnswer(success ? 1 : -1)
  }

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {/* Domain badge on MC questions */}
      {!isFlipCard && (() => {
        const mc = active as MultipleChoiceQuestion
        const acroId = mc.prompt.match(/\*\*([^*]+)\*\*/) ?
          mc.prompt.match(/\*\*([^*]+)\*\*/)![1] : null
        const acroData = acroId ? ACRONYMS_UNIQUE.find(a => a.acronym === acroId) : null
        return acroData ? (
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: 10, letterSpacing: '0.1em', fontWeight: 700,
              color: DOMAIN_COLORS[acroData.domain],
              borderBottom: `1px solid ${DOMAIN_COLORS[acroData.domain]}`,
              paddingBottom: 1,
            }}>
              {DOMAIN_LABELS[acroData.domain]}
            </span>
          </div>
        ) : null
      })()}

      {/* Flip card mode */}
      {isFlipCard && !pendingAdvance && !flipDone && (
        <MemoryFlipQuestion onSubmit={handleFlipResult} />
      )}
      {isFlipCard && !pendingAdvance && flipDone && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-dim)' }}>Processing…</div>
      )}

      {/* Multiple choice mode */}
      {!isFlipCard && !pendingAdvance && (
        <ChoiceCard
          question={active as MultipleChoiceQuestion}
          onSubmit={(idx) => actions.submitAnswer(idx)}
        />
      )}

      {pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isFlipCard && (
            <ChoiceCard
              question={active as MultipleChoiceQuestion}
              snapshot={lastAnswer as number}
            />
          )}
          {isFlipCard && (
            <div style={{ padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6 }}>
              <p style={{ color: 'var(--c-cyan)', fontWeight: 700, marginBottom: 6 }}>MEMORY FLIP</p>
              <p style={{ color: 'var(--c-dim)', fontSize: 12 }}>{active.explanation}</p>
            </div>
          )}
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
