import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { generatePortStack } from './questions'
import { useGameStore } from '../../store/gameStore'

const GAME_ID   = 'port-master'
const GAME_NAME = 'PORT MASTER'
const DESC      = 'Map protocols to ports, ports to protocols, and identify secure replacements for insecure services.'

const TIMER: Record<string, number> = { E: 30, D: 25, C: 20, B: 18, A: 15, S: 12 }
const STACK: Record<string, number> = { E: 4,  D: 5,  C: 6,  B: 6,  A: 7,  S: 8  }

// ─── Question renderer (shared between play + review) ──────────────────────
function MCQuestion({
  question,
  onAnswer,
  submittedIndex,
  showExplain,
  onAdvance,
}: {
  question: MultipleChoiceQuestion
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
  showExplain?: boolean
  onAdvance?: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Prompt */}
      <div style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderLeft: '3px solid var(--c-cyan)',
        borderRadius: 6,
        padding: '14px 18px',
      }}>
        <p style={{ color: 'var(--c-cyan)', fontSize: 16, fontWeight: 700, margin: 0 }}>{question.prompt}</p>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex
          const isChosen  = i === submittedIndex

          let borderColor = 'var(--c-border)'
          let bgColor     = 'var(--c-surface)'
          let textColor   = 'var(--c-body)'
          let leftBorder  = '3px solid transparent'
          let opacity     = 1

          if (submittedIndex !== null && submittedIndex !== undefined) {
            if (isCorrect) {
              borderColor = 'var(--c-green)'; bgColor = 'rgba(74,222,128,0.08)'; textColor = 'var(--c-green)'; leftBorder = '3px solid var(--c-green)'
            } else if (isChosen) {
              borderColor = 'var(--c-pink)';  bgColor = 'rgba(244,114,182,0.08)'; textColor = 'var(--c-pink)';  leftBorder = '3px solid var(--c-pink)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              onClick={() => onAnswer?.(i)}
              disabled={submittedIndex !== null && submittedIndex !== undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderLeft: leftBorder,
                borderRadius: 6,
                cursor: submittedIndex != null ? 'default' : 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                opacity,
                fontFamily: 'inherit',
              }}
              className={submittedIndex == null ? 'option-hover' : ''}
            >
              <span style={{ color: 'var(--c-dim)', fontSize: 12, fontWeight: 700, minWidth: 18 }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation banner */}
      {showExplain && submittedIndex != null && (
        <ExplainBanner
          correct={submittedIndex === question.correctIndex}
          explanation={question.explanation}
          onAdvance={onAdvance!}
        />
      )}
    </div>
  )
}

export default function PortMaster() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])
  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank) => generatePortStack(rank),
    timerByRank:   TIMER as never,
    stackSizeByRank: STACK as never,
  })

  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer } = state

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => (
          <MCQuestion question={question as MultipleChoiceQuestion} submittedIndex={answerSnapshot as number} showExplain />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as MultipleChoiceQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && (
        <MCQuestion
          question={active}
          onAnswer={pendingAdvance ? undefined : (i) => actions.submitAnswer(i)}
          submittedIndex={pendingAdvance ? lastAnswer as number : null}
          showExplain={pendingAdvance}
          onAdvance={actions.advanceCard}
        />
      )}
    </PlayHUD>
  )
}
