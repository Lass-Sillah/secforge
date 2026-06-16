export interface AttackEntry {
  name: string
  description: string
  category: 'network' | 'credential' | 'web' | 'social' | 'malware' | 'crypto'
}

export const ATTACKS: AttackEntry[] = [
  // Network
  { name: 'On-Path (MITM)',      category: 'network',    description: 'Attacker intercepts and potentially alters communication between two parties without their knowledge.' },
  { name: 'Replay Attack',       category: 'network',    description: 'Valid captured data (e.g., auth token) is re-transmitted to impersonate a legitimate user.' },
  { name: 'Downgrade Attack',    category: 'network',    description: 'Forces a system to negotiate a weaker, older, or less secure protocol version.' },
  { name: 'DDoS',                category: 'network',    description: 'Distributed Denial of Service — many sources flood a target to exhaust resources and deny access.' },
  { name: 'ARP Poisoning',       category: 'network',    description: 'Sends fake ARP replies to link an attacker\'s MAC to a legitimate IP, enabling interception.' },
  { name: 'DNS Poisoning',       category: 'network',    description: 'Corrupts DNS cache so domain names resolve to attacker-controlled IP addresses.' },

  // Credential attacks
  { name: 'Brute Force',         category: 'credential', description: 'Systematically tries every possible password combination until the correct one is found.' },
  { name: 'Dictionary Attack',   category: 'credential', description: 'Uses a wordlist of common/likely passwords rather than trying every character combination.' },
  { name: 'Password Spraying',   category: 'credential', description: 'Tries one or a few common passwords across many accounts to avoid lockout thresholds.' },
  { name: 'Rainbow Table',       category: 'credential', description: 'Precomputed hash-to-password table that trades storage for speed when cracking hashed passwords.' },
  { name: 'Pass-the-Hash',       category: 'credential', description: 'Uses a stolen NTLM hash directly to authenticate without knowing the plaintext password.' },
  { name: 'Credential Stuffing', category: 'credential', description: 'Automates testing of username/password pairs leaked from other breaches against new services.' },
  { name: 'Privilege Escalation',category: 'credential', description: 'Exploits a vulnerability or misconfiguration to gain higher access rights than initially granted.' },
  { name: 'Kerberoasting',       category: 'credential', description: 'Requests Kerberos service tickets and cracks them offline to reveal service account passwords.' },

  // Web
  { name: 'XSS',                 category: 'web',        description: 'Cross-Site Scripting — injects malicious scripts into pages viewed by other users.' },
  { name: 'SQL Injection',       category: 'web',        description: 'Inserts SQL statements into an input field to manipulate the backend database query.' },
  { name: 'CSRF',                category: 'web',        description: 'Cross-Site Request Forgery — tricks a logged-in user\'s browser into sending an unintended request.' },
  { name: 'Directory Traversal', category: 'web',        description: 'Uses ../ sequences to access files outside the web server\'s root directory.' },
  { name: 'SSRF',                category: 'web',        description: 'Server-Side Request Forgery — makes the server send requests to internal resources on behalf of attacker.' },

  // Social engineering
  { name: 'Phishing',            category: 'social',     description: 'Mass fraudulent email campaign posing as a legitimate entity to steal credentials or install malware.' },
  { name: 'Spear Phishing',      category: 'social',     description: 'Targeted phishing personalised with victim-specific information to increase credibility.' },
  { name: 'Whaling',             category: 'social',     description: 'Spear phishing targeting high-profile executives (CEOs, CFOs) for large financial or data theft.' },
  { name: 'Vishing',             category: 'social',     description: 'Voice phishing — uses phone calls to impersonate IT support, banks, or government agencies.' },
  { name: 'Smishing',            category: 'social',     description: 'SMS phishing — malicious links or urgency-based lures delivered via text message.' },
  { name: 'Pretexting',          category: 'social',     description: 'Attacker fabricates a believable scenario (e.g., being IT support) to extract information.' },
  { name: 'Baiting',             category: 'social',     description: 'Leaves infected media (USB drives) for victims to find and plug in, triggering malware.' },
  { name: 'Tailgating',          category: 'social',     description: 'Physically follows an authorized person through a secured door without their awareness.' },

  // Social (continued)
  { name: 'Business Email Compromise', category: 'social', description: 'Impersonates a CEO or vendor via email to authorize fraudulent wire transfers or data releases.' },
  { name: 'Shoulder Surfing',    category: 'social',     description: 'Physically observes a victim\'s screen or keyboard to steal credentials or sensitive information.' },
  { name: 'AI-Driven Phishing',  category: 'social',     description: 'Uses generative AI to craft hyper-personalized phishing content at scale — including deepfake voice/video calls impersonating executives. Harder to detect than template-based phishing.' },
  { name: 'Deepfake Vishing',    category: 'social',     description: 'Real-time AI voice cloning of a trusted person (executive, IT admin) to manipulate victims into transferring funds or revealing credentials. Bypasses caller-ID verification.' },

  // Network (additional)
  { name: 'VLAN Hopping',        category: 'network',    description: 'Attacker on one VLAN sends traffic to another via switch spoofing or double-tagging. Mitigated by disabling dynamic trunk negotiation and using an unused native VLAN.' },
  { name: 'SSL Stripping',       category: 'network',    description: 'Downgrades an HTTPS connection to HTTP in a MitM position. Mitigated by HSTS (HTTP Strict Transport Security).' },
  { name: 'Evil Twin AP',        category: 'network',    description: 'Rogue Wi-Fi access point mimicking a legitimate SSID. Victims connect and traffic is intercepted. Paired with deauthentication attacks to force reconnection.' },
  { name: 'Deauthentication',    category: 'network',    description: 'Sends forged 802.11 deauth frames to disconnect clients from a legitimate AP. Unprotected by default in WPA2; mitigated by WPA3 Protected Management Frames (PMF).' },
  { name: 'DDoS — Volumetric',   category: 'network',    description: 'Floods bandwidth with traffic (UDP flood, ICMP flood, DNS amplification). Goal: saturate network capacity. Mitigated by upstream scrubbing, CDN, and rate limiting.' },
  { name: 'DDoS — Protocol',     category: 'network',    description: 'Exploits weaknesses in Layer 3/4 protocols (SYN flood exhausts TCP state tables; Smurf attack uses ICMP broadcast amplification). Targets firewalls and load balancers.' },
  { name: 'DDoS — Application',  category: 'network',    description: 'Targets Layer 7 services with legitimate-looking requests (HTTP GET/POST flood, Slowloris). Harder to filter — traffic appears valid. Mitigated by WAF rate limiting and CAPTCHA.' },

  // Supply chain & advanced
  { name: 'Supply Chain Attack', category: 'network',    description: 'Compromises a trusted vendor or software dependency to inject malicious code into downstream targets.' },
  { name: 'Watering Hole',       category: 'network',    description: 'Infects websites frequently visited by a specific target group — victims are compromised by browsing.' },
  { name: 'Zero-Day Exploit',    category: 'network',    description: 'Exploits an unknown vulnerability before a patch exists — vendor has zero days to respond.' },

  // Malware
  { name: 'Ransomware',          category: 'malware',    description: 'Encrypts victim\'s files and demands payment for the decryption key.' },
  { name: 'Rootkit',             category: 'malware',    description: 'Hides malicious software at the OS or firmware level, often surviving reboots.' },
  { name: 'Keylogger',           category: 'malware',    description: 'Records keystrokes to capture credentials, credit card numbers, and sensitive data.' },
  { name: 'RAT',                 category: 'malware',    description: 'Remote Access Trojan — gives attacker persistent covert control of a compromised system.' },
  { name: 'Cryptojacking',       category: 'malware',    description: 'Hijacks victim\'s CPU/GPU to secretly mine cryptocurrency — slows systems and raises power costs.' },
  { name: 'Fileless Malware',    category: 'malware',    description: 'Runs entirely in memory using legitimate OS tools (PowerShell, WMI) — leaves no files on disk to detect.' },
  { name: 'Logic Bomb',          category: 'malware',    description: 'Dormant code that triggers a malicious payload when a specific condition is met (date, login, file deletion).' },
  { name: 'Worm',                category: 'malware',    description: 'Self-replicating malware that spreads across networks without user interaction, consuming bandwidth and resources.' },
]

export interface ThreatActorAttribute {
  actor: string
  capability: string
  resources: string
  sophistication: string
  motivation: string
}

export const THREAT_ACTORS: ThreatActorAttribute[] = [
  { actor: 'Script Kiddie',      capability: 'Low',    resources: 'Low',    sophistication: 'Low',    motivation: 'Notoriety / curiosity' },
  { actor: 'Hacktivist',         capability: 'Medium', resources: 'Medium', sophistication: 'Medium', motivation: 'Political / ideological agenda' },
  { actor: 'Organized Crime',    capability: 'High',   resources: 'High',   sophistication: 'High',   motivation: 'Financial gain' },
  { actor: 'Nation-State APT',   capability: 'Very High', resources: 'Very High', sophistication: 'Very High', motivation: 'Espionage / disruption / warfare' },
  { actor: 'Insider Threat',     capability: 'Medium', resources: 'Medium', sophistication: 'Medium', motivation: 'Revenge / financial / accidental' },
]
