import { useNavigate } from 'react-router-dom'
import type { MultipleChoiceQuestion, Rank } from '../../types'
import { RANKS } from '../../types'
import { useRoguelikeEngine } from '../../components/engine/useRoguelikeEngine'
import {
  MenuScreen, PlayHUD, ReviewScreen, FailedScreen, LevelUpScreen, VictoryScreen, ExplainBanner, GameOverScreen,
} from '../../components/engine/RoguelikeLayout'
import { useGameStore } from '../../store/gameStore'
import { AC_SCENARIOS, AC_MODELS, AC_PRINCIPLE_SCENARIOS, AC_ZERO_TRUST_SCENARIOS, AC_FEDERATION_SCENARIOS, type ACModel } from '../../data/accessControl'

const GAME_ID   = 'access-control'
const GAME_NAME = 'ACCESS CONTROL'
const DESC      = 'MAC vs DAC vs RBAC vs ABAC — plus least privilege, need-to-know, and separation of duties. All heavy exam topics.'
const TIMER: Record<string, number> = { E: 0, D: 45, C: 40, B: 35, A: 30, S: 25 }
const STACK: Record<string, number> = { E: 3, D: 4, C: 5, B: 5, A: 6, S: 6 }

const MODEL_COLORS: Record<string, string> = {
  MAC:  'var(--c-pink)',
  DAC:  'var(--c-amber)',
  RBAC: 'var(--c-cyan)',
  ABAC: 'var(--c-violet)',
  'Least Privilege':       'var(--c-green)',
  'Need-to-Know':          'var(--c-blue)',
  'Separation of Duties':  'var(--c-orange)',
  'Defense in Depth':      'var(--c-dim)',
  'Role-Based Access Control': 'var(--c-cyan)',
  'Mandatory Access Control':  'var(--c-pink)',
  'Zero Trust':                          'var(--c-cyan)',
  'Just-in-Time (JIT) / Privileged Access Management (PAM)': 'var(--c-violet)',
  'Zero Trust (microsegmentation / mutual TLS)':             'var(--c-cyan)',
  'Network Segmentation (traditional)':  'var(--c-dim)',
  'SAML (Security Assertion Markup Language)': 'var(--c-amber)',
  'OAuth 2.0':                           'var(--c-orange)',
  'OIDC (OpenID Connect)':               'var(--c-green)',
  'RADIUS (Remote Authentication Dial-In User Service)': 'var(--c-pink)',
  'LDAP (Lightweight Directory Access Protocol)': 'var(--c-blue)',
  'TACACS+':                             'var(--c-dim)',
  'Kerberos':                            'var(--c-dim)',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }; return a
}

function generateStack(rank: Rank): MultipleChoiceQuestion[] {
  const modelQs: MultipleChoiceQuestion[] = shuffle([...AC_SCENARIOS]).slice(0, STACK[rank] - 1).map((s) => {
    const options: string[] = shuffle([s.correctModel as string, ...(s.distractors as string[])])
    return { id: s.id, kind: 'multiple-choice' as const, prompt: s.situation, options, correctIndex: options.indexOf(s.correctModel), explanation: s.explanation }
  })
  if (RANKS.indexOf(rank) >= 2) {
    // Ranks C+ get a principle or Zero Trust scenario
    const pool = RANKS.indexOf(rank) >= 4
      ? shuffle([...AC_PRINCIPLE_SCENARIOS, ...AC_ZERO_TRUST_SCENARIOS, ...AC_FEDERATION_SCENARIOS])
      : shuffle([...AC_PRINCIPLE_SCENARIOS])
    const p = pool[0]
    const options: string[] = shuffle([p.correctPrinciple, ...p.distractors])
    modelQs.push({ id: p.id, kind: 'multiple-choice' as const, prompt: p.situation, options, correctIndex: options.indexOf(p.correctPrinciple), explanation: p.explanation })
  }
  return modelQs
}

function ACQuestion({
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
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid var(--c-blue)', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ color: 'var(--c-blue)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', margin: '0 0 8px' }}>SCENARIO</p>
        <p style={{ color: 'var(--c-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{question.prompt}</p>
      </div>

      <p style={{ color: 'var(--c-dim)', fontSize: 12, textAlign: 'center', letterSpacing: '0.08em', margin: 0 }}>WHICH ACCESS CONTROL MODEL APPLIES?</p>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {question.options.map((opt, i) => {
          const model = AC_MODELS[opt as ACModel]
          const color = MODEL_COLORS[opt] || 'var(--c-body)'
          let borderColor = 'var(--c-border)'
          let bg = 'var(--c-surface)'
          if (isReview) {
            if (i === question.correctIndex) { borderColor = 'var(--c-green)'; bg = 'rgba(74,222,128,0.07)' }
            else if (i === submittedIndex)    { borderColor = 'var(--c-pink)';  bg = 'rgba(244,114,182,0.07)' }
          }
          return (
            <button
              key={i}
              disabled={isReview}
              onClick={() => onAnswer?.(i)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '18px 20px',
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
              <span style={{ color: isReview && i === question.correctIndex ? 'var(--c-green)' : isReview && i === submittedIndex ? 'var(--c-pink)' : color, fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{opt}</span>
              {model && <span style={{ color: 'var(--c-dim)', fontSize: 12, marginTop: 6 }}>{model.full}</span>}
              {model && <span style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 7, lineHeight: 1.5 }}>{model.keyTrait}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AccessControl() {
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
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ACQuestion question={q} submittedIndex={answerSnapshot as number} />
              <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '12px 16px' }}>
                <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>
                  WHY {q.options[q.correctIndex]}?
                </p>
                <p style={{ color: 'var(--c-dim)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
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
        <ACQuestion question={active} onAnswer={(i) => actions.submitAnswer(i)} />
      )}
      {active && pendingAdvance && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ACQuestion question={active} submittedIndex={lastAnswer as number} />
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
