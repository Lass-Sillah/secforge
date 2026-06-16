import type { ReactNode } from 'react'
import type { EngineState, EngineActions } from './useRoguelikeEngine'
import type { Rank, Question } from '../../types'
import { RANKS, RANK_COLORS } from '../../types'
import { StackProgress } from './StackProgress'
import { TimerBar } from './TimerBar'
import { TerminalHeader } from '../TerminalHeader'
import { Link } from 'react-router-dom'

const PAGE: React.CSSProperties = { width: '100%', minHeight: '100vh' }
const COL: React.CSSProperties  = { maxWidth: 1100, width: '100%', margin: '0 auto', padding: '20px 28px' }

// ─── Explanation Banner (shown after every answer) ────────────────────────────
export function ExplainBanner({
  correct,
  explanation,
  onAdvance,
  label,
}: {
  correct: boolean
  explanation: string
  onAdvance: () => void
  label?: string
}) {
  return (
    <div
      className="fade-in"
      style={{
        border: `1px solid ${correct ? 'var(--c-green)' : 'var(--c-pink)'}`,
        background: correct ? 'rgba(74,222,128,0.07)' : 'rgba(244,114,182,0.07)',
        borderRadius: 6,
        padding: '20px 24px',
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, color: correct ? 'var(--c-green)' : 'var(--c-pink)' }}>
          {correct ? '✓' : '✗'}
        </span>
        <span style={{ fontWeight: 700, color: correct ? 'var(--c-green)' : 'var(--c-pink)', fontSize: 14, letterSpacing: '0.08em' }}>
          {correct ? 'CORRECT' : 'INCORRECT'}{label ? ` — ${label}` : ''}
        </span>
      </div>
      <p style={{ color: 'var(--c-body)', fontSize: 14, lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-ui)' }}>{explanation}</p>
      <button
        className={`btn-neon ${correct ? 'btn-green' : 'btn-pink'}`}
        style={{ alignSelf: 'flex-end', padding: '8px 28px', fontSize: 13 }}
        onClick={onAdvance}
      >
        {correct ? 'NEXT CARD →' : 'SEE RESULTS →'}
      </button>
    </div>
  )
}

// ─── Menu Screen ──────────────────────────────────────────────────────────────
export function MenuScreen({
  gameName, gameId, bestRank, bestScore, onStart, description,
}: {
  gameName: string; gameId: string; bestRank: Rank | null; bestScore: number; onStart: () => void; description?: string
}) {
  return (
    <div style={PAGE}>
      <TerminalHeader module={gameId} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 37px)', gap: 28, padding: 32 }} className="fade-in">
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <h1 style={{ color: 'var(--c-cyan)', fontSize: 32, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}
              className="glow-cyan">{gameName}</h1>
          {description && <p style={{ color: 'var(--c-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{description}</p>}
          <p style={{ color: 'var(--c-dim)', fontSize: 11, letterSpacing: '0.12em', marginTop: 6 }}>CLEAR EVERY STACK FLAWLESSLY TO RANK UP</p>
        </div>

        {/* Rank ladder */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          {RANKS.map((r) => {
            const reached = bestRank !== null && RANKS.indexOf(r) <= RANKS.indexOf(bestRank!)
            return (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 22, fontWeight: 700,
                  color: RANK_COLORS[r],
                  textShadow: reached ? `0 0 14px ${RANK_COLORS[r]}` : undefined,
                  opacity: reached ? 1 : 0.2,
                }}>{r}</span>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: reached ? RANK_COLORS[r] : 'var(--c-border)' }} />
              </div>
            )
          })}
        </div>

        {bestRank && (
          <p style={{ color: 'var(--c-dim)', fontSize: 11, letterSpacing: '0.1em' }}>
            BEST <span style={{ color: RANK_COLORS[bestRank] }}>{bestRank}</span>
            {'  ·  '}HIGH SCORE <span style={{ color: 'var(--c-amber)' }}>{bestScore.toLocaleString()}</span>
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-neon btn-cyan" style={{ fontSize: 15, padding: '10px 40px' }} onClick={onStart}>
            ▶ BOOT TRAINING
          </button>
          <Link to="/" className="btn-neon btn-dim" style={{ fontSize: 13, padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ← HUB
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Lives Display ────────────────────────────────────────────────────────────
function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          fontSize: 16,
          color: i < lives ? 'var(--c-pink)' : 'var(--c-border)',
          textShadow: i < lives ? '0 0 8px var(--c-pink)' : undefined,
          transition: 'color 0.3s, text-shadow 0.3s',
        }}>♥</span>
      ))}
    </div>
  )
}

