import { Link } from 'react-router-dom'

interface Props {
  module: string
}

export function TerminalHeader({ module }: Props) {
  return (
    <div style={{ width: '100%' }} className="flex items-center gap-3 px-4 py-2 border-b border-[var(--c-border)] bg-[var(--c-surface)] text-xs text-[var(--c-dim)] sticky top-0 z-50">
      <Link to="/" className="text-[var(--c-cyan)] hover:text-[var(--c-green)] transition-colors">
        root@seclite
      </Link>
      <span>:~/seclite$</span>
      <span className="text-[var(--c-body)]">
        ./<span className="text-[var(--c-cyan)]">{module}</span>
      </span>
      <span className="ml-auto pulse-glow text-[var(--c-green)]">■</span>
    </div>
  )
}
