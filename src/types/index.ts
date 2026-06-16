// ─── Rank System ─────────────────────────────────────────────────────────────
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S']
export const RANK_COLORS: Record<Rank, string> = {
  E: '#5a6b72',
  D: '#60a5fa',
  C: '#4ade80',
  B: '#fbbf24',
  A: '#fb923c',
  S: '#f472b6',
}

// ─── Engine Question Types ────────────────────────────────────────────────────
export type QuestionKind =
  | 'multiple-choice'  // pick one from options
  | 'drag-order'       // drag items into correct sequence
  | 'drag-match'       // drag items to match labels
  | 'drag-ruleset'     // ordered firewall rule builder
  | 'click-suspicious' // click the suspicious log line
  | 'click-multi'      // click ALL items matching a criterion

export interface BaseQuestion {
  id: string
  kind: QuestionKind
  prompt: string
  explanation: string // shown after answer
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  kind: 'multiple-choice'
  options: string[]
  correctIndex: number
}

export interface DragOrderQuestion extends BaseQuestion {
  kind: 'drag-order'
  items: string[]         // correct order
  shuffled?: string[]     // pre-shuffled (generated at runtime if absent)
}

export interface DragMatchQuestion extends BaseQuestion {
  kind: 'drag-match'
  pairs: Array<{ label: string; match: string }>
}

export interface FirewallRule {
  id: string
  src: string
  dst: string
  port: string
  action: 'ALLOW' | 'DENY'
  label: string
}

export interface DragRulesetQuestion extends BaseQuestion {
  kind: 'drag-ruleset'
  scenario: string
  rules: FirewallRule[]   // correct order
  shuffledRules?: FirewallRule[]
  trap?: string           // description of the trap in the set
}

export interface ClickSuspiciousQuestion extends BaseQuestion {
  kind: 'click-suspicious'
  logLines: string[]
  suspiciousIndex: number
  iocType: string         // e.g. "Brute force + credential stuffing"
}

export interface ClickMultiQuestion extends BaseQuestion {
  kind: 'click-multi'
  items: Array<{ id: string; label: string; detail: string; flag: boolean }>
  instruction: string   // e.g. "Select ALL services that should be disabled"
}

export type Question =
  | MultipleChoiceQuestion
  | DragOrderQuestion
  | DragMatchQuestion
  | DragRulesetQuestion
  | ClickSuspiciousQuestion
  | ClickMultiQuestion

// ─── Engine State ─────────────────────────────────────────────────────────────
export type CardState = 'pending' | 'correct' | 'missed' | 'active'

export interface CardResult {
  question: Question
  state: CardState
  answerSnapshot?: unknown // what the player submitted
}

export type EnginePhase =
  | 'menu'
  | 'playing'
  | 'review'
  | 'failed'
  | 'levelup'
  | 'victory'
  | 'gameover'

export interface EngineConfig {
  gameId: string
  gameName: string
  /** Returns questions for a given rank; called fresh each stack attempt */
  generateStack: (rank: Rank, attempt: number) => Question[]
  /** Timer in seconds per card; 0 = no timer */
  timerByRank: Record<Rank, number>
  /** How many cards per rank stack */
  stackSizeByRank: Record<Rank, number>
}

// ─── Persistent storage ───────────────────────────────────────────────────────
export interface GameRecord {
  bestRank: Rank | null
  bestScore: number
  flawlessClears: number   // times entire game cleared without a single miss
  lastPlayed: string | null // ISO date
}

export type GameId =
  | 'port-master'
  | 'firewall-forge'
  | 'log-hunter'
  | 'attack-match'
  | 'incident-order'
  | 'access-control'
  | 'crypto-select'
  | 'net-zones'
  | 'pki-lab'
  | 'wireless-config'
  | 'harden-target'
  | 'acro-flip'

export interface GlobalStats {
  records: Record<GameId, GameRecord>
  studyDates: string[] // ISO date strings, deduped
}
