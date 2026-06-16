export type PortCategory = 'file' | 'secure' | 'mail' | 'web' | 'auth' | 'core' | 'db' | 'mgmt'

export const CATEGORY_COLORS: Record<PortCategory, string> = {
  file:   '#60a5fa',
  secure: '#4ade80',
  mail:   '#a78bfa',
  web:    '#22d3ee',
  auth:   '#fbbf24',
  core:   '#fb923c',
  db:     '#f472b6',
  mgmt:   '#5a6b72',
}

export interface PortEntry {
  protocol: string
  port: string | number
  note: string
  category: PortCategory
  secureReplacement?: string // protocol that replaces this one
  insecureFor?: string       // this is the secure version of what insecure protocol?
}

export const PORT_LIST: PortEntry[] = [
  // File transfer
  { protocol: 'FTP (data)',    port: 20,       note: 'File Transfer Protocol – data channel',              category: 'file' },
  { protocol: 'FTP (control)',  port: 21,       note: 'File Transfer Protocol – control channel',           category: 'file' },
  { protocol: 'TFTP',          port: 69,       note: 'Trivial FTP – UDP, no auth, firmware/PXE boot',      category: 'file' },
  { protocol: 'SMB',           port: 445,      note: 'Server Message Block – Windows file shares',         category: 'file' },
  { protocol: 'NetBIOS',       port: '137-139',note: 'Legacy Windows name resolution + session service',   category: 'file' },

  // Secure shell / remote
  { protocol: 'SSH',           port: 22,       note: 'Secure Shell – encrypted remote access',             category: 'secure', insecureFor: 'Telnet' },
  { protocol: 'SFTP',          port: 22,       note: 'SSH File Transfer Protocol – runs over SSH',         category: 'secure' },
  { protocol: 'SCP',           port: 22,       note: 'Secure Copy Protocol – runs over SSH',               category: 'secure' },
  { protocol: 'Telnet',        port: 23,       note: 'Unencrypted remote access – DEPRECATED',             category: 'mgmt',  secureReplacement: 'SSH' },
  { protocol: 'RDP',           port: 3389,     note: 'Remote Desktop Protocol – Windows remote desktop',   category: 'secure' },
  { protocol: 'SIP',           port: '5060/5061', note: 'Session Initiation Protocol – VoIP (5061=TLS)',   category: 'secure' },

  // Web
  { protocol: 'HTTP',          port: 80,       note: 'Hypertext Transfer Protocol – unencrypted web',      category: 'web',   secureReplacement: 'HTTPS' },
  { protocol: 'HTTPS',         port: 443,      note: 'HTTP over TLS – encrypted web traffic',              category: 'web',   insecureFor: 'HTTP' },

  // Mail
  { protocol: 'SMTP',          port: 25,       note: 'Simple Mail Transfer – server-to-server sending',    category: 'mail',  secureReplacement: 'SMTPS' },
  { protocol: 'SMTPS',         port: '465/587',note: 'SMTP over TLS/STARTTLS – secure mail sending',       category: 'mail',  insecureFor: 'SMTP' },
  { protocol: 'POP3',          port: 110,      note: 'Post Office Protocol v3 – download & delete mail',   category: 'mail',  secureReplacement: 'POP3S' },
  { protocol: 'POP3S',         port: 995,      note: 'POP3 over TLS',                                      category: 'mail',  insecureFor: 'POP3' },
  { protocol: 'IMAP',          port: 143,      note: 'Internet Message Access – mail sync (server-side)',   category: 'mail',  secureReplacement: 'IMAPS' },
  { protocol: 'IMAPS',         port: 993,      note: 'IMAP over TLS',                                      category: 'mail',  insecureFor: 'IMAP' },

  // Auth / directory
  { protocol: 'LDAP',          port: 389,      note: 'Lightweight Directory Access Protocol – unencrypted', category: 'auth', secureReplacement: 'LDAPS' },
  { protocol: 'LDAPS',         port: 636,      note: 'LDAP over TLS',                                       category: 'auth', insecureFor: 'LDAP' },
  { protocol: 'Kerberos',      port: 88,       note: 'Kerberos ticket-based authentication',                category: 'auth' },
  { protocol: 'RADIUS',        port: '1812/1813', note: 'Remote Auth Dial-In – auth + accounting',         category: 'auth' },
  { protocol: 'TACACS+',       port: 49,       note: 'Terminal Access Controller – full packet encryption', category: 'auth' },

  // Core infrastructure
  { protocol: 'DNS',           port: 53,       note: 'Domain Name System – TCP+UDP',                        category: 'core' },
  { protocol: 'DHCP',          port: '67/68',  note: 'Dynamic Host Config – 67=server 68=client',           category: 'core' },
  { protocol: 'NTP',           port: 123,      note: 'Network Time Protocol – time sync',                   category: 'core' },

  // VPN / tunneling
  { protocol: 'IPSec/IKE',     port: '500',    note: 'Internet Key Exchange – negotiates IPsec SA (UDP)',    category: 'secure' },
  { protocol: 'IPSec/NAT-T',   port: '4500',   note: 'IKE + ESP when NAT is present (UDP)',                  category: 'secure' },
  { protocol: 'FTPS',          port: '990',    note: 'FTP over TLS – explicit mode also uses 21',            category: 'secure', insecureFor: 'FTP (control)' },

  // Secure infrastructure upgrades
  { protocol: 'DoT',           port: '853',    note: 'DNS over TLS – encrypts DNS queries (TCP)',            category: 'core',   insecureFor: 'DNS' },
  { protocol: 'Syslog-TLS',    port: '6514',   note: 'Syslog over TLS – encrypted log forwarding',          category: 'mgmt',   insecureFor: 'Syslog' },

  // Routing
  { protocol: 'BGP',           port: '179',    note: 'Border Gateway Protocol – inter-AS internet routing (TCP)', category: 'core' },

  // Monitoring / management
  { protocol: 'SNMP',          port: '161/162',note: 'Simple Network Mgmt – 161=query 162=trap',            category: 'mgmt' },
  { protocol: 'Syslog',        port: 514,      note: 'System log forwarding – UDP, cleartext. Use Syslog-TLS', category: 'mgmt', secureReplacement: 'Syslog-TLS' },

  // VPN tunneling protocols
  { protocol: 'L2TP',          port: 1701,     note: 'Layer 2 Tunneling Protocol — UDP; needs IPSec for encryption',   category: 'secure' },
  { protocol: 'PPTP',          port: 1723,     note: 'Point-to-Point Tunneling — DEPRECATED; uses MPPE (weak). Never use.', category: 'mgmt', secureReplacement: 'L2TP/IPSec' },

  // Windows / RPC
  { protocol: 'RPC/DCOM',      port: 135,      note: 'Windows Remote Procedure Call endpoint mapper',        category: 'mgmt' },

  // Modern / emerging
  { protocol: 'Diameter',      port: 3868,     note: 'RADIUS successor — TCP-based AAA protocol, more reliable', category: 'auth' },
  { protocol: 'SRTP',          port: 5004,     note: 'Secure Real-time Transport Protocol — encrypted VoIP/video', category: 'secure' },
  { protocol: 'HTTP-Alt',      port: 8080,     note: 'HTTP alternate port — proxy servers, dev environments, sometimes used by malware to evade filtering', category: 'web' },

  // Database
  { protocol: 'MS-SQL',        port: 1433,     note: 'Microsoft SQL Server',                                 category: 'db' },
  { protocol: 'MySQL',         port: 3306,     note: 'MySQL / MariaDB database',                             category: 'db' },
  { protocol: 'PostgreSQL',    port: 5432,     note: 'PostgreSQL database',                                  category: 'db' },
  { protocol: 'Oracle DB',     port: 1521,     note: 'Oracle Database listener',                             category: 'db' },
]

// Index by protocol name for quick lookup
export const PORT_BY_PROTOCOL: Record<string, PortEntry> = {}
PORT_LIST.forEach((e) => { PORT_BY_PROTOCOL[e.protocol] = e })

// Insecure protocols that have secure replacements
export const INSECURE_PROTOCOLS = PORT_LIST.filter((e) => e.secureReplacement)
