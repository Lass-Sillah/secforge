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
  // Row 5 — Domain 5 & Acronyms
  { id: 'compliance-grid', name: 'COMPLIANCE GRID',  subtitle: 'GRC scenarios: risk formulas, GDPR/HIPAA/SOX, NIST/ISO frameworks, RTO/RPO/BCP/DR', domains: 'Domain 5', route: '/compliance-grid', color: 'var(--c-amber)', icon: '◧' },
  { id: 'acro-flip',       name: 'ACRO FLIP',        subtitle: 'Match boards + fill-in-the-blank — master every SY0-701 acronym', domains: 'All Domains', route: '/acro-flip', color: 'var(--c-violet)', icon: '◑' },
]

const ASCII_BANNER = `
 ███████╗███████╗ ██████╗██╗     ██╗████████╗███████╗
 ██╔════╝██╔════╝██╔════╝██║     ██║╚══██╔══╝██╔════╝
 ███████╗█████╗  ██║     ██║     ██║   ██║   █████╗
 ╚════██║██╔══╝  ██║     ██║     ██║   ██║   ██╔══╝
 ███████║███████╗╚██████╗███████╗██║   ██║   ███████╗
 ╚══════╝╚══════╝ ╚═════╝╚══════╝╚═╝   ╚═╝   ╚══════╝`

// Bars = SECLITE's PBQ coverage of each domain's exam-relevant content
// Exam domain weights: D1=12% D2=22% D3=18% D4=28% D5=20%
const DOMAIN_COVERAGE = [
  { domain: 'Domain 1 (12%) — General Security Concepts',        pct: 55,  color: 'var(--c-blue)',   note: 'AccessControl: models + least privilege / SoD' },
  { domain: 'Domain 2 (22%) — Threats, Vulns & Mitigations',     pct: 80,  color: 'var(--c-pink)',   note: 'AttackMatch (40 attacks) + LogHunter (14 IoC scenarios)' },
  { domain: 'Domain 3 (18%) — Security Architecture',            pct: 90,  color: 'var(--c-cyan)',   note: 'FirewallForge, NetZones, PKI Lab, Crypto, Wireless, Ports' },
  { domain: 'Domain 4 (28%) — Security Operations',              pct: 75,  color: 'var(--c-green)',  note: 'LogHunter, IncidentOrder, HardenTarget — largest exam domain' },
  { domain: 'Domain 5 (20%) — Program Management & Oversight',   pct: 75,  color: 'var(--c-violet)', note: 'ComplianceGrid: risk formulas, GRC frameworks, regulations, BCP/DR' },
]

