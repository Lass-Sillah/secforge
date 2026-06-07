import { Link } from 'react-router-dom'
import { useGameStore, selectTotalFlawless, selectHighestRank, selectStreak } from '../store/gameStore'
import { RANK_COLORS, type Rank } from '../types'
import type { GameId } from '../types'

interface GameMeta {
  id: GameId
  name: string
  subtitle: string
  domains: string
  route: string
  color: string
  icon: string
}

const GAMES: GameMeta[] = [
  // Row 1 — Core protocols & network
  { id: 'port-master',     name: 'PORT MASTER',      subtitle: 'Protocol ↔ Port mapping & secure replacements',        domains: 'Domain 3 & 4', route: '/port-master',     color: 'var(--c-cyan)',   icon: '⬡' },
  { id: 'firewall-forge',  name: 'FIREWALL FORGE',   subtitle: 'Drag-to-order firewall ACL rules — first match wins',  domains: 'Domain 3 & 4', route: '/firewall-forge',  color: 'var(--c-amber)',  icon: '⬢' },
  { id: 'net-zones',       name: 'NET ZONES',        subtitle: 'Place servers into correct DMZ / LAN / Secure zones',  domains: 'Domain 3',     route: '/net-zones',       color: 'var(--c-orange)', icon: '◈' },
  // Row 2 — Threats & response
  { id: 'log-hunter',      name: 'LOG HUNTER',       subtitle: 'Spot the IoC in real log output',                      domains: 'Domain 2 & 4', route: '/log-hunter',      color: 'var(--c-green)',  icon: '◉' },
  { id: 'attack-match',    name: 'ATTACK MATCH',     subtitle: 'Match attacks to their descriptions',                   domains: 'Domain 2',     route: '/attack-match',    color: 'var(--c-pink)',   icon: '◎' },
  { id: 'incident-order',  name: 'INCIDENT ORDER',   subtitle: 'Sequence IR phases (PICERL) & Order of Volatility',   domains: 'Domain 4 & 5', route: '/incident-order',  color: 'var(--c-violet)', icon: '◆' },
  // Row 3 — Identity & crypto
  { id: 'access-control',  name: 'ACCESS CONTROL',   subtitle: 'MAC vs DAC vs RBAC vs ABAC scenarios',                domains: 'Domain 1 & 4', route: '/access-control',  color: 'var(--c-blue)',   icon: '◇' },
  { id: 'crypto-select',   name: 'CRYPTO SELECT',    subtitle: 'Match use cases to algorithms; flag deprecated',       domains: 'Domain 3',     route: '/crypto-select',   color: 'var(--c-green)',  icon: '⬡' },
  { id: 'pki-lab',         name: 'PKI LAB',          subtitle: 'Cert types, cert issues, TLS handshake sequence',      domains: 'Domain 3',     route: '/pki-lab',         color: 'var(--c-violet)', icon: '⬢' },
  // Row 4 — Wireless & hardening
  { id: 'wireless-config', name: 'WIRELESS CONFIG',  subtitle: 'WPA2/WPA3, EAP-TLS, PEAP, 802.1X — pick the right one', domains: 'Domain 3',  route: '/wireless-config', color: 'var(--c-cyan)',   icon: '◈' },
  { id: 'harden-target',   name: 'HARDEN TARGET',    subtitle: 'Audit running services; flag every misconfiguration',  domains: 'Domain 3 & 4', route: '/harden-target',   color: 'var(--c-orange)', icon: '◉' },
]

const ASCII_BANNER = `
 ███████╗███████╗ ██████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
 ██╔════╝██╔════╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
 ███████╗█████╗  ██║     █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
 ╚════██║██╔══╝  ██║     ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
 ███████║███████╗╚██████╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
 ╚══════╝╚══════╝ ╚═════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`

// Bars = SECFORGE's PBQ coverage of each domain's exam-relevant content
// Exam domain weights: D1=12% D2=22% D3=18% D4=28% D5=20%
const DOMAIN_COVERAGE = [
  { domain: 'Domain 1 (12%) — General Security Concepts',        pct: 55,  color: 'var(--c-blue)',   note: 'AccessControl: models + least privilege / SoD' },
  { domain: 'Domain 2 (22%) — Threats, Vulns & Mitigations',     pct: 80,  color: 'var(--c-pink)',   note: 'AttackMatch (40 attacks) + LogHunter (14 IoC scenarios)' },
  { domain: 'Domain 3 (18%) — Security Architecture',            pct: 90,  color: 'var(--c-cyan)',   note: 'FirewallForge, NetZones, PKI Lab, Crypto, Wireless, Ports' },
  { domain: 'Domain 4 (28%) — Security Operations',              pct: 75,  color: 'var(--c-green)',  note: 'LogHunter, IncidentOrder, HardenTarget — largest exam domain' },
  { domain: 'Domain 5 (20%) — Program Management & Oversight',   pct: 15,  color: 'var(--c-violet)', note: 'Governance / compliance — primarily MC, not PBQ' },
]

