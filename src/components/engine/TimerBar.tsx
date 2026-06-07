interface Props {
  timeLeft: number
  maxTime: number
}

export function TimerBar({ timeLeft, maxTime }: Props) {
  if (maxTime <= 0) return null
  const pct = Math.max(0, (timeLeft / maxTime) * 100)
  const color = pct > 50 ? 'var(--c-green)' : pct > 25 ? 'var(--c-amber)' : 'var(--c-pink)'

  return (
    <div className="w-full h-1 bg-[var(--c-border)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 linear"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}
