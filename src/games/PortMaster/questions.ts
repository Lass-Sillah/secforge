import type { MultipleChoiceQuestion, Rank } from '../../types'
import { PORT_LIST, type PortEntry } from '../../data/ports'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(target: string, pool: string[], count: number): string[] {
  return shuffle(pool.filter((p) => p !== target)).slice(0, count)
}

// Generate "port → protocol" question
function portToProtocol(entry: PortEntry): MultipleChoiceQuestion {
  const others = shuffle(PORT_LIST.filter((e) => e !== entry)).slice(0, 3)
  const options = shuffle([entry.protocol, ...others.map((e) => e.protocol)])
  return {
    id: `pm-p2pr-${entry.protocol}`,
    kind: 'multiple-choice',
    prompt: `Which protocol uses port ${entry.port}?`,
    options,
    correctIndex: options.indexOf(entry.protocol),
    explanation: `Port ${entry.port} → ${entry.protocol}. ${entry.note}`,
  }
}

// Generate "protocol → port" question
function protocolToPort(entry: PortEntry): MultipleChoiceQuestion {
  const otherPorts = shuffle(PORT_LIST.filter((e) => e !== entry)).slice(0, 3).map((e) => String(e.port))
  const options = shuffle([String(entry.port), ...otherPorts])
  return {
    id: `pm-pr2p-${entry.protocol}`,
    kind: 'multiple-choice',
    prompt: `What port number does ${entry.protocol} use?`,
    options,
    correctIndex: options.indexOf(String(entry.port)),
    explanation: `${entry.protocol} uses port ${entry.port}. ${entry.note}`,
  }
}

// Generate "secure swap" question (insecure → pick port of secure replacement)
function secureSwap(entry: PortEntry): MultipleChoiceQuestion | null {
  if (!entry.secureReplacement) return null
  const secureEntry = PORT_LIST.find((e) => e.protocol === entry.secureReplacement)
  if (!secureEntry) return null
  const distractorPorts = pickDistractors(String(secureEntry.port), PORT_LIST.map((e) => String(e.port)), 3)
  const options = shuffle([String(secureEntry.port), ...distractorPorts])
  return {
    id: `pm-swap-${entry.protocol}`,
    kind: 'multiple-choice',
    prompt: `${entry.protocol} is insecure. What port does its secure replacement (${entry.secureReplacement}) use?`,
    options,
    correctIndex: options.indexOf(String(secureEntry.port)),
    explanation: `${entry.protocol} (port ${entry.port}) should be replaced by ${entry.secureReplacement} (port ${secureEntry.port}). ${secureEntry.note}`,
  }
}

const RANK_CONFIG: Record<Rank, { types: Array<'p2pr' | 'pr2p' | 'swap'>, count: number }> = {
  E: { types: ['p2pr'],            count: 4 },
  D: { types: ['pr2p'],            count: 5 },
  C: { types: ['p2pr', 'pr2p'],    count: 6 },
  B: { types: ['p2pr', 'pr2p', 'swap'], count: 6 },
  A: { types: ['p2pr', 'pr2p', 'swap'], count: 7 },
  S: { types: ['p2pr', 'pr2p', 'swap'], count: 8 },
}

export function generatePortStack(rank: Rank): MultipleChoiceQuestion[] {
  const { types, count } = RANK_CONFIG[rank]
  const pool = shuffle(PORT_LIST)
  const questions: MultipleChoiceQuestion[] = []

  for (const entry of pool) {
    if (questions.length >= count) break
    const type = types[Math.floor(Math.random() * types.length)]
    if (type === 'p2pr') questions.push(portToProtocol(entry))
    else if (type === 'pr2p') questions.push(protocolToPort(entry))
    else if (type === 'swap') {
      if (!entry.secureReplacement) { questions.push(portToProtocol(entry)); continue }
      const q = secureSwap(entry)
      if (q) questions.push(q)
    }
  }

  return questions.slice(0, count)
}
