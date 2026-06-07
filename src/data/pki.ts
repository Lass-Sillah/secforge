import type { MultipleChoiceQuestion, DragOrderQuestion } from '../types'

// ─── Certificate types ────────────────────────────────────────────────────────
export interface CertType {
  name: string
  full: string
  description: string
  useCase: string
  color: string
}

export const CERT_TYPES: Record<string, CertType> = {
  'DV':          { name: 'DV',          full: 'Domain Validated',      description: 'Proves domain ownership only. Fastest and cheapest. Browser padlock, no org info.',        useCase: 'Personal sites, non-sensitive HTTPS, dev environments.', color: 'var(--c-green)' },
  'OV':          { name: 'OV',          full: 'Organization Validated', description: 'Proves domain + organization identity. Org name visible in cert details.',                  useCase: 'Business websites, internal portals.', color: 'var(--c-cyan)' },
  'EV':          { name: 'EV',          full: 'Extended Validation',    description: 'Highest-vetting cert. Org name prominently shown. Builds maximum customer trust.',            useCase: 'Banking, financial institutions, e-commerce checkout.', color: 'var(--c-amber)' },
  'Wildcard':    { name: 'Wildcard',    full: 'Wildcard Certificate',   description: '*.example.com — secures all direct subdomains with one cert. One level deep only.',         useCase: 'Many subdomains on same domain: mail.x.com, shop.x.com, blog.x.com.', color: 'var(--c-violet)' },
  'SAN':         { name: 'SAN',         full: 'Subject Alternative Name (Multi-Domain)', description: 'One cert covers multiple distinct domain names via SANs.',                  useCase: 'Different FQDNs on same server: example.com, api.example.com, example.net.', color: 'var(--c-blue)' },
  'Code Signing':{ name: 'Code Signing',full: 'Code Signing Certificate','description': 'Signs executable code so users can verify publisher identity and file integrity.',          useCase: 'Windows executables, macOS apps, software updates, drivers.', color: 'var(--c-orange)' },
  'Self-Signed': { name: 'Self-Signed', full: 'Self-Signed Certificate', description: 'Signed by its own private key, not a trusted CA. Browsers show warning.',                  useCase: 'Internal testing, lab environments, internal services where you control trust store.', color: 'var(--c-pink)' },
}

