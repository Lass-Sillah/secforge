import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameId, GameRecord, GlobalStats, Rank } from '../types'

const defaultRecord = (): GameRecord => ({
  bestRank: null,
  bestScore: 0,
  flawlessClears: 0,
  lastPlayed: null,
})

const defaultGlobalStats = (): GlobalStats => ({
  records: {
    'port-master':     defaultRecord(),
    'firewall-forge':  defaultRecord(),
    'log-hunter':      defaultRecord(),
    'attack-match':    defaultRecord(),
    'incident-order':  defaultRecord(),
    'access-control':  defaultRecord(),
    'crypto-select':   defaultRecord(),
    'net-zones':       defaultRecord(),
    'pki-lab':         defaultRecord(),
    'wireless-config': defaultRecord(),
    'harden-target':   defaultRecord(),
  },
  studyDates: [],
})

const RANK_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S']
const rankIndex = (r: Rank) => RANK_ORDER.indexOf(r)

interface GameStore extends GlobalStats {
  recordGameResult: (gameId: GameId, rank: Rank, score: number, flawless: boolean) => void
  touchStudyDate: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...defaultGlobalStats(),

      recordGameResult(gameId, rank, score, flawless) {
        set((state) => {
          const prev = state.records[gameId]
          const betterRank =
            prev.bestRank === null || rankIndex(rank) > rankIndex(prev.bestRank)
          const records: GlobalStats['records'] = {
            ...state.records,
            [gameId]: {
              bestRank: betterRank ? rank : prev.bestRank,
              bestScore: Math.max(prev.bestScore, score),
              flawlessClears: prev.flawlessClears + (flawless ? 1 : 0),
              lastPlayed: new Date().toISOString().slice(0, 10),
            },
          }
          return { records }
        })
      },

      touchStudyDate() {
        const today = new Date().toISOString().slice(0, 10)
        set((state) => {
          if (state.studyDates.includes(today)) return state
          return { studyDates: [...state.studyDates, today] }
        })
      },
    }),
    {
      name: 'secforge-v1',
    }
  )
)

// ─── Derived selectors ────────────────────────────────────────────────────────
export const selectTotalFlawless = (s: GlobalStats) =>
  Object.values(s.records).reduce((sum, r) => sum + r.flawlessClears, 0)

export const selectHighestRank = (s: GlobalStats): Rank | null => {
  const ranks = Object.values(s.records)
    .map((r) => r.bestRank)
    .filter(Boolean) as Rank[]
  if (!ranks.length) return null
  return ranks.reduce((best, r) =>
    rankIndex(r) > rankIndex(best) ? r : best
  )
}

export const selectStreak = (s: GlobalStats): number => {
  const dates = [...s.studyDates].sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    if (dates[i] === expected.toISOString().slice(0, 10)) streak++
    else break
  }
  return streak
}