// ─── Play HUD ─────────────────────────────────────────────────────────────────
export function PlayHUD({
  state, actions, gameName, gameId, children,
}: {
  state: EngineState; actions: EngineActions; gameName: string; gameId: string; children: ReactNode
}) {
  const { rank, stack, activeIndex, combo, score, timeLeft, maxTime, flawless, pendingAdvance, lives } = state

  return (
    <div style={PAGE}>
      <TerminalHeader module={gameId} />
      <div style={{ ...COL, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>

        {/* HUD row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
            <span style={{
              fontWeight: 700, fontSize: 22, color: RANK_COLORS[rank],
              textShadow: `0 0 12px ${RANK_COLORS[rank]}`,
              border: `1px solid ${RANK_COLORS[rank]}`,
              padding: '3px 14px', borderRadius: 4,
            }}>{rank}</span>
            <span style={{ color: 'var(--c-amber)', fontWeight: 700, fontSize: 15 }}>{score.toLocaleString()} <span style={{ color: 'var(--c-dim)', fontWeight: 400, fontSize: 12 }}>pts</span></span>
            {combo > 2 && (
              <span style={{ color: 'var(--c-violet)', fontWeight: 700, fontSize: 14 }}>×{combo} <span style={{ fontWeight: 400, fontSize: 11 }}>combo</span></span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LivesDisplay lives={lives} />
            <span style={{ fontSize: 13, fontWeight: 700, color: flawless ? 'var(--c-green)' : 'var(--c-pink)' }}>
              {flawless ? '◆ FLAWLESS' : '✗ BROKEN'}
            </span>
          </div>
        </div>

        {/* Stack progress */}
        <StackProgress stack={stack} activeIndex={activeIndex} />
        {maxTime > 0 && !pendingAdvance && <TimerBar timeLeft={timeLeft} maxTime={maxTime} />}

        {/* Card counter + game name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-dim)', paddingBottom: 6, borderBottom: '1px solid var(--c-border)' }}>
          <span>CARD {activeIndex + 1} / {stack.length}</span>
          <span style={{ letterSpacing: '0.1em' }}>{gameName}</span>
        </div>

        {/* Question */}
        <div className="fade-in">{children}</div>

        {/* Review button (only when not pending) */}
        {!pendingAdvance && activeIndex > 0 && (
          <button className="btn-neon btn-dim" style={{ alignSelf: 'center', fontSize: 11, padding: '5px 18px' }} onClick={actions.enterReview}>
            ← REVIEW EARLIER CARDS
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Review Screen ────────────────────────────────────────────────────────────
export function ReviewScreen({
  state, actions, renderReviewCard,
}: {
  state: EngineState; actions: EngineActions
  renderReviewCard: (result: { question: Question; answerSnapshot?: unknown }) => ReactNode
}) {
  const { stack, reviewIndex } = state
  const answeredCards = stack.filter((c) => c.state === 'correct' || c.state === 'missed')
  if (!answeredCards.length) return null
  const current = answeredCards[Math.min(reviewIndex, answeredCards.length - 1)]

  return (
    <div style={PAGE}>
      <div style={{ ...COL, display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)', paddingBottom: 8 }}>
          <span style={{ color: 'var(--c-cyan)', fontSize: 12, letterSpacing: '0.1em' }}>REVIEW MODE — READ ONLY</span>
          <span style={{ color: 'var(--c-dim)', fontSize: 11 }}>{reviewIndex + 1} / {answeredCards.length}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-neon btn-dim" style={{ fontSize: 11 }} disabled={reviewIndex <= 0} onClick={() => actions.setReviewIndex(reviewIndex - 1)}>← PREV</button>
          <div style={{ flex: 1 }} />
          <button className="btn-neon btn-dim" style={{ fontSize: 11 }} disabled={reviewIndex >= answeredCards.length - 1} onClick={() => actions.setReviewIndex(reviewIndex + 1)}>NEXT →</button>
        </div>

        <div>{renderReviewCard(current)}</div>

        <button className="btn-neon btn-cyan" style={{ alignSelf: 'center' }} onClick={actions.exitReview}>▶ RESUME</button>
      </div>
    </div>
  )
}

// ─── Failed Screen ─────────────────────────────────────────────────────────────
export function FailedScreen({ actions, rank }: { actions: EngineActions; rank: Rank }) {
  return (
    <div style={{ ...PAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }} className="fade-in">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, color: 'var(--c-pink)', textShadow: '0 0 20px var(--c-pink)', marginBottom: 8 }}>✗</div>
        <h2 style={{ color: 'var(--c-pink)', fontSize: 22, fontWeight: 700, letterSpacing: '0.08em' }}>STACK FAILED</h2>
        <p style={{ color: 'var(--c-dim)', fontSize: 13, marginTop: 8 }}>
          Rank <span style={{ color: RANK_COLORS[rank] }}>{rank}</span> — Flawless run broken.
        </p>
        <p style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 4 }}>Same questions · Shuffled options · No mercy</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-neon btn-cyan" style={{ padding: '10px 28px' }} onClick={actions.retryStack}>↺ RETRY STACK</button>
        <button className="btn-neon btn-dim" onClick={actions.quit}>✕ QUIT</button>
      </div>
    </div>
  )
}

// ─── Level Up Screen ──────────────────────────────────────────────────────────
export function LevelUpScreen({ prevRank, newRank, onContinue }: { prevRank: Rank; newRank: Rank; onContinue: () => void }) {
  return (
    <div style={{ ...PAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }} className="fade-in">
      <p style={{ color: 'var(--c-dim)', fontSize: 12, letterSpacing: '0.15em' }}>STACK CLEARED — RANK UP</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="rank-up-anim">
        <span style={{ fontSize: 36, fontWeight: 700, color: RANK_COLORS[prevRank] }}>{prevRank}</span>
        <span style={{ color: 'var(--c-dim)', fontSize: 20 }}>→</span>
        <span style={{ fontSize: 72, fontWeight: 700, color: RANK_COLORS[newRank], textShadow: `0 0 24px ${RANK_COLORS[newRank]}, 0 0 48px ${RANK_COLORS[newRank]}` }}>{newRank}</span>
      </div>
      <button className="btn-neon btn-green" style={{ padding: '10px 32px' }} onClick={onContinue}>▶ NEXT STACK</button>
    </div>
  )
}

// ─── Game Over Screen ─────────────────────────────────────────────────────────
export function GameOverScreen({ score, rank, onRestart, onQuit }: { score: number; rank: Rank; onRestart: () => void; onQuit: () => void }) {
  return (
    <div style={{ ...PAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }} className="fade-in">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8, letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--c-pink)', textShadow: '0 0 20px var(--c-pink)' }}>♥</span>
          <span style={{ color: 'var(--c-border)', margin: '0 4px' }}>♥</span>
          <span style={{ color: 'var(--c-border)' }}>♥</span>
        </div>
        <h2 style={{ color: 'var(--c-pink)', fontSize: 24, fontWeight: 700, letterSpacing: '0.1em' }}>GAME OVER</h2>
        <p style={{ color: 'var(--c-dim)', fontSize: 13, marginTop: 10 }}>
          Fell at Rank <span style={{ color: RANK_COLORS[rank] }}>{rank}</span> — all lives spent.
        </p>
        <p style={{ color: 'var(--c-amber)', fontSize: 26, fontWeight: 700, marginTop: 12 }}>{score.toLocaleString()} PTS</p>
        <p style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 6, letterSpacing: '0.1em' }}>RUN RECORDED — START AGAIN FROM RANK E</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-neon btn-cyan" style={{ padding: '10px 28px' }} onClick={onRestart}>↺ NEW RUN</button>
        <button className="btn-neon btn-dim" onClick={onQuit}>← HUB</button>
      </div>
    </div>
  )
}

// ─── Victory Screen ────────────────────────────────────────────────────────────
export function VictoryScreen({ score, flawless, onQuit }: { score: number; flawless: boolean; onQuit: () => void }) {
  return (
    <div style={{ ...PAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }} className="fade-in">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, fontWeight: 700, color: '#f472b6', textShadow: '0 0 32px #f472b6, 0 0 64px #f472b6', marginBottom: 8 }}>S</div>
        <h2 style={{ color: 'var(--c-cyan)', fontSize: 20, fontWeight: 700, letterSpacing: '0.1em' }} className="glow-cyan">ALL STACKS CLEARED</h2>
        {flawless && (
          <p style={{ color: 'var(--c-green)', fontSize: 13, fontWeight: 700, marginTop: 8 }} className="glow-green">
            ◆ PERFECT RUN — ZERO MISTAKES
          </p>
        )}
        <p style={{ color: 'var(--c-amber)', fontSize: 24, fontWeight: 700, marginTop: 12 }}>{score.toLocaleString()} PTS</p>
      </div>
      <button className="btn-neon btn-cyan" style={{ padding: '10px 32px' }} onClick={onQuit}>↩ RETURN TO HUB</button>
    </div>
  )
}