// ─── Cert-type selection scenarios ────────────────────────────────────────────
export const PKI_CERT_SCENARIOS: MultipleChoiceQuestion[] = [
  {
    id: 'pki-ct-01',
    kind: 'multiple-choice',
    prompt: 'An online bank wants the highest-trust HTTPS certificate to reassure customers during checkout. The certificate should display the company name and be recognized by all browsers.',
    options: ['EV', 'DV', 'OV', 'Wildcard'],
    correctIndex: 0,
    explanation: 'Extended Validation (EV) certificates require the most rigorous identity vetting by the CA. They prominently display the organization name in cert details and trigger enhanced browser indicators. Financial institutions use EV to maximize customer trust. DV only proves domain ownership; OV shows org name but with less vetting than EV.',
  },
  {
    id: 'pki-ct-02',
    kind: 'multiple-choice',
    prompt: 'A company hosts mail.example.com, shop.example.com, blog.example.com, and api.example.com and wants to secure all of them with a single certificate.',
    options: ['Wildcard', 'SAN', 'EV', 'Code Signing'],
    correctIndex: 0,
    explanation: 'A Wildcard certificate (*.example.com) secures all direct subdomains of a domain with one cert. This is the simplest solution when all hosts share the same parent domain. A SAN/multi-domain cert would also work but is typically used when the hostnames span different base domains.',
  },
  {
    id: 'pki-ct-03',
    kind: 'multiple-choice',
    prompt: 'A software company ships a Windows installer. Users are seeing "Unknown Publisher" warnings when running the setup.exe. What certificate type resolves this?',
    options: ['Code Signing', 'EV', 'SAN', 'Self-Signed'],
    correctIndex: 0,
    explanation: 'A Code Signing certificate is issued to a software publisher and used to digitally sign executable code. When applied to setup.exe, Windows verifies the signature and displays the verified publisher name instead of "Unknown Publisher." EV is for websites; SAN is for multiple domains; Self-Signed would not be trusted by the OS.',
  },
  {
    id: 'pki-ct-04',
    kind: 'multiple-choice',
    prompt: 'A new SaaS product needs HTTPS for three different hostnames: app.product.com, api.product.com, and www.product.io (a different TLD). One certificate should cover all three.',
    options: ['SAN', 'Wildcard', 'DV', 'OV'],
    correctIndex: 0,
    explanation: 'A Subject Alternative Name (SAN) or Multi-Domain certificate can list multiple distinct FQDNs regardless of domain or TLD. A Wildcard only covers subdomains of one domain and cannot cover product.io. When hostnames span different base domains, SAN is the correct choice.',
  },
  {
    id: 'pki-ct-05',
    kind: 'multiple-choice',
    prompt: 'A developer needs HTTPS on an internal testing server that is not publicly accessible. No users outside the team will access it. Speed and zero cost are priorities.',
    options: ['Self-Signed', 'DV', 'EV', 'Code Signing'],
    correctIndex: 0,
    explanation: 'For internal/lab environments where you control the machines and trust store, a Self-Signed certificate is acceptable. You can add it to the trusted cert store of test machines manually. Using a public CA for an internal server is unnecessary overhead. DV is the cheapest public cert but still requires domain validation and is pointless for a non-public host.',
  },
  {
    id: 'pki-ct-06',
    kind: 'multiple-choice',
    prompt: 'A mid-size business wants HTTPS with their organization\'s name verifiable in the certificate. Budget is moderate. No need for the premium trust indicator of financial sites.',
    options: ['OV', 'EV', 'DV', 'Wildcard'],
    correctIndex: 0,
    explanation: 'Organization Validated (OV) certificates verify both domain ownership and the organization\'s legal existence. The company name appears in cert details, providing a moderate trust signal. OV sits between free DV (no org verification) and expensive EV (maximum vetting). It is the standard choice for established businesses.',
  },
]

// ─── Certificate issue identification ─────────────────────────────────────────
export interface CertIssueScenario extends MultipleChoiceQuestion {
  certDisplay: Array<{ field: string; value: string; flagged?: boolean }>
}