export function Hub() {
  const store = useGameStore()
  const totalFlawless = selectTotalFlawless(store)
  const highestRank = selectHighestRank(store)
  const streak = selectStreak(store)

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {/* Terminal header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--c-border)] bg-[var(--c-surface)] sticky top-0 z-50 term-header">
        <span style={{ color: 'var(--c-cyan)', fontWeight: 700 }}>root@seclite</span>
        <span style={{ color: 'var(--c-dim)' }}>:~$</span>
        <span style={{ color: 'var(--c-body)' }}>./seclite <span style={{ color: 'var(--c-green)' }}>--launch</span></span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--c-dim)', fontSize: 10, letterSpacing: '0.1em' }}>3 LIVES / RUN</span>
          <span style={{ color: 'var(--c-pink)', fontSize: 12 }}>♥♥♥</span>
          <span className="pulse-glow" style={{ color: 'var(--c-green)', marginLeft: 4 }}>■</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex flex-col p-6 gap-8 fade-in" style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

        {/* Banner */}
        <div className="text-center" style={{ paddingTop: 8 }}>
          <pre className="term-header overflow-x-auto inline-block" style={{
            fontSize: 'clamp(6px, 1.2vw, 11px)',
            lineHeight: 1.25,
            color: 'var(--c-cyan)',
            textShadow: '0 0 10px rgba(34,211,238,0.5)',
            letterSpacing: '0.02em',
          }}>
            {ASCII_BANNER}
          </pre>
          <p style={{ color: 'var(--c-dim)', fontSize: 11, marginTop: 12, letterSpacing: '0.18em', fontFamily: 'var(--font-mono)' }}>
            SY0-701 PBQ TRAINER — 13 MODULES — 3 LIVES PER RUN
          </p>
        </div>

        {/* Stats + Domain coverage */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 14 }}>
          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0, border: '1px solid var(--c-border)', borderRadius: 10,
            background: 'var(--c-surface)', overflow: 'hidden',
          }}>
            {[
              { value: totalFlawless, label: 'FLAWLESS', color: 'var(--c-green)', cls: 'glow-green' },
              { value: highestRank ?? '—', label: 'BEST RANK', color: highestRank ? RANK_COLORS[highestRank] : 'var(--c-dim)', shadow: highestRank ? `0 0 12px ${RANK_COLORS[highestRank]}` : undefined },
              { value: streak, label: 'DAY STREAK', color: 'var(--c-amber)', cls: 'glow-amber' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '18px 12px',
                borderRight: i < 2 ? '1px solid var(--c-border)' : undefined,
              }}>
                <p className={s.cls} style={{ fontSize: 26, fontWeight: 700, color: s.color, textShadow: s.shadow, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: 'var(--c-dim)', marginTop: 6, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Domain coverage bars */}
          <div style={{ border: '1px solid var(--c-border)', borderRadius: 10, padding: '16px 20px', background: 'var(--c-surface)' }}>
            <p style={{ color: 'var(--c-dim)', fontSize: 10, marginBottom: 12, letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}>// SECLITE PBQ COVERAGE BY DOMAIN</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOMAIN_COVERAGE.map((d) => (
                <div key={d.domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--c-body)', fontSize: 12, fontWeight: 500 }}>{d.domain}</span>
                    <span style={{ color: d.color, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 3, boxShadow: `0 0 8px ${d.color}` }} />
                  </div>
                  <p style={{ color: 'var(--c-dim)', fontSize: 11, margin: 0, opacity: 0.7 }}>{d.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game grid */}
        <div>
          <p style={{ color: 'var(--c-dim)', fontSize: 10, marginBottom: 16, letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}>
            // SELECT TRAINING MODULE
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAMES.map((game) => {
              const record = store.records[game.id]
              const bestRank = record?.bestRank as Rank | null
              return <GameCard key={game.id} game={game} bestRank={bestRank} bestScore={record?.bestScore ?? 0} />
            })}
          </div>
        </div>

        {/* PBQ coverage note */}
        <div style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)', borderRadius: 10, padding: '20px 24px' }}>
          <p style={{ color: 'var(--c-cyan)', fontWeight: 700, fontSize: 12, marginBottom: 12, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
            PBQ COVERAGE — SY0-701
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px 24px' }}>
            {['Ports & Protocols', 'Firewall / ACL Rules', 'Network Zone Placement', 'Log Analysis / IoC', 'Attack Identification', 'Incident Response (PICERL)', 'Order of Volatility', 'Access Control Models', 'Cryptography Selection', 'PKI / Certificate Types', 'TLS Handshake Sequence', 'Wireless Security (WPA/EAP)', 'Server & Endpoint Hardening', 'Risk Formulas (SLE/ALE/ARO)', 'GRC Frameworks (NIST/ISO/CIS/SOC2)', 'Regulations (GDPR/HIPAA/SOX/PCI)', 'BCP/DR (RTO/RPO/MTTR/RAID/Backups)', 'SY0-701 Acronyms (Match + Fill-in)'].map((t) => (
              <span key={t} style={{ color: 'var(--c-dim)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--c-green)', fontSize: 10 }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'var(--c-dim)', fontSize: 11, borderTop: '1px solid var(--c-border)', paddingTop: 16, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          SECLITE v3.1 — CompTIA Security+ SY0-701 — 13 modules — 3 lives per run — All data runs client-side
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, bestRank, bestScore }: { game: GameMeta; bestRank: Rank | null; bestScore: number }) {
  return (
    <Link
      to={game.route}
      className="game-card block no-underline"
      style={{
        '--hover-color': game.color,
        border: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
        borderRadius: 10,
        padding: '18px 18px 14px',
        display: 'block',
        textDecoration: 'none',
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--c-border)' }}>
        <span style={{ fontSize: 22, color: game.color, lineHeight: 1 }}>{game.icon}</span>
        {bestRank ? (
          <span style={{ fontWeight: 700, fontSize: 14, color: RANK_COLORS[bestRank], textShadow: `0 0 10px ${RANK_COLORS[bestRank]}`, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>RANK {bestRank}</span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--c-dim)', border: '1px solid var(--c-border)', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>NOT STARTED</span>
        )}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: game.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{game.name}</h3>
      <p style={{ fontSize: 12, color: 'var(--c-dim)', marginBottom: 14, lineHeight: 1.5 }}>{game.subtitle}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: game.color, borderColor: game.color, border: '1px solid', opacity: 0.65, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{game.domains}</span>
        <span style={{ fontSize: 11, color: 'var(--c-dim)', fontFamily: 'var(--font-mono)' }}>{bestScore > 0 ? `${bestScore.toLocaleString()} pts` : '—'}</span>
      </div>
      <button className="btn-neon" style={{ width: '100%', color: game.color, borderColor: game.color, fontSize: 11 }}>▶ PLAY</button>
    </Link>
  )
}
