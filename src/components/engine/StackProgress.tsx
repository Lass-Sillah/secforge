import type { CardResult } from '../../types'

interface Props {
  stack: CardResult[]
  activeIndex: number
}

export function StackProgress({ stack, activeIndex }: Props) {
  return (
    <div className="flex gap-1 w-full">
      {stack.map((card, i) => {
        let color = 'bg-[var(--c-border)]'
        if (card.state === 'correct') color = 'bg-[var(--c-green)]'
        else if (card.state === 'missed') color = 'bg-[var(--c-pink)]'
        else if (i === activeIndex) color = 'bg-[var(--c-cyan)]'
        return (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-all duration-200 ${color}`}
            style={i === activeIndex ? { boxShadow: '0 0 6px var(--c-cyan)' } : undefined}
          />
        )
      })}
    </div>
  )
}
