import type { DragMatchQuestion } from '../types'

// Zones from least-trusted to most-trusted
export const ZONES = ['DMZ', 'Internal LAN', 'Secure Zone'] as const
export type NetworkZone = typeof ZONES[number]

export const ZONE_DESCRIPTIONS: Record<NetworkZone, string> = {
  'DMZ':          'Semi-trusted perimeter. Hosts public-facing services accessible from the internet. If compromised, attacker still cannot reach internal network directly.',
  'Internal LAN': 'Trusted internal network. Employee workstations, file shares, printers. No direct internet access. Protected from DMZ by internal firewall.',
  'Secure Zone':  'Restricted segment. Sensitive systems requiring highest protection. DB servers, CA, RADIUS/auth servers, SIEM. Requires explicit allow rules even from LAN.',
}

export const ZONE_COLORS: Record<NetworkZone, string> = {
  'DMZ':          'var(--c-amber)',
  'Internal LAN': 'var(--c-blue)',
  'Secure Zone':  'var(--c-pink)',
}

export const NET_ZONE_SCENARIOS: DragMatchQuestion[] = [
  {
    id: 'nz-01',
    kind: 'drag-match',
    prompt: 'A company hosts a public e-commerce website backed by a customer database. They also run an internal HR portal used only by employees. Place each component in the correct network zone.',
    pairs: [
      { label: 'Web Server (public storefront)',  match: 'DMZ' },
      { label: 'Customer Database',               match: 'Secure Zone' },
      { label: 'Internal HR Portal',              match: 'Internal LAN' },
      { label: 'Reverse Proxy / WAF',             match: 'DMZ' },
    ],
    explanation: 'The web server and WAF sit in the DMZ — they must be reachable from the internet but isolated from internal systems. The customer database holds sensitive PII and belongs in the Secure Zone where only the web server (via strict firewall rules) can reach it. The HR portal is for employees only and never needs internet exposure, so it lives in the Internal LAN.',
  },
  {
    id: 'nz-02',
    kind: 'drag-match',
    prompt: 'A healthcare org needs public email delivery, a certificate authority for internal TLS, a SIEM for log collection, and a bastion host for remote admin access. Place each in the correct zone.',
    pairs: [
      { label: 'Public Mail Relay (SMTP inbound)', match: 'DMZ' },
      { label: 'Internal CA (Root/Intermediate)',   match: 'Secure Zone' },
      { label: 'SIEM / Log Aggregator',             match: 'Internal LAN' },
      { label: 'Bastion Host (Jump Server)',         match: 'DMZ' },
    ],
    explanation: 'The mail relay must accept external connections so it lives in the DMZ — keep it isolated from internal mail servers. The CA is a crown-jewel asset: if compromised, every cert it issued is untrusted. It belongs in the Secure Zone, air-gapped or heavily restricted. SIEM collects from all segments and is internal-only — Internal LAN. The bastion host is an intentionally externally-accessible admin gateway — DMZ placement limits blast radius if it is compromised.',
  },
  {
    id: 'nz-03',
    kind: 'drag-match',
    prompt: 'A university has a public DNS resolver, an LDAP/Active Directory domain controller, a RADIUS server for 802.1X WiFi auth, and a honeypot to detect lateral movement. Where does each go?',
    pairs: [
      { label: 'Public DNS Resolver',              match: 'DMZ' },
      { label: 'Active Directory Domain Controller', match: 'Internal LAN' },
      { label: 'RADIUS Authentication Server',     match: 'Secure Zone' },
      { label: 'Honeypot (attacker decoy)',         match: 'DMZ' },
    ],
    explanation: 'Public DNS must answer external queries — DMZ. The AD DC manages all internal identities; exposing it to the DMZ would be catastrophic — Internal LAN behind a firewall. RADIUS handles authentication credentials and 802.1X secrets; it should be in the Secure Zone reachable only by network devices and authorized hosts. Honeypots in the DMZ or internal network lure attackers who have already breached the perimeter — DMZ placement catches scanning before attackers reach internal systems.',
  },
  {
    id: 'nz-04',
    kind: 'drag-match',
    prompt: 'A bank runs an API gateway for mobile banking, a secrets vault for encryption keys, employee workstations, and a vulnerability scanner. Assign each to the correct zone.',
    pairs: [
      { label: 'Mobile Banking API Gateway',       match: 'DMZ' },
      { label: 'Encryption Key / Secrets Vault',   match: 'Secure Zone' },
      { label: 'Employee Workstations',            match: 'Internal LAN' },
      { label: 'Vulnerability Scanner',            match: 'Internal LAN' },
    ],
    explanation: 'The API gateway faces the internet — DMZ. The secrets vault stores cryptographic keys; if it is compromised the attacker can decrypt everything — Secure Zone, extremely restricted. Employee workstations are trusted internal devices — Internal LAN. The vulnerability scanner needs to reach all internal hosts and should itself be protected from external access — Internal LAN (it scans outward, not inbound).',
  },
  {
    id: 'nz-05',
    kind: 'drag-match',
    prompt: 'A SaaS provider deploys a load balancer, an internal ticketing system, a backup server containing customer data snapshots, and a development workstation. Place them correctly.',
    pairs: [
      { label: 'Load Balancer (internet-facing)',  match: 'DMZ' },
      { label: 'Internal IT Ticketing System',     match: 'Internal LAN' },
      { label: 'Backup Server (customer data)',    match: 'Secure Zone' },
      { label: 'Developer Workstation',            match: 'Internal LAN' },
    ],
    explanation: 'The load balancer distributes incoming public traffic — DMZ, similar to a reverse proxy. Ticketing is internal-only — Internal LAN. The backup server holds full copies of customer data — any breach here is as damaging as breaching the primary DB, so Secure Zone. Developer workstations are internal users and belong in Internal LAN (separate from production Secure Zone to prevent accidental access).',
  },
  {
    id: 'nz-06a',
    kind: 'drag-match',
    prompt: 'A security team deploys network monitoring tools. Place each sensor/device in the zone that correctly reflects its function and required network visibility.',
    pairs: [
      { label: 'Network IDS (passive — span port)',   match: 'Internal LAN' },
      { label: 'Inline IPS (active — blocks traffic)', match: 'DMZ' },
      { label: 'SIEM (collects logs from all zones)',  match: 'Internal LAN' },
      { label: 'Honeypot (attacker decoy system)',     match: 'DMZ' },
    ],
    explanation: 'A passive Network IDS connects to a span/mirror port and receives a copy of all traffic — it alerts but does not block. It is typically deployed in the Internal LAN where most lateral movement would occur. An inline IPS sits in the actual traffic path (bump-in-the-wire) and can block traffic — placed at the DMZ boundary to stop attacks before they reach internal networks. The SIEM aggregates logs from all zones and lives in a protected internal segment. The honeypot is an intentional decoy — placing it in the DMZ exposes it to external attackers while keeping it isolated from production internal systems.',
  },
  {
    id: 'nz-06',
    kind: 'drag-match',
    prompt: 'A fintech startup uses a public-facing FTP server for client file exchange, an internal NTP time server, a PCI-scoped payment processing server, and network printers. Where does each belong?',
    pairs: [
      { label: 'SFTP Server (client file exchange)', match: 'DMZ' },
      { label: 'Internal NTP Server',               match: 'Internal LAN' },
      { label: 'Payment Processing Server (PCI)',   match: 'Secure Zone' },
      { label: 'Network Printers',                  match: 'Internal LAN' },
    ],
    explanation: 'The SFTP server accepts external client connections — DMZ (ensure it uses SFTP, not FTP). The NTP server synchronizes internal clocks; no internet exposure needed — Internal LAN. Payment processing servers are PCI-DSS scoped assets; PCI requires a dedicated, isolated network segment — Secure Zone. Printers are internal shared devices; placing them in the DMZ would be a serious misconfiguration.',
  },
]