export function Hub() {
  const store = useGameStore()
  const totalFlawless = selectTotalFlawless(store)
  const highestRank = selectHighestRank(store)
  const streak = selectStreak(store)

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {/* Terminal header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--c-border)] bg-[var(--c-surface)] text-xs text-[var(--c-dim)] sticky top-0 z-50">
        <span className="text-[var(--c-cyan)]">root@secforge</span>
        <span>:~$</span>
        <span className="text-[var(--c-body)]">./secforge <span className="text-[var(--c-green)]">--launch</span></span>
        <span className="ml-auto pulse-glow text-[var(--c-green)]">■</span>
      </div>

      {/* Centered content */}
      <div className="flex flex-col p-6 gap-8 fade-in" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>

        {/* ASCII Banner */}
        <div className="text-center">
          <pre className="text-[8px] sm:text-[10px] leading-tight overflow-x-auto" style={{ color: 'var(--c-cyan)', textShadow: '0 0 8px var(--c-cyan)' }}>
            {ASCII_BANNER}
          </pre>
          <p className="text-[var(--c-dim)] text-xs mt-3 tracking-widest">SY0-701 PBQ TRAINER — 11 MODULES — TERMINAL EDITION</p>
        </div>

        {/* Stats + Domain coverage side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 border border-[var(--c-border)] p-4 rounded bg-[var(--c-surface)]">
            <div className="text-center">
              <p className="text-2xl font-bold glow-green text-[var(--c-green)]">{totalFlawless}</p>
              <p className="text-[10px] text-[var(--c-dim)] mt-1">FLAWLESS</p>
            </div>
            <div className="text-center border-x border-[var(--c-border)]">
              <p className="text-2xl font-bold" style={{ color: highestRank ? RANK_COLORS[highestRank] : 'var(--c-dim)', textShadow: highestRank ? `0 0 10px ${RANK_COLORS[highestRank]}` : undefined }}>
                {highestRank ?? '—'}
              </p>
              <p className="text-[10px] text-[var(--c-dim)] mt-1">BEST RANK</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold glow-amber text-[var(--c-amber)]">{streak}</p>
              <p className="text-[10px] text-[var(--c-dim)] mt-1">DAY STREAK</p>
            </div>
          </div>

          {/* Domain coverage bars */}
          <div className="border border-[var(--c-border)] p-4 rounded bg-[var(--c-surface)]">
            <p className="text-[10px] text-[var(--c-dim)] mb-3 tracking-widest">// SECFORGE PBQ COVERAGE BY DOMAIN</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOMAIN_COVERAGE.map((d) => (
                <div key={d.domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: 'var(--c-dim)', fontSize: 10 }}>{d.domain}</span>
                    <span style={{ color: d.color, fontSize: 10, fontWeight: 700 }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 2, boxShadow: `0 0 6px ${d.color}` }} />
                  </div>
                  <p style={{ color: 'var(--c-dim)', fontSize: 9, opacity: 0.6, margin: 0 }}>{d.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game grid */}
        <div>
          <p className="text-[var(--c-dim)] text-xs mb-4 tracking-widest">// SELECT TRAINING MODULE</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAMES.map((game) => {
              const record = store.records[game.id]
              const bestRank = record?.bestRank as Rank | null
              return <GameCard key={game.id} game={game} bestRank={bestRank} bestScore={record?.bestScore ?? 0} />
            })}
          </div>
        </div>

        {/* PBQ coverage note */}
        <div className="border border-[var(--c-border)] bg-[var(--c-surface)] p-4 rounded text-[11px] text-[var(--c-dim)]">
          <p className="text-[var(--c-cyan)] font-bold text-xs mb-2">PBQ COVERAGE — SY0-701</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '4px 24px' }}>
            {['Ports & Protocols', 'Firewall / ACL Rules', 'Network Zone Placement', 'Log Analysis / IoC', 'Attack Identification', 'Incident Response (PICERL)', 'Order of Volatility', 'Access Control Models', 'Cryptography Selection', 'PKI / Certificate Types', 'TLS Handshake Sequence', 'Wireless Security (WPA/EAP)', 'Server & Endpoint Hardening'].map((t) => (
              <span key={t} style={{ color: 'var(--c-dim)' }}>✓ {t}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[var(--c-dim)] text-[10px] border-t border-[var(--c-border)] pt-4">
          SECFORGE v2.0 — CompTIA Security+ SY0-701 — 11 modules — All data runs client-side
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, bestRank, bestScore }: { game: GameMeta; bestRank: Rank | null; bestScore: number }) {
  return (
    <Link to={game.route} className="block border border-[var(--c-border)] bg-[var(--c-surface)] p-4 rounded transition-all duration-200 no-underline group" style={{ '--hover-color': game.color } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid var(--c-border)', paddingBottom: 8 }}>
        <span className="text-2xl" style={{ color: game.color }}>{game.icon}</span>
        {bestRank ? (
          <span className="text-lg font-bold" style={{ color: RANK_COLORS[bestRank], textShadow: `0 0 8px ${RANK_COLORS[bestRank]}` }}>RANK {bestRank}</span>
        ) : (
          <span className="text-[10px] text-[var(--c-dim)] border border-[var(--c-border)] px-2 py-0.5 rounded">NOT STARTED</span>
        )}
      </div>
      <h3 className="font-bold text-sm mb-1" style={{ color: game.color }}>{game.name}</h3>
      <p className="text-[11px] text-[var(--c-dim)] mb-3 leading-snug">{game.subtitle}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] px-2 py-0.5 rounded border" style={{ color: game.color, borderColor: game.color, opacity: 0.6 }}>{game.domains}</span>
        <span className="text-[10px] text-[var(--c-dim)]">{bestScore > 0 ? `${bestScore.toLocaleString()} pts` : '—'}</span>
      </div>
      <div className="mt-3 w-full btn-neon text-xs" style={{ color: game.color, borderColor: game.color }}>▶ PLAY</div>
    </Link>
  )
}
