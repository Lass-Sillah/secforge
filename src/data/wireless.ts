import type { MultipleChoiceQuestion } from '../types'

export interface WifiProtocol {
  name: string
  full: string
  keyFact: string
  color: string
}

export const WIFI_PROTOCOLS: Record<string, WifiProtocol> = {
  'WPA2-Personal':    { name: 'WPA2-Personal',    full: 'WPA2-PSK (IEEE 802.11i)',                  keyFact: 'Shared pre-shared key. CCMP/AES encryption. Home & SOHO.',          color: 'var(--c-cyan)' },
  'WPA2-Enterprise':  { name: 'WPA2-Enterprise',  full: 'WPA2 + 802.1X / RADIUS',                  keyFact: 'Per-user credentials via RADIUS. Revocable per user. Enterprise.',  color: 'var(--c-blue)' },
  'WPA3-Personal':    { name: 'WPA3-Personal',     full: 'WPA3-SAE (Simultaneous Auth of Equals)',  keyFact: 'Replaces PSK handshake. Forward secrecy. Resistant to offline dict attacks.', color: 'var(--c-green)' },
  'WPA3-Enterprise':  { name: 'WPA3-Enterprise',   full: 'WPA3 + 802.1X (192-bit mode)',            keyFact: '192-bit CNSA Suite cryptography. Government & military.',           color: 'var(--c-violet)' },
  'EAP-TLS':          { name: 'EAP-TLS',           full: 'EAP Transport Layer Security',            keyFact: 'BOTH client and server use X.509 certificates. Strongest EAP. Requires PKI.', color: 'var(--c-pink)' },
  'PEAP':             { name: 'PEAP',              full: 'Protected EAP (with MS-CHAPv2)',          keyFact: 'Server cert only. Client uses username/password inside TLS tunnel. Most common.', color: 'var(--c-amber)' },
  'EAP-TTLS':         { name: 'EAP-TTLS',          full: 'EAP Tunneled TLS',                        keyFact: 'Like PEAP. Server cert + TLS tunnel. Supports legacy PAP/CHAP inside.', color: 'var(--c-orange)' },
  'EAP-FAST':         { name: 'EAP-FAST',          full: 'EAP Flexible Auth via Secure Tunneling',  keyFact: 'Cisco proprietary. Uses PAC files. No certs required. Legacy.',     color: 'var(--c-dim)' },
  'WEP':              { name: 'WEP',               full: 'Wired Equivalent Privacy',               keyFact: 'RC4 stream cipher. 24-bit IV. Crackable in minutes. DEPRECATED.',    color: 'var(--c-pink)' },
  'TKIP':             { name: 'TKIP',              full: 'Temporal Key Integrity Protocol',         keyFact: 'WPA1 encryption. 128-bit RC4. Deprecated — use AES/CCMP instead.',   color: 'var(--c-dim)' },
}

