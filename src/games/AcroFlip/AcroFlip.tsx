import { useState, useEffect, useCallback, useRef } from 'react'
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
const DESC      = 'Master Security+ acronyms. Fill-in-the-blank MCQ at every rank, plus a live match board at Rank C+ — click an acronym, then click its expansion to clear pairs before time runs out.'

// Timer per rank — tightens significantly as you climb
const TIMER: Record<string, number> = { E: 0, D: 70, C: 55, B: 42, A: 30, S: 20 }
const STACK: Record<string, number> = { E: 4, D: 5,  C: 6,  B: 7,  A: 8,  S: 10 }

const DOMAIN_COLORS: Record<string, string> = {
  D1: 'var(--c-blue)', D2: 'var(--c-pink)', D3: 'var(--c-cyan)',
  D4: 'var(--c-green)', D5: 'var(--c-violet)',
}
const DOMAIN_LABELS: Record<string, string> = {
  D1: 'D1 General', D2: 'D2 Threats', D3: 'D3 Architecture',
  D4: 'D4 Operations', D5: 'D5 Governance',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Multiple-choice fill-in-the-blank ────────────────────────────────────────

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

// ─── Quizlet-style Match Board ─────────────────────────────────────────────────

interface Tile {
  id: string       // unique tile id
  pairId: string   // acronym string — same for the two tiles in a pair
  text: string
  side: 'acronym' | 'expansion'
}

type TileState = 'idle' | 'selected' | 'matched' | 'wrong'

interface MatchBoardProps {
  pairCount: number
  timeLimit: number      // seconds
  onComplete: (success: boolean, pct: number) => void  // pct = pairs matched / total
}

function MatchBoard({ pairCount, timeLimit, onComplete }: MatchBoardProps) {
  const pairs = shuffle([...ACRONYMS_UNIQUE]).slice(0, pairCount)

  const [tiles] = useState<Tile[]>(() =>
    shuffle(pairs.flatMap((p) => [
      { id: `${p.acronym}-A`, pairId: p.acronym, text: p.acronym, side: 'acronym' as const },
      { id: `${p.acronym}-E`, pairId: p.acronym, text: p.expansion, side: 'expansion' as const },
    ]))
  )

  const [tileStates, setTileStates] = useState<Record<string, TileState>>(() =>
    Object.fromEntries(tiles.map((t) => [t.id, 'idle']))
  )
  const [selected, setSelected] = useState<Tile | null>(null)
  const [locked, setLocked] = useState(false)
  const [matchedCount, setMatchedCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef  = useRef(false)

  const finish = useCallback((success: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    onComplete(success, matchedCount / pairCount)
  }, [matchedCount, pairCount, onComplete])

  // countdown
  useEffect(() => {
    if (timeLimit <= 0) return
    const endAt = Date.now() + timeLimit * 1000
    timerRef.current = setInterval(() => {
      const rem = (endAt - Date.now()) / 1000
      if (rem <= 0) {
        clearInterval(timerRef.current!)
        setTimeLeft(0)
        finish(false)
      } else {
        setTimeLeft(rem)
      }
    }, 50)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // win
  useEffect(() => {
    if (matchedCount >= pairCount) finish(true)
  }, [matchedCount, pairCount, finish])

  const handleTile = useCallback((tile: Tile) => {
    if (locked || tileStates[tile.id] === 'matched' || tileStates[tile.id] === 'wrong') return
    if (doneRef.current) return

    if (!selected) {
      setTileStates((prev) => ({ ...prev, [tile.id]: 'selected' }))
      setSelected(tile)
      return
    }

    // Can't click the same tile
    if (selected.id === tile.id) {
      setTileStates((prev) => ({ ...prev, [tile.id]: 'idle' }))
      setSelected(null)
      return
    }

    setLocked(true)

    if (selected.pairId === tile.pairId) {
      // correct match
      setTileStates((prev) => ({
        ...prev,
        [selected.id]: 'matched',
        [tile.id]: 'matched',
      }))
      setMatchedCount((c) => c + 1)
      setSelected(null)
      setLocked(false)
    } else {
      // wrong match — flash red then reset
      setTileStates((prev) => ({
        ...prev,
        [selected.id]: 'wrong',
        [tile.id]: 'wrong',
      }))
      setTimeout(() => {
        setTileStates((prev) => ({
          ...prev,
          [selected.id]: 'idle',
          [tile.id]: 'idle',
        }))
        setSelected(null)
        setLocked(false)
      }, 600)
    }
  }, [locked, tileStates, selected])

  const pct    = timeLimit > 0 ? Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100)) : 100
  const tColor = pct > 50 ? 'var(--c-green)' : pct > 25 ? 'var(--c-amber)' : 'var(--c-pink)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderLeft: '3px solid var(--c-violet)', borderRadius: 6, padding: '12px 16px',
      }}>
        <p style={{ color: 'var(--c-violet)', fontWeight: 700, fontSize: 14, margin: 0 }}>
          ACRO MATCH — Click an acronym, then its expansion
        </p>
        <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>
          Match all {pairCount} pairs to clear the board · {matchedCount}/{pairCount} cleared
        </p>
      </div>

      {/* Timer bar */}
      {timeLimit > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: tColor, fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 30 }}>
            {Math.ceil(timeLeft)}s
          </span>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, background: tColor,
              borderRadius: 3, boxShadow: `0 0 8px ${tColor}`,
            }} />
          </div>
        </div>
      )}

      {/* Tile grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 8,
      }}>
        {tiles.map((tile) => {
          const st = tileStates[tile.id]
          const isAcro = tile.side === 'acronym'

          let bg = 'var(--c-surface)'
          let border = 'var(--c-border)'
          let textColor = isAcro ? 'var(--c-cyan)' : 'var(--c-body)'
          let opacity = 1
          let transform = 'none'

          if (st === 'selected') {
            bg = isAcro ? 'rgba(34,211,238,0.1)' : 'rgba(167,139,250,0.1)'
            border = isAcro ? 'var(--c-cyan)' : 'var(--c-violet)'
            transform = 'scale(1.02)'
          } else if (st === 'matched') {
            bg = 'rgba(74,222,128,0.08)'
            border = 'var(--c-green)'
            textColor = 'var(--c-green)'
            opacity = 0.55
          } else if (st === 'wrong') {
            bg = 'rgba(244,114,182,0.1)'
            border = 'var(--c-pink)'
            textColor = 'var(--c-pink)'
          }

          return (
            <button
              key={tile.id}
              onClick={() => handleTile(tile)}
              disabled={st === 'matched'}
              style={{
                padding: '10px 12px',
                minHeight: 56,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 6,
                cursor: st === 'matched' ? 'default' : 'pointer',
                textAlign: 'center',
                fontFamily: isAcro ? 'var(--font-mono)' : 'var(--font-ui)',
                fontSize: isAcro ? 15 : 11,
                fontWeight: isAcro ? 700 : 400,
                color: textColor,
                lineHeight: 1.4,
                opacity,
                transform,
                transition: 'all 0.15s ease',
                wordBreak: 'break-word',
              }}
            >
              {st === 'matched' ? '✓' : tile.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── MCQ card ────────────────────────────────────────────────────────────────

function ChoiceCard({
  question, onSubmit, snapshot,
}: {
  question: MultipleChoiceQuestion
  onSubmit?: (idx: number) => void
  snapshot?: number
}) {
  const [picked, setPicked] = useState<number | null>(snapshot ?? null)
  const isReview = snapshot !== undefined

  // highlight **text** as amber
  const renderPrompt = (prompt: string) => {
    const parts = prompt.split('**')
    return (
      <span>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <span key={i} style={{ color: 'var(--c-amber)', letterSpacing: '0.06em' }}>{p}</span>
            : <span key={i}>{p}</span>
        )}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderLeft: '3px solid var(--c-cyan)', borderRadius: 6, padding: '14px 18px',
      }}>
        <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          {renderPrompt(question.prompt)}
        </p>
        {!isReview && <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>Select the correct answer</p>}
      </div>

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
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px', background: bg, border: `1px solid ${border}`,
                borderRadius: 6, cursor: isReview ? 'default' : 'pointer',
                textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'all 0.12s',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, minWidth: 24,
                color: isReview
                  ? (i === question.correctIndex ? 'var(--c-green)' : i === snapshot ? 'var(--c-pink)' : 'var(--c-dim)')
                  : (picked === i ? 'var(--c-cyan)' : 'var(--c-dim)'),
              }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ color: textColor, fontSize: 13, lineHeight: 1.55, flex: 1 }}>{opt}</span>
              {isReview && i === question.correctIndex && <span style={{ color: 'var(--c-green)', marginLeft: 'auto' }}>✓</span>}
              {isReview && i === snapshot && snapshot !== question.correctIndex && <span style={{ color: 'var(--c-pink)', marginLeft: 'auto' }}>✗</span>}
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

// ─── Match question wrapper (plugs into engine as a single question) ────────

function MatchQuestion({ pairCount, timeLimit, onSubmit }: {
  pairCount: number
  timeLimit: number
  onSubmit: (correct: boolean) => void
}) {
  const [done, setDone] = useState(false)

  const handleComplete = useCallback((success: boolean) => {
    if (done) return
    setDone(true)
    // brief delay so the win/lose state is visible before advancing
    setTimeout(() => onSubmit(success), 500)
  }, [done, onSubmit])

  return <MatchBoard pairCount={pairCount} timeLimit={timeLimit} onComplete={handleComplete} />
}

// ─── Question factory ─────────────────────────────────────────────────────────

type AcroQ =
  | MultipleChoiceQuestion
  | { id: string; kind: 'acro-match'; prompt: string; explanation: string; pairCount: number; timeLimit: number }

function generateAcroStack(rank: Rank, attempt: number): AcroQ[] {
  const mcQuestions = generateStack(rank, attempt) as AcroQ[]

  // Insert a match board at Rank C and above (every other card)
  if (rank >= 'C') {
    const pairCount = rank >= 'A' ? 8 : 6
    const timeLimit = rank === 'S' ? 45 : rank === 'A' ? 55 : rank === 'B' ? 65 : 75
    const matchCard: AcroQ = {
      id: `af-match-${attempt}-${rank}`,
      kind: 'acro-match',
      prompt: 'Click an acronym then its matching expansion to clear the board.',
      explanation: 'Acronym match: each acronym pairs with exactly one expansion. Speed and accuracy both matter.',
      pairCount,
      timeLimit,
    }
    // insert midway
    const mid = Math.floor(mcQuestions.length / 2)
    mcQuestions.splice(mid, 0, matchCard)
  }

  return mcQuestions
}

// ─── Game root ────────────────────────────────────────────────────────────────

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
  const [matchDone, setMatchDone] = useState(false)

  useEffect(() => { setMatchDone(false) }, [activeIndex])

  if (phase === 'menu')     return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')   return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup')  return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory')  return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => {
          const q = question as AcroQ
          if (q.kind === 'acro-match') {
            return (
              <div style={{ padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6 }}>
                <p style={{ color: 'var(--c-violet)', fontWeight: 700, marginBottom: 8 }}>ACRO MATCH</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 12 }}>{q.explanation}</p>
              </div>
            )
          }
          return <ChoiceCard question={q as MultipleChoiceQuestion} snapshot={answerSnapshot as number} />
        }}
      />
    )
  }

  const active = stack[activeIndex]?.question as AcroQ | undefined
  if (!active) return null

  const isMatchCard = active.kind === 'acro-match'

  // domain badge for MCQ
  const getDomainBadge = () => {
    if (isMatchCard) return null
    const mc = active as MultipleChoiceQuestion
    const m = mc.prompt.match(/\*\*([^*]+)\*\*/)
    const acroData = m ? ACRONYMS_UNIQUE.find((a) => a.acronym === m[1]) : null
    if (!acroData) return null
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontSize: 10, letterSpacing: '0.1em', fontWeight: 700,
          color: DOMAIN_COLORS[acroData.domain],
          borderBottom: `1px solid ${DOMAIN_COLORS[acroData.domain]}`,
          paddingBottom: 1, fontFamily: 'var(--font-mono)',
        }}>{DOMAIN_LABELS[acroData.domain]}</span>
      </div>
    )
  }

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {getDomainBadge()}

      {/* Match board */}
      {isMatchCard && !pendingAdvance && !matchDone && (
        <MatchQuestion
          pairCount={(active as { pairCount: number }).pairCount}
          timeLimit={(active as { timeLimit: number }).timeLimit}
          onSubmit={(ok) => { setMatchDone(true); actions.submitAnswer(ok ? 1 : -1) }}
        />
      )}
      {isMatchCard && !pendingAdvance && matchDone && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-dim)' }}>Checking…</div>
      )}

      {/* MCQ */}
      {!isMatchCard && !pendingAdvance && (
        <ChoiceCard question={active as MultipleChoiceQuestion} onSubmit={(idx) => actions.submitAnswer(idx)} />
      )}

      {/* Explanation banner */}
      {pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isMatchCard && (
            <ChoiceCard question={active as MultipleChoiceQuestion} snapshot={lastAnswer as number} />
          )}
          {isMatchCard && (
            <div style={{ padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6 }}>
              <p style={{ color: 'var(--c-violet)', fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>ACRO MATCH</p>
              <p style={{ color: 'var(--c-dim)', fontSize: 12 }}>{active.explanation}</p>
            </div>
          )}
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} />
        </div>
      )}
    </PlayHUD>
  )
}
