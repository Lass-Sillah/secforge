// Inline SVG icons — replaces emoji for consistent cross-platform rendering

interface IconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

export function CloudIcon({ size = 20, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} aria-hidden>
      <path d="M6.5 20Q4.22 20 2.61 18.43 1 16.85 1 14.58q0-1.95 1.17-3.48 1.17-1.54 3.08-1.95.51-2.18 2.21-3.67Q9.16 4 11.5 4q2.89 0 4.94 2.05Q18.5 8.11 18.5 11q1.78.23 2.89 1.55Q22.5 13.88 22.5 15.5q0 1.87-1.31 3.18Q19.87 20 18 20Z" />
    </svg>
  )
}

export function FlameIcon({ size = 18, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} aria-hidden>
      <path d="M12 23q-2.8 0-4.9-1.925T5 16.25q0-1.35.463-2.612.462-1.263 1.337-2.288L12 5l5.2 6.35q.875 1.025 1.338 2.288Q19 14.9 19 16.25q0 2.9-2.1 4.825T12 23Zm0-2q1.95 0 3.35-1.225T17 16.25q0-.975-.35-1.875t-1-1.625L12 8.5l-3.65 4.25q-.65.65-1 1.625-.35.975-.35 1.875 0 1.8 1.4 3.025T12 21Z" />
    </svg>
  )
}

export function WarnIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} aria-hidden>
      <path d="M1 21 12 2l11 19H1Zm11-3q.425 0 .713-.288Q13 17.425 13 17t-.287-.712Q12.425 16 12 16t-.712.288Q11 16.575 11 17t.288.712Q11.575 18 12 18Zm-1-3h2v-5h-2v5Z" />
    </svg>
  )
}

export function CheckIcon({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function CrossIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" style={style} aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function PlayIcon({ size = 12, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} aria-hidden>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 12, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 12, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  )
}

export function RetryIcon({ size = 14, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export function HubIcon({ size = 12, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}