export const PKI_ISSUE_SCENARIOS: CertIssueScenario[] = [
  {
    id: 'pki-is-01',
    kind: 'multiple-choice',
    prompt: 'A user visits https://secure.example.com and receives a browser warning. Examine the certificate details below — what is the primary issue?',
    certDisplay: [
      { field: 'Issued To',   value: 'secure.example.com' },
      { field: 'Issued By',   value: 'secure.example.com', flagged: true },
      { field: 'Valid From',  value: '2024-01-01' },
      { field: 'Valid To',    value: '2026-01-01' },
      { field: 'Signature',   value: 'SHA-256 with RSA' },
    ],
    options: ['Self-Signed Certificate (untrusted CA)', 'Certificate Expired', 'Hostname Mismatch', 'Weak Key Size'],
    correctIndex: 0,
    explanation: 'The Issued By field matches the Issued To field — the certificate signed itself. A self-signed cert has no chain of trust to a trusted root CA. Browsers maintain a list of trusted CAs; since this CA is unknown, the browser warns the user. Fix: obtain a certificate from a trusted public CA.',
  },
  {
    id: 'pki-is-02',
    kind: 'multiple-choice',
    prompt: 'An e-commerce site triggers a browser warning during checkout. What is wrong with this certificate?',
    certDisplay: [
      { field: 'Issued To',   value: 'www.shop.example.com' },
      { field: 'Issued By',   value: 'Let\'s Encrypt R3' },
      { field: 'Valid From',  value: '2023-01-15' },
      { field: 'Valid To',    value: '2023-04-15', flagged: true },
      { field: 'Today',       value: '2025-09-20', flagged: true },
    ],
    options: ['Certificate Expired', 'Self-Signed Certificate', 'Hostname Mismatch', 'Revoked Certificate'],
    correctIndex: 0,
    explanation: 'The certificate expired on 2023-04-15 but today is 2025-09-20 — over two years past expiry. Expired certificates should not be trusted; the server\'s identity can no longer be verified for the current period. Fix: renew and reinstall the certificate. Let\'s Encrypt certs expire every 90 days and should be auto-renewed.',
  },
  {
    id: 'pki-is-03',
    kind: 'multiple-choice',
    prompt: 'A user navigates to https://api.example.com and receives a warning. The cert details are shown below. What is the issue?',
    certDisplay: [
      { field: 'Issued To',      value: 'www.example.com', flagged: true },
      { field: 'SAN',            value: 'www.example.com, example.com', flagged: true },
      { field: 'Accessing URL',  value: 'api.example.com', flagged: true },
      { field: 'Issued By',      value: 'DigiCert Global CA' },
      { field: 'Valid To',       value: '2026-06-01' },
    ],
    options: ['Hostname Mismatch', 'Certificate Expired', 'Self-Signed Certificate', 'Missing CRL'],
    correctIndex: 0,
    explanation: 'The certificate covers www.example.com and example.com (in the SAN field) but the user is accessing api.example.com. No SAN entry or wildcard covers the api subdomain. This is a hostname mismatch — the cert was issued for different FQDNs. Fix: reissue the cert with api.example.com added to the SAN list, or get a wildcard cert (*.example.com).',
  },
  {
    id: 'pki-is-04',
    kind: 'multiple-choice',
    prompt: 'A browser shows a "certificate chain incomplete" error for a corporate internal app. The cert details show a valid end-entity cert and a trusted root CA, but the browser cannot validate. What is missing?',
    certDisplay: [
      { field: 'End-Entity Cert', value: 'intranet.corp.local — valid' },
      { field: 'Intermediate CA', value: 'NOT PRESENT', flagged: true },
      { field: 'Root CA',         value: 'Corporate Root CA — trusted' },
      { field: 'Chain Status',    value: 'INCOMPLETE', flagged: true },
    ],
    options: ['Missing Intermediate Certificate', 'Certificate Expired', 'Hostname Mismatch', 'Weak Signature Algorithm'],
    correctIndex: 0,
    explanation: 'Certificate chains require every link: Root CA → Intermediate CA(s) → End-Entity cert. Browsers trust root CAs but the server must send the full chain including intermediates. If the intermediate is absent, the browser cannot build a trusted path to the root CA even if it trusts that root. Fix: configure the web server to include the intermediate certificate(s) in the certificate bundle.',
  },
  {
    id: 'pki-is-05',
    kind: 'multiple-choice',
    prompt: 'A web application needs to check in real time whether a certificate is still valid when a user connects, without downloading a large file. Which revocation mechanism is used?',
    certDisplay: [
      { field: 'Revocation Method A', value: 'CRL — Certificate Revocation List',        flagged: false },
      { field: 'CRL Detail',          value: 'Published by CA, downloaded periodically, can be MBs in size', flagged: false },
      { field: 'Revocation Method B', value: 'OCSP — Online Certificate Status Protocol', flagged: false },
      { field: 'OCSP Detail',         value: 'Real-time per-cert query to OCSP responder, small response', flagged: false },
    ],
    options: ['OCSP', 'CRL', 'CA Revocation DB', 'Certificate Pinning'],
    correctIndex: 0,
    explanation: 'OCSP (Online Certificate Status Protocol) provides real-time certificate status checks — the client sends a request for a specific certificate\'s serial number and the OCSP responder returns "good", "revoked", or "unknown." CRLs (Certificate Revocation Lists) are large files published periodically — they can be MB in size, introduce latency, and are typically cached (meaning revocation is not instantaneous). OCSP Stapling improves on basic OCSP by having the server cache the signed OCSP response and "staple" it to the TLS handshake.',
  },
  {
    id: 'pki-is-06',
    kind: 'multiple-choice',
    prompt: 'A mobile banking app hardcodes the exact public key or certificate of its backend server. When the server\'s certificate is renewed, users report the app stops working. What mechanism caused this?',
    certDisplay: [
      { field: 'Certificate',         value: 'api.bank.com — renewed cert (new key pair)', flagged: false },
      { field: 'App Behavior',        value: 'Rejects connection — certificate does not match hardcoded value', flagged: true },
      { field: 'Expected Mechanism',  value: 'Certificate pinning — only the exact expected cert/key is trusted', flagged: false },
    ],
    options: ['Certificate Pinning', 'CRL Check Failed', 'OCSP Stapling Error', 'Self-Signed Certificate'],
    correctIndex: 0,
    explanation: 'Certificate pinning associates a specific certificate or public key with a host, bypassing normal CA chain validation. It provides strong protection against rogue CAs issuing fraudulent certificates for your domain. The downside: when the certificate is legitimately renewed (which it must be periodically), the old pinned value no longer matches — the app breaks until updated. This is why certificate pinning requires careful lifecycle management and is increasingly replaced by HPKP alternatives or is done at the OS/framework level.',
  },
]