export const WIRELESS_QUESTIONS: MultipleChoiceQuestion[] = [
  {
    id: 'wl-01',
    kind: 'multiple-choice',
    prompt: 'A small law firm of 8 employees needs WiFi. They have no RADIUS server and no IT staff to manage per-user credentials. Which Wi-Fi security standard is appropriate?',
    options: ['WPA2-Personal', 'WPA2-Enterprise', 'WPA3-Enterprise', 'EAP-TLS'],
    correctIndex: 0,
    explanation: 'WPA2-Personal (PSK) uses a single shared password, requiring no authentication server. It is appropriate for small environments where managing individual credentials would be impractical. The trade-off: if the PSK is leaked, all users must change it. WPA2-Enterprise requires a RADIUS server; WPA3-Enterprise requires RADIUS + 192-bit hardware; EAP-TLS requires a full PKI.',
  },
  {
    id: 'wl-02',
    kind: 'multiple-choice',
    prompt: 'A hospital with 2,000 staff needs WiFi authentication where IT can immediately revoke access for any individual without affecting other users, and each person uses their own credentials.',
    options: ['WPA2-Enterprise', 'WPA2-Personal', 'WPA3-Personal', 'EAP-FAST'],
    correctIndex: 0,
    explanation: 'WPA2-Enterprise uses 802.1X with a RADIUS back-end. Each user authenticates individually — compromised or departed users can be revoked in RADIUS/AD without changing a shared key. This is the only standard that supports per-user identity in an enterprise WiFi context. WPA2-Personal uses a shared key that must be rotated for everyone if one user is revoked.',
  },
  {
    id: 'wl-03',
    kind: 'multiple-choice',
    prompt: 'A home user is concerned their WPA2-Personal WiFi password could be captured in a handshake and cracked offline using a dictionary attack. Which upgrade addresses this specifically?',
    options: ['WPA3-Personal', 'WPA2-Enterprise', 'WPA3-Enterprise', 'TKIP'],
    correctIndex: 0,
    explanation: 'WPA3-Personal replaces the WPA2-PSK 4-way handshake with SAE (Simultaneous Authentication of Equals), a Password Authenticated Key Exchange (PAKE) protocol. SAE does not transmit data that can be captured and attacked offline — even if traffic is captured, the key cannot be brute-forced later. This is the direct fix for offline dictionary attack vulnerability.',
  },
  {
    id: 'wl-04',
    kind: 'multiple-choice',
    prompt: 'A US intelligence agency requires WiFi meeting CNSA Suite B cryptographic standards with 192-bit minimum security. Which standard meets this requirement?',
    options: ['WPA3-Enterprise', 'WPA2-Enterprise', 'WPA3-Personal', 'EAP-TLS'],
    correctIndex: 0,
    explanation: 'WPA3-Enterprise\'s 192-bit mode (Suite B) uses GCMP-256 for encryption, HMAC-SHA-384 for auth, and 384-bit elliptic curve keys — meeting CNSA Suite B requirements mandated for US government classified systems. WPA2-Enterprise uses 128-bit AES which does not meet the 192-bit requirement.',
  },
  {
    id: 'wl-05',
    kind: 'multiple-choice',
    prompt: 'A security team wants the most secure EAP method for 802.1X. The company already has a PKI and can issue certificates to every device. Both the RADIUS server and the client device must prove identity via certificate.',
    options: ['EAP-TLS', 'PEAP', 'EAP-TTLS', 'EAP-FAST'],
    correctIndex: 0,
    explanation: 'EAP-TLS requires both the client and server to present X.509 certificates — mutual authentication. It is the strongest EAP method because it eliminates password-based attacks entirely. The trade-off is operational: you need PKI infrastructure and must distribute client certs to every device. If PKI exists and max security is needed, EAP-TLS is the answer.',
  },
  {
    id: 'wl-06',
    kind: 'multiple-choice',
    prompt: 'A company wants 802.1X WiFi authentication but has no PKI. Employees authenticate using their Active Directory username and password. Which EAP method fits?',
    options: ['PEAP', 'EAP-TLS', 'EAP-FAST', 'WPA2-Personal'],
    correctIndex: 0,
    explanation: 'PEAP (Protected EAP) requires only a server certificate (for TLS tunnel establishment). Inside the TLS tunnel, the client authenticates using credentials like AD username/password (typically via MS-CHAPv2). No client certificates or PKI distribution to end-users is required — just AD credentials. This is the most common enterprise EAP deployment.',
  },
  {
    id: 'wl-07',
    kind: 'multiple-choice',
    prompt: 'An organization is migrating to 802.1X but still has legacy devices that only support PAP for authentication. A RADIUS server is available. Which EAP method supports PAP inside its tunnel?',
    options: ['EAP-TTLS', 'PEAP', 'EAP-TLS', 'WPA2-Enterprise'],
    correctIndex: 0,
    explanation: 'EAP-TTLS creates a TLS tunnel (server cert only, like PEAP) but allows arbitrary legacy protocols — including PAP, CHAP, MS-CHAPv2 — inside the tunnel. PEAP can only carry EAP methods inside its tunnel and does not natively support PAP. EAP-TTLS was designed specifically for environments with legacy auth protocol constraints.',
  },
  {
    id: 'wl-08',
    kind: 'multiple-choice',
    prompt: 'A security audit reveals the corporate WiFi uses RC4 encryption with a 24-bit initialization vector. What is the immediate risk and the correct remediation?',
    options: ['WEP — crackable in minutes; upgrade to WPA2/WPA3', 'TKIP — slightly outdated; upgrade to AES', 'WPA2 — 802.11i weakness; apply patch', 'WPA3 — known downgrade attack; disable legacy'],
    correctIndex: 0,
    explanation: 'RC4 with a 24-bit IV is WEP (Wired Equivalent Privacy). The small IV space means IVs are rapidly reused, and passive capture of sufficient traffic allows an attacker to recover the key in minutes using tools like aircrack-ng. WEP has been deprecated since 2004. Immediate remediation: disable WEP and configure WPA2-Personal (minimum) or WPA2-Enterprise.',
  },
  {
    id: 'wl-09',
    kind: 'multiple-choice',
    prompt: 'During a wireless survey, a security analyst finds two access points with the same SSID "CorpWiFi" but different BSSIDs (MAC addresses). One was not installed by IT. What is this attack?',
    options: ['Evil Twin / Rogue AP', 'Deauth Flood (DoS)', 'Replay Attack', 'Beacon Flood'],
    correctIndex: 0,
    explanation: 'An Evil Twin is a rogue access point broadcasting the same SSID as the legitimate AP. Clients may connect to it (especially if signal is stronger), enabling credential theft via a captive portal or MITM attack on cleartext traffic. Detection: wireless survey tools identifying duplicate SSIDs with unexpected BSSIDs. Mitigation: 802.1X (clients only trust the network if RADIUS validates the AP) and AP monitoring tools.',
  },
  {
    id: 'wl-10',
    kind: 'multiple-choice',
    prompt: 'A company\'s 802.1X WiFi uses PEAP. An employee reports their laptop shows a certificate warning when connecting to the corporate network. What should be checked first?',
    options: ['Server certificate on RADIUS is expired or untrusted', 'Client certificate has expired', 'EAP-TLS misconfiguration', 'WPA3 incompatibility'],
    correctIndex: 0,
    explanation: 'PEAP establishes a TLS tunnel using only the RADIUS server\'s certificate. A certificate warning means the client cannot validate the server cert — it may be expired, self-signed without the root CA installed on the client, or revoked. Check the RADIUS server certificate validity and ensure the issuing CA is in the client trust store. In PEAP there is no client cert to expire — that would be EAP-TLS.',
  },
]
