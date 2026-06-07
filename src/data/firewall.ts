import type { DragRulesetQuestion } from '../types'

export const FIREWALL_SCENARIOS: DragRulesetQuestion[] = [
  {
    id: 'fw-01',
    kind: 'drag-ruleset',
    prompt: 'Configure firewall rules for a DMZ web server scenario.',
    scenario:
      'You have a DMZ web server at 10.10.10.50. Requirements: (1) Allow HTTPS from the internet, (2) Allow SSH only from admin subnet 192.168.1.0/24, (3) Block all other inbound traffic. Firewall processes rules top-down, first match wins.',
    rules: [
      { id: 'r1', src: 'ANY',            dst: '10.10.10.50', port: '443', action: 'ALLOW', label: 'ALLOW HTTPS from internet → DMZ server' },
      { id: 'r2', src: '192.168.1.0/24', dst: '10.10.10.50', port: '22',  action: 'ALLOW', label: 'ALLOW SSH from admin subnet → DMZ server' },
      { id: 'r3', src: 'ANY',            dst: '10.10.10.50', port: 'ANY', action: 'DENY',  label: 'DENY ALL other inbound to DMZ server' },
    ],
    trap: 'Do NOT place the DENY ALL rule before the ALLOW rules — first-match-wins means placing DENY ANY before specific allows will block legitimate traffic.',
    explanation:
      'Rules must be ordered most-specific to least-specific. ALLOW HTTPS first, then ALLOW SSH from admin, then DENY ALL. If DENY ALL is above the allows, no traffic ever reaches the server. Specificity + implicit deny-at-bottom is the golden rule.',
  },
  {
    id: 'fw-02',
    kind: 'drag-ruleset',
    prompt: 'Order rules for a multi-tier network: internal users need web access, DB must only accept app server traffic.',
    scenario:
      'Rules needed: (1) App servers (10.20.0.0/24) may reach DB server (10.30.0.10) on port 3306. (2) Internal users (10.0.0.0/8) may browse the internet on ports 80 and 443. (3) DB server rejects all other inbound. (4) Deny everything else. Specific rules above general.',
    rules: [
      { id: 'r1', src: '10.20.0.0/24', dst: '10.30.0.10', port: '3306', action: 'ALLOW', label: 'ALLOW App tier → DB on MySQL 3306' },
      { id: 'r2', src: '10.0.0.0/8',   dst: 'ANY',         port: '80,443', action: 'ALLOW', label: 'ALLOW internal users → internet HTTP/HTTPS' },
      { id: 'r3', src: 'ANY',           dst: '10.30.0.10', port: 'ANY',  action: 'DENY',  label: 'DENY all other traffic to DB server' },
      { id: 'r4', src: 'ANY',           dst: 'ANY',         port: 'ANY',  action: 'DENY',  label: 'DENY all remaining traffic (implicit deny)' },
    ],
    trap: 'Never allow ANY/ANY outbound without restriction — that would allow malware C2 callbacks and data exfiltration from any host.',
    explanation:
      'Most specific rules first: the app-to-DB rule is more specific than the internal browsing rule. DENY to DB before the general DENY ALL catches any non-app-server attempting DB access. Final DENY ALL is the explicit implicit deny.',
  },
  {
    id: 'fw-03',
    kind: 'drag-ruleset',
    prompt: 'Secure a VPN gateway: only RADIUS auth traffic and VPN tunnel traffic allowed inbound.',
    scenario:
      'VPN gateway at 172.16.0.1. Rules: (1) Allow UDP 1812 from RADIUS server 10.1.1.100 for auth. (2) Allow UDP 500 + 4500 (IPsec IKE) from any client IP. (3) Allow ESP protocol from any client. (4) Deny everything else to the gateway.',
    rules: [
      { id: 'r1', src: '10.1.1.100', dst: '172.16.0.1', port: '1812/UDP', action: 'ALLOW', label: 'ALLOW RADIUS auth from auth server' },
      { id: 'r2', src: 'ANY',        dst: '172.16.0.1', port: '500,4500/UDP', action: 'ALLOW', label: 'ALLOW IKE/NAT-T for IPsec tunnel setup' },
      { id: 'r3', src: 'ANY',        dst: '172.16.0.1', port: 'ESP',      action: 'ALLOW', label: 'ALLOW ESP (Encapsulating Security Payload)' },
      { id: 'r4', src: 'ANY',        dst: '172.16.0.1', port: 'ANY',      action: 'DENY',  label: 'DENY all other inbound to VPN gateway' },
    ],
    trap: 'RADIUS traffic from ANY source should be denied — only the specific RADIUS server IP should be allowed to authenticate to the gateway.',
    explanation:
      'RADIUS rule is most specific (single server IP) so it goes first. IKE/NAT-T and ESP rules allow VPN clients to establish tunnels. The final DENY protects the gateway from port scans and other attacks. Allowing RADIUS from ANY would let attackers send fake auth packets.',
  },
  {
    id: 'fw-04',
    kind: 'drag-ruleset',
    prompt: 'Configure internal network segmentation rules between HR, IT, and a payroll server.',
    scenario:
      'You are segmenting three internal subnets. HR subnet: 10.10.1.0/24. IT subnet: 10.10.2.0/24. Payroll server: 10.10.3.100. Requirements: (1) HR can reach the payroll server on port 8443 only. (2) IT can reach any internal server on port 22 (SSH) for management. (3) HR and IT must not reach each other\'s subnets (block lateral movement). (4) Implicit deny all remaining traffic.',
    rules: [
      { id: 'r1', src: '10.10.1.0/24', dst: '10.10.3.100',  port: '8443',   action: 'ALLOW', label: 'ALLOW HR subnet → Payroll server on HTTPS 8443' },
      { id: 'r2', src: '10.10.2.0/24', dst: '10.10.0.0/8',  port: '22',     action: 'ALLOW', label: 'ALLOW IT subnet → any internal server on SSH 22' },
      { id: 'r3', src: '10.10.1.0/24', dst: '10.10.2.0/24', port: 'ANY',    action: 'DENY',  label: 'DENY HR → IT subnet (block lateral movement)' },
      { id: 'r4', src: '10.10.2.0/24', dst: '10.10.1.0/24', port: 'ANY',    action: 'DENY',  label: 'DENY IT → HR subnet (block lateral movement)' },
      { id: 'r5', src: 'ANY',          dst: 'ANY',           port: 'ANY',    action: 'DENY',  label: 'DENY ALL remaining traffic (implicit deny)' },
    ],
    trap: 'Do not place the lateral movement DENY rules after the implicit DENY ALL — they would never be evaluated. More importantly, do not place the broad IT SSH ALLOW before HR payroll ALLOW; while order doesn\'t conflict here, always put narrower destination rules before broader ones for clarity and safety.',
    explanation:
      'Internal segmentation enforces least-privilege between departments. HR gets only payroll access on its specific port. IT gets SSH management access to maintain servers. The cross-department DENY rules block lateral movement — a key post-breach containment strategy. Without them, a compromised HR workstation could pivot into IT systems. Implicit deny catches everything not explicitly allowed.',
  },
  {
    id: 'fw-05',
    kind: 'drag-ruleset',
    prompt: 'Protect a mail server — allow necessary SMTP/IMAP flows, deny everything else inbound.',
    scenario:
      'Mail server at 10.0.4.25. Requirements: (1) Allow inbound SMTP (port 25) from the internet so external mail can be received. (2) Allow outbound SMTPS (port 587) from the mail server to deliver mail externally. (3) Allow IMAPS (port 993) from the internal user subnet 10.0.1.0/24 so users can read mail. (4) Deny all other traffic to or from the mail server. Rules are evaluated top-down, first match wins.',
    rules: [
      { id: 'r1', src: 'ANY',           dst: '10.0.4.25', port: '25',    action: 'ALLOW', label: 'ALLOW SMTP inbound from internet → mail server' },
      { id: 'r2', src: '10.0.4.25',     dst: 'ANY',       port: '587',   action: 'ALLOW', label: 'ALLOW SMTPS outbound from mail server → internet' },
      { id: 'r3', src: '10.0.1.0/24',   dst: '10.0.4.25', port: '993',   action: 'ALLOW', label: 'ALLOW IMAPS from internal users → mail server' },
      { id: 'r4', src: 'ANY',           dst: '10.0.4.25', port: 'ANY',   action: 'DENY',  label: 'DENY all other traffic to mail server' },
    ],
    trap: 'Do not allow plain IMAP (port 143) or plain SMTP relay (port 25 outbound from internal hosts) — plain protocols transmit credentials in cleartext, and open relay misconfiguration turns the server into a spam source. Only allow encrypted variants (SMTPS 587, IMAPS 993) for user-facing flows.',
    explanation:
      'Mail server rules must distinguish direction and protocol. Port 25 inbound allows external MTAs to deliver mail (MX record traffic). Port 587 outbound is authenticated SMTPS for the server\'s own outgoing delivery. Port 993 is IMAPS — encrypted client access for reading mail. The final DENY ALL prevents the server from being used as an attack pivot or proxy. Never leave port 25 open for outbound from internal hosts — that enables spam relaying.',
  },
  {
    id: 'fw-06',
    kind: 'drag-ruleset',
    prompt: 'Apply zero-trust rules for a web application: force HTTPS, restrict access to an authenticated subnet, and allow monitoring.',
    scenario:
      'Web application server at 10.50.0.10. Authenticated user subnet: 10.1.0.0/24. Monitoring server: 10.99.0.5. Requirements: (1) Allow HTTPS (443) only from the authenticated user subnet. (2) Allow the monitoring server to reach port 8080 for health checks. (3) Explicitly deny plain HTTP (port 80) to force HTTPS. (4) Deny all other traffic.',
    rules: [
      { id: 'r1', src: '10.1.0.0/24', dst: '10.50.0.10', port: '443',   action: 'ALLOW', label: 'ALLOW HTTPS from authenticated user subnet → app server' },
      { id: 'r2', src: '10.99.0.5',   dst: '10.50.0.10', port: '8080',  action: 'ALLOW', label: 'ALLOW health-check from monitoring server on port 8080' },
      { id: 'r3', src: 'ANY',         dst: '10.50.0.10', port: '80',    action: 'DENY',  label: 'DENY plain HTTP to force HTTPS (no cleartext)' },
      { id: 'r4', src: 'ANY',         dst: '10.50.0.10', port: 'ANY',   action: 'DENY',  label: 'DENY all other traffic to app server' },
    ],
    trap: 'Do not place the broad DENY ALL (r4) above the explicit HTTP DENY (r3) or the monitoring ALLOW (r2) — the explicit HTTP deny communicates intent clearly and prevents accidental HTTP redirects from being forwarded. The monitoring rule must precede the DENY ALL or the health-check will be silently dropped.',
    explanation:
      'Zero-trust principles require explicit verification for every connection. Restricting HTTPS to a known authenticated subnet ensures only authorised users reach the app. The monitoring exception is narrowly scoped to a single IP and port — no broader access. The explicit HTTP DENY on port 80 is a belt-and-suspenders control: even if the app tried to accept HTTP, the firewall drops it, preventing credential exposure in transit. Everything not explicitly permitted is denied.',
  },
]