// ─── TLS Handshake ordering ───────────────────────────────────────────────────
export const TLS_HANDSHAKE_STEPS = [
  'Client Hello',
  'Server Hello',
  'Server Certificate',
  'Server Hello Done',
  'Client Key Exchange',
  'Client: Change Cipher Spec',
  'Client: Finished',
  'Server: Change Cipher Spec',
  'Server: Finished',
]

export const TLS_HANDSHAKE_DESCRIPTIONS: Record<string, string> = {
  'Client Hello':             'Client sends supported TLS versions, cipher suites, compression methods, and a random nonce.',
  'Server Hello':             'Server selects TLS version and cipher suite from client\'s list, sends its own random nonce.',
  'Server Certificate':       'Server sends its X.509 certificate for client to verify identity.',
  'Server Hello Done':        'Server signals it has finished the hello phase and awaits client response.',
  'Client Key Exchange':      'Client sends pre-master secret encrypted with server\'s public key (RSA) or DH key share.',
  'Client: Change Cipher Spec': 'Client notifies: subsequent messages will use negotiated encryption.',
  'Client: Finished':         'First encrypted message. Contains hash of all handshake messages for integrity verification.',
  'Server: Change Cipher Spec': 'Server notifies: switching to negotiated encryption.',
  'Server: Finished':         'Server\'s first encrypted message. Handshake complete — application data begins.',
}

export const TLS_HANDSHAKE_QUESTION: DragOrderQuestion = {
  id: 'pki-tls-01',
  kind: 'drag-order',
  prompt: 'Order the TLS 1.2 handshake steps from first to last.',
  items: TLS_HANDSHAKE_STEPS,
  explanation: 'TLS 1.2 handshake: ClientHello → ServerHello → Certificate → ServerHelloDone → ClientKeyExchange → [Client] ChangeCipherSpec + Finished → [Server] ChangeCipherSpec + Finished. Key point: the client verifies the server cert before sending the pre-master secret. Both sides derive session keys independently using the two random nonces + pre-master secret.',
}

// ─── All PKI questions pool ───────────────────────────────────────────────────
export const ALL_PKI_QUESTIONS = [...PKI_CERT_SCENARIOS, ...PKI_ISSUE_SCENARIOS, TLS_HANDSHAKE_QUESTION]
