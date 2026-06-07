import { useState, useEffect, useRef, useCallback } from 'react'
import type { EngineConfig, EnginePhase, CardResult, Question, Rank, CardState } from '../../types'
import { RANKS } from '../../types'
import { useGameStore } from '../../store/gameStore'
import type { GameId } from '../../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(q: Question): Question {
  if (q.kind !== 'multiple-choice') return q
  const indexed = q.options.map((o, i) => ({ o, correct: i === q.correctIndex }))
  const shuffledIndexed = shuffle(indexed)
  return {
    ...q,
    options: shuffledIndexed.map((x) => x.o),
    correctIndex: shuffledIndexed.findIndex((x) => x.correct),
  }
}

function prepareStack(questions: Question[]): Question[] {
  return questions.map((q) => {
    if (q.kind === 'multiple-choice') return shuffleOptions(q)
    if (q.kind === 'drag-order') return { ...q, shuffled: shuffle(q.items) }
    if (q.kind === 'drag-ruleset') return { ...q, shuffledRules: shuffle(q.rules) }
    return q
  })
}

export interface EngineState {
  phase: EnginePhase
  rank: Rank
  rankIndex: number
  stack: CardResult[]
  activeIndex: number
  reviewIndex: number
  combo: number
  score: number
  timeLeft: number
  maxTime: number
  flawless: boolean
  attempt: number
  isReviewing: boolean
  // After submitting an answer, show explanation before advancing
  pendingAdvance: boolean
  lastAnswer: unknown
  lastCorrect: boolean
}

export interface EngineActions {
  startGame: () => void
  submitAnswer: (answer: unknown) => void
  advanceCard: () => void            // call after showing explanation
  enterReview: () => void
  exitReview: () => void
  setReviewIndex: (i: number) => void
  retryStack: () => void
  quit: () => void
  proceedAfterLevelup: () => void
}

