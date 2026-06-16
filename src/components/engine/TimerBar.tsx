interface Props {
  timeLeft: number   // float seconds remaining
  maxTime: number
}

export function TimerBar({ timeLeft, maxTime }: Props) {
  if (maxTime <= 0) return null
  const pct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100))
  const color = pct > 50 ? 'var(--c-green)' : pct > 25 ? 'var(--c-amber)' : 'var(--c-pink)'
  const secs = Math.ceil(timeLeft)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        color,
        minWidth: 28,
        textAlign: 'right',
        transition: 'color 0.3s',
      }}>{secs}s</span>
      <div style={{
        flex: 1,
        height: 5,
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          boxShadow: `0 0 8px ${color}`,
          // No CSS transition — updated at 50ms so it appears perfectly smooth
        }} />
      </div>
    </div>
  )
}
