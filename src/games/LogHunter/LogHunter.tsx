import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClickSuspiciousQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { LOG_SCENARIOS } from '../../data/logs'

const GAME_ID   = 'log-hunter'
const GAME_NAME = 'LOG HUNTER'
const DESC      = 'Read real-format log blocks and click the line that reveals a threat. Train your eye for IoCs.'
const TIMER: Record<string, number> = { E: 0,  D: 60, C: 50, B: 40, A: 35, S: 25 }
const STACK: Record<string, number> = { E: 2,  D: 3,  C: 4,  B: 4,  A: 5,  S: 5  }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): ClickSuspiciousQuestion[] {
  return shuffle([...LOG_SCENARIOS]).slice(0, STACK[rank]).map((s) => ({
    id: s.id, kind: 'click-suspicious' as const,
    prompt: s.title, logLines: s.logLines,
    suspiciousIndex: s.suspiciousIndex, iocType: s.iocType, explanation: s.explanation,
  }))
}

// Color-code log tokens for readability
function colorizeLog(line: string): React.ReactNode {
  // Highlight timestamps, status words, IPs, user=, cmd=
  const parts = line.split(/(\b(?:AUTH SUCCESS|AUTH FAIL|ALLOW|DENY|SUCCESS|FAIL|ERROR|WARN)\b|\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?|(?:user|src|dst|cmd|bytes|country|type|attempt|status)=\S+)/g)
  return parts.map((part, i) => {
    if (/AUTH SUCCESS|SUCCESS/.test(part)) return <span key={i} style={{ color: 'var(--c-green)', fontWeight: 700 }}>{part}</span>
    if (/AUTH FAIL|FAIL|ERROR/.test(part)) return <span key={i} style={{ color: 'var(--c-pink)', fontWeight: 700 }}>{part}</span>
    if (/^ALLOW$/.test(part)) return <span key={i} style={{ color: 'var(--c-green)' }}>{part}</span>
    if (/^DENY$/.test(part))  return <span key={i} style={{ color: 'var(--c-amber)' }}>{part}</span>
    if (/^\d{4}-\d{2}-\d{2}$/.test(part) || /^\d{2}:\d{2}:\d{2}$/.test(part)) return <span key={i} style={{ color: 'var(--c-dim)' }}>{part}</span>
    if (/(?:\d{1,3}\.){3}\d{1,3}/.test(part)) return <span key={i} style={{ color: 'var(--c-violet)' }}>{part}</span>
    if (/=/.test(part)) {
      const [k, v] = part.split('=')
      return <span key={i}><span style={{ color: 'var(--c-cyan)' }}>{k}=</span><span style={{ color: 'var(--c-body)' }}>{v}</span></span>
    }
    return <span key={i}>{part}</span>
  })
}

