import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { WIRELESS_QUESTIONS, WIFI_PROTOCOLS } from '../../data/wireless'

const GAME_ID   = 'wireless-config'
const GAME_NAME = 'WIRELESS CONFIG'
const DESC      = 'Choose the right WPA version or EAP type for each enterprise scenario. WPA3, 802.1X, EAP-TLS, PEAP, and more.'
const TIMER: Record<string, number> = { E: 0, D: 50, C: 40, B: 35, A: 30, S: 25 }
const STACK: Record<string, number> = { E: 3, D: 4, C: 4,  B: 5,  A: 5,  S: 5  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): MultipleChoiceQuestion[] {
  return shuffle([...WIRELESS_QUESTIONS]).slice(0, STACK[rank]).map((q) => {
    const shuffled = shuffle(q.options.map((o, i) => ({ o, correct: i === q.correctIndex })))
    return { ...q, options: shuffled.map((x) => x.o), correctIndex: shuffled.findIndex((x) => x.correct) }
  })
}

function WifiQuestion({
  question, onAnswer, submittedIndex,
}: {
  question: MultipleChoiceQuestion
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
}) {
  const isReview = submittedIndex != null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-green)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-green)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 8px' }}>SCENARIO</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
      </div>

      <p style={{ color: 'var(--c-dim)', fontSize: 12, textAlign: 'center', letterSpacing: '0.08em', margin: 0 }}>SELECT THE CORRECT PROTOCOL OR METHOD</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {question.options.map((opt, i) => {
          const proto = WIFI_PROTOCOLS[opt]
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          if (isReview) {
            if (i === question.correctIndex) { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
            else if (i === submittedIndex)    { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }
          }
          const nameColor = isReview && i === question.correctIndex ? 'var(--c-green)'
            : isReview && i === submittedIndex ? 'var(--c-pink)'
            : proto?.color ?? 'var(--c-body)'

          return (
            <button key={i} disabled={isReview} onClick={() => onAnswer?.(i)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 14px', background: bg, border: `1px solid ${borderColor}`, borderLeft: `4px solid ${isReview ? borderColor : (proto?.color ?? 'var(--c-border)')}`, borderRadius: 6, cursor: isReview ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s' }}
              onMouseEnter={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (!isReview) (e.currentTarget as HTMLElement).style.background = bg }}
            >
              <span style={{ color: nameColor, fontWeight: 900, fontSize: 16 }}>{opt}</span>
              {proto && <span style={{ color: 'var(--c-dim)', fontSize: 9, marginTop: 2 }}>{proto.full}</span>}
              {proto && <span style={{ color: 'var(--c-dim)', fontSize: 10, marginTop: 5, lineHeight: 1.4 }}>{proto.keyFact}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function WirelessConfig() {
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
          <WifiQuestion question={question as MultipleChoiceQuestion} submittedIndex={answerSnapshot as number} />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as MultipleChoiceQuestion | undefined

  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && !pendingAdvance && (
        <WifiQuestion question={active} onAnswer={(i) => actions.submitAnswer(i)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WifiQuestion question={active} submittedIndex={lastAnswer as number} />
          <ExplainBanner correct={lastCorrect} explanation={active.explanation} onAdvance={actions.advanceCard} onRetry={lives > 0 ? actions.retryCard : undefined} />
        </div>
      )}
    </PlayHUD>
  )
}