export function useRoguelikeEngine(config: EngineConfig): [EngineState, EngineActions] {
  const { recordGameResult, touchStudyDate } = useGameStore()

  const [phase, setPhase] = useState<EnginePhase>('menu')
  const [rank, setRank] = useState<Rank>('E')
  const [stack, setStack] = useState<CardResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [flawless, setFlawless] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<unknown>(undefined)
  const [lastCorrect, setLastCorrect] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedQuestionsRef = useRef<Question[] | null>(null)
  const rankIdx = RANKS.indexOf(rank)
  const maxTime = config.timerByRank[rank]

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const startTimer = useCallback(() => {
    clearTimer()
    if (maxTime <= 0 || isReviewing || pendingAdvance) return
    setTimeLeft(maxTime)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearTimer(); return 0 }
        return t - 1
      })
    }, 1000)
  }, [maxTime, isReviewing, pendingAdvance])

  // Timeout = miss
  useEffect(() => {
    if (phase !== 'playing' || isReviewing || maxTime <= 0 || pendingAdvance) return
    if (timeLeft === 0) handleMiss(undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  function buildFreshStack(r: Rank, att: number): CardResult[] {
    const questions = config.generateStack(r, att)
    savedQuestionsRef.current = questions
    return prepareStack(questions).map((q) => ({ question: q, state: 'pending' as CardState }))
  }

  function buildSameStack(): CardResult[] {
    const questions = savedQuestionsRef.current ?? config.generateStack(rank, attempt)
    savedQuestionsRef.current = questions
    return prepareStack(questions).map((q) => ({ question: q, state: 'pending' as CardState }))
  }

  function startGame() {
    savedQuestionsRef.current = null
    const newStack = buildFreshStack('E', 0)
    setPhase('playing')
    setRank('E')
    setStack(newStack)
    setActiveIndex(0)
    setCombo(0)
    setScore(0)
    setFlawless(true)
    setAttempt(0)
    setIsReviewing(false)
    setPendingAdvance(false)
    touchStudyDate()
  }

  useEffect(() => {
    if (phase === 'playing' && !isReviewing && !pendingAdvance) startTimer()
    return clearTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, phase, isReviewing, pendingAdvance])

  function handleMiss(answer: unknown) {
    clearTimer()
    setFlawless(false)
    setLastAnswer(answer)
    setLastCorrect(false)
    setStack((prev) =>
      prev.map((c, i) =>
        i === activeIndex ? { ...c, state: 'missed', answerSnapshot: answer } : { ...c, state: 'pending' }
      )
    )
    setCombo(0)
    setPendingAdvance(true) // show explanation before failed screen
  }

  function submitAnswer(answer: unknown) {
    if (phase !== 'playing' || isReviewing || pendingAdvance) return
    clearTimer()

    const current = stack[activeIndex].question
    const correct = isCorrect(current, answer)

    setLastAnswer(answer)
    setLastCorrect(correct)
    setPendingAdvance(true)

    setStack((prev) =>
      prev.map((c, i) =>
        i === activeIndex
          ? { ...c, state: correct ? 'correct' : 'missed', answerSnapshot: answer }
          : c
      )
    )

    if (correct) {
      const newCombo = combo + 1
      setCombo(newCombo)
      const pts = 100 * (1 + Math.floor(newCombo / 3) * 0.5) * (rankIdx + 1)
      setScore((s) => s + Math.round(pts))
    } else {
      setCombo(0)
      setFlawless(false)
    }
  }

  // Called after player views the explanation and clicks NEXT / GOT IT
  function advanceCard() {
    setPendingAdvance(false)
    if (!lastCorrect) {
      setPhase('failed')
      return
    }
    const nextIndex = activeIndex + 1
    if (nextIndex >= stack.length) {
      if (rankIdx >= RANKS.length - 1) {
        recordGameResult(config.gameId as GameId, rank, score, flawless)
        setPhase('victory')
      } else {
        setPhase('levelup')
      }
    } else {
      setActiveIndex(nextIndex)
    }
  }

  function proceedAfterLevelup() {
    const newRankIdx = rankIdx + 1
    const newRank = RANKS[newRankIdx]
    const newAttempt = attempt + 1
    setRank(newRank)
    setStack(buildFreshStack(newRank, newAttempt))
    setActiveIndex(0)
    setAttempt(newAttempt)
    setIsReviewing(false)
    setPendingAdvance(false)
    setPhase('playing')
  }

  function retryStack() {
    const newAttempt = attempt + 1
    setStack(buildSameStack())
    setActiveIndex(0)
    setAttempt(newAttempt)
    setIsReviewing(false)
    setPendingAdvance(false)
    setPhase('playing')
  }

  function quit() { clearTimer(); setPhase('menu') }

  function enterReview() {
    clearTimer()
    setIsReviewing(true)
    setReviewIndex(activeIndex > 0 ? activeIndex - 1 : 0)
    setPhase('review')
  }

  function exitReview() {
    setIsReviewing(false)
    setPhase('playing')
  }

  return [
    { phase, rank, rankIndex: rankIdx, stack, activeIndex, reviewIndex, combo, score, timeLeft, maxTime, flawless, attempt, isReviewing, pendingAdvance, lastAnswer, lastCorrect },
    { startGame, submitAnswer, advanceCard, enterReview, exitReview, setReviewIndex, retryStack, quit, proceedAfterLevelup },
  ]
}

function isCorrect(q: Question, answer: unknown): boolean {
  if (q.kind === 'multiple-choice') return answer === q.correctIndex
  if (q.kind === 'drag-order') return (answer as string[]).every((v, i) => v === q.items[i])
  if (q.kind === 'drag-match') {
    const ans = answer as Record<string, string>
    return q.pairs.every((p) => ans[p.label] === p.match)
  }
  if (q.kind === 'drag-ruleset') return (answer as string[]).every((id, i) => id === q.rules[i].id)
  if (q.kind === 'click-suspicious') return answer === q.suspiciousIndex
  if (q.kind === 'click-multi') {
    const selected = new Set(answer as string[])
    const correct  = new Set(q.items.filter((i) => i.flag).map((i) => i.id))
    if (selected.size !== correct.size) return false
    for (const id of correct) if (!selected.has(id)) return false
    return true
  }
  return false
}
