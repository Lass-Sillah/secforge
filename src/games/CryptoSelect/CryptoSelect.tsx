import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { CRYPTO_USE_CASES, ALGORITHMS } from '../../data/crypto'
import { WarnIcon } from '../../components/Icons'

const GAME_ID   = 'crypto-select'
const GAME_NAME = 'CRYPTO SELECT'
const DESC      = 'Pick the right algorithm for each use case. Know symmetric vs asymmetric vs hashing, and deprecated pitfalls.'
const TIMER: Record<string, number> = { E: 0, D: 45, C: 40, B: 35, A: 30, S: 25 }
const STACK: Record<string, number> = { E: 3, D: 4, C: 4, B: 5, A: 5, S: 5 }

const TYPE_COLORS: Record<string, string> = {
  symmetric:  'var(--c-green)',
  asymmetric: 'var(--c-cyan)',
  hashing:    'var(--c-violet)',
  deprecated: 'var(--c-pink)',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): MultipleChoiceQuestion[] {
  return shuffle([...CRYPTO_USE_CASES]).slice(0, STACK[rank]).map((uc) => {
    const options = shuffle([uc.correctAlgo, ...uc.wrongAlgos])
    return {
      id: uc.id, kind: 'multiple-choice' as const,
      prompt: uc.scenario,
      options, correctIndex: options.indexOf(uc.correctAlgo),
      explanation: uc.explanation,
    }
  })
}

function CryptoQuestion({
  question, onAnswer, submittedIndex,
}: {
  question: MultipleChoiceQuestion
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
}) {
  const isReview = submittedIndex != null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Scenario */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-cyan)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 8px' }}>USE CASE</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
      </div>

      <p style={{ color: 'var(--c-dim)', fontSize: 12, textAlign: 'center', letterSpacing: '0.08em', margin: 0 }}>SELECT THE CORRECT ALGORITHM</p>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {question.options.map((opt, i) => {
          const algo  = ALGORITHMS.find((a) => a.name === opt)
          const type  = algo?.deprecated ? 'deprecated' : (algo?.type ?? 'symmetric')
          const color = TYPE_COLORS[type]
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          if (isReview) {
            if (i === question.correctIndex) { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
            else if (i === submittedIndex)    { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }
          }

          const nameColor = isReview && i === question.correctIndex ? 'var(--c-green)'
            : isReview && i === submittedIndex ? 'var(--c-pink)'
            : 'var(--c-body)'

          return (
            <button
              key={i}
              disabled={isReview}
              onClick={() => onAnswer?.(i)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '14px 16px',
                background: bg, border: `1px solid ${borderColor}`,
                borderLeft: `4px solid ${isReview ? borderColor : color}`,
                borderRadius: 6,
                cursor: isReview ? 'default' : 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = bg }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: nameColor, fontWeight: 900, fontSize: 18 }}>{opt}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, color, border: `1px solid ${color}`, opacity: 0.8, letterSpacing: '0.05em' }}>
                  {type.toUpperCase()}{algo?.deprecated ? <WarnIcon size={10} color={color} style={{ marginLeft: 4, verticalAlign: 'middle' }} /> : null}
                </span>
              </div>
              {algo?.keySize && <span style={{ color: 'var(--c-dim)', fontSize: 10, marginTop: 4 }}>{algo.keySize}</span>}
              {algo?.note && <span style={{ color: 'var(--c-dim)', fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{algo.note}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CryptoSelect() {
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
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => {
          const q = question as MultipleChoiceQuestion
          const wrong = ALGORITHMS.find((a) => a.name === q.options[answerSnapshot as number])
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CryptoQuestion question={q} submittedIndex={answerSnapshot as number} />
              <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
                <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>WHY {q.options[q.correctIndex]}?</p>
                <p style={{ color: 'var(--c-dim)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                {wrong?.deprecated && wrong.deprecatedReason && (
                  <p style={{ color: 'var(--c-pink)', fontSize: 11, marginTop: 8, padding: '6px 10px', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 4, background: 'rgba(244,114,182,0.06)' }}>
                    <WarnIcon size={12} color="var(--c-pink)" style={{ marginRight: 5, verticalAlign: 'middle' }} />{wrong.name} deprecated: {wrong.deprecatedReason}
                  </p>
                )}
              </div>
            </div>
          )
        }}
      />
    )
  }

  const active = stack[activeIndex]?.question as MultipleChoiceQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <CryptoQuestion question={active} onAnswer={(i) => actions.submitAnswer(i)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CryptoQuestion question={active} submittedIndex={lastAnswer as number} />
          <ExplainBanner
            correct={lastCorrect}
            explanation={`${active.options[active.correctIndex]} — ${active.explanation}`}
            onAdvance={actions.advanceCard}
          />
        </div>
      )}
    </PlayHUD>
  )
}