function LogCard({
  question, onAnswer, submittedIndex, showExplain, onAdvance, onRetry,
}: {
  question: ClickSuspiciousQuestion
  onAnswer?: (i: number) => void
  submittedIndex?: number | null
  showExplain?: boolean
  onAdvance?: () => void
  onRetry?: () => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const isReview = submittedIndex != null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderLeft: '3px solid var(--c-green)', borderRadius: 6, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ color: 'var(--c-green)', fontWeight: 700, fontSize: 14, margin: 0 }}>{question.prompt}</p>
          <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: '4px 0 0' }}>
            {isReview ? 'Review — suspicious line highlighted' : 'Click the suspicious log entry'}
          </p>
        </div>
        {!isReview && <span style={{ color: 'var(--c-dim)', fontSize: 11, border: '1px solid var(--c-border)', padding: '2px 8px', borderRadius: 4 }}>CLICK TO SELECT</span>}
      </div>

      {/* Log lines */}
      <div style={{ border: '1px solid var(--c-border)', borderRadius: 6, overflow: 'hidden', background: '#080c10' }}>
        {question.logLines.map((line, i) => {
          const correct   = i === question.suspiciousIndex
          const chosen    = i === submittedIndex
          const wrongPick = isReview && chosen && !correct

          let bg       = 'transparent'
          let leftBdr  = '3px solid transparent'

          if (isReview) {
            if (correct)   { bg = 'rgba(74,222,128,0.1)';  leftBdr = '3px solid var(--c-green)' }
            if (wrongPick) { bg = 'rgba(244,114,182,0.1)'; leftBdr = '3px solid var(--c-pink)' }
          } else if (hover === i) {
            bg = 'rgba(34,211,238,0.07)'; leftBdr = '3px solid var(--c-cyan)'
          }

          return (
            <div
              key={i}
              onClick={() => !isReview && onAnswer?.(i)}
              onMouseEnter={() => !isReview && setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', background: bg, borderLeft: leftBdr,
                cursor: isReview ? 'default' : 'pointer',
                transition: 'background 0.12s, border-color 0.12s',
                fontFamily: 'inherit', fontSize: 12, lineHeight: 1.5,
                borderBottom: i < question.logLines.length - 1 ? '1px solid rgba(30,45,54,0.6)' : 'none',
              }}
            >
              <span style={{ color: 'var(--c-dim)', fontSize: 11, minWidth: 22, marginTop: 1, userSelect: 'none' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{colorizeLog(line)}</span>
              {isReview && correct   && <span style={{ color: 'var(--c-green)', fontSize: 14, marginLeft: 8 }}>◀ IoC</span>}
              {isReview && wrongPick && <span style={{ color: 'var(--c-pink)',  fontSize: 14, marginLeft: 8 }}>✗</span>}
            </div>
          )
        })}
      </div>

      {showExplain && submittedIndex != null && (
        <ExplainBanner
          correct={submittedIndex === question.suspiciousIndex}
          explanation={`IoC: ${question.iocType.replace(/-/g, ' ').toUpperCase()}\n\n${question.explanation}`}
          onAdvance={onAdvance!}
          onRetry={onRetry}
          label={question.iocType.replace(/-/g, ' ').toUpperCase()}
        />
      )}
    </div>
  )
}

export default function LogHunter() {
  const navigate = useNavigate()
  const record   = useGameStore((s) => s.records[GAME_ID])
  const [state, actions] = useRoguelikeEngine({
    gameId: GAME_ID, gameName: GAME_NAME,
    generateStack: (rank) => generateStack(rank),
    timerByRank: TIMER as never, stackSizeByRank: STACK as never,
  })
  const { phase, rank, stack, activeIndex, pendingAdvance, lastAnswer, lives } = state

  if (phase === 'menu')    return <MenuScreen gameName={GAME_NAME} gameId={GAME_ID} description={DESC} bestRank={record?.bestRank ?? null} bestScore={record?.bestScore ?? 0} onStart={actions.startGame} />
  if (phase === 'failed')  return <FailedScreen actions={actions} rank={rank} />
  if (phase === 'gameover') return <GameOverScreen score={state.score} rank={rank} onRestart={actions.startGame} onQuit={() => navigate('/')} />
  if (phase === 'levelup') return <LevelUpScreen prevRank={rank} newRank={RANKS[RANKS.indexOf(rank) + 1]} onContinue={actions.proceedAfterLevelup} />
  if (phase === 'victory') return <VictoryScreen score={state.score} flawless={state.flawless} onQuit={() => navigate('/')} />

  if (phase === 'review') {
    return (
      <ReviewScreen state={state} actions={actions}
        renderReviewCard={({ question, answerSnapshot }) => (
          <LogCard question={question as ClickSuspiciousQuestion} submittedIndex={answerSnapshot as number} showExplain />
        )}
      />
    )
  }

  const active = stack[activeIndex]?.question as ClickSuspiciousQuestion | undefined
  return (
    <PlayHUD state={state} actions={actions} gameName={GAME_NAME} gameId={GAME_ID}>
      {active && (
        <LogCard
          question={active}
          onAnswer={pendingAdvance ? undefined : (i) => actions.submitAnswer(i)}
          submittedIndex={pendingAdvance ? lastAnswer as number : null}
          showExplain={pendingAdvance}
          onAdvance={actions.advanceCard}
          onRetry={lives > 0 ? actions.retryCard : undefined}
        />
      )}
    </PlayHUD>
  )
}
