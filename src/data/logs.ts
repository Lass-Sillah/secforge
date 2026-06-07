export type IoCType =
  | 'brute-force'
  | 'credential-stuffing'
  | 'password-spraying'
  | 'privilege-escalation'
  | 'off-hours-access'
  | 'log-gap'
  | 'outbound-exfil'
  | 'foreign-ip'
  | 'repeated-failures'
  | 'account-lockout'
  | 'sql-injection'
  | 'dns-tunneling'
  | 'port-scan'
  | 'default-credentials'
  | 'phishing'

export interface LogScenario {
  id: string
  title: string
  logLines: string[]
  suspiciousIndex: number
  iocType: IoCType
  explanation: string
}

export const LOG_SCENARIOS: LogScenario[] = [
  {
    id: 'ls-01',
    title: 'Authentication Log — Login Attempts',
    iocType: 'brute-force',
    logLines: [
      '2024-03-14 08:32:11 AUTH FAIL  user=jsmith    src=10.0.1.45   attempt=1',
      '2024-03-14 08:32:13 AUTH FAIL  user=jsmith    src=10.0.1.45   attempt=2',
      '2024-03-14 08:32:14 AUTH FAIL  user=jsmith    src=10.0.1.45   attempt=3',
      '2024-03-14 08:32:14 AUTH FAIL  user=jsmith    src=10.0.1.45   attempt=4',
      '2024-03-14 08:32:15 AUTH SUCCESS user=jsmith  src=10.0.1.45',
    ],
    suspiciousIndex: 4,
    explanation: 'A success following 4 rapid failures from the same IP is classic brute-force / credential stuffing. The success is the IoC — an attacker cracked the password after repeated tries.',
  },
  {
    id: 'ls-02',
    title: 'Firewall Log — Outbound Connections',
    iocType: 'outbound-exfil',
    logLines: [
      '2024-03-14 22:01:03 ALLOW TCP  src=192.168.1.82:49201  dst=8.8.8.8:443   bytes=1.2KB',
      '2024-03-14 22:01:44 ALLOW TCP  src=192.168.1.82:49202  dst=172.217.3.46:443 bytes=800B',
      '2024-03-14 22:03:17 ALLOW TCP  src=192.168.1.82:49251  dst=45.33.32.156:4444 bytes=247MB',
      '2024-03-14 22:04:01 ALLOW TCP  src=192.168.1.82:49290  dst=1.1.1.1:443   bytes=2.1KB',
    ],
    suspiciousIndex: 2,
    explanation: '247 MB outbound to 45.33.32.156:4444 is a massive exfiltration IoC. Port 4444 is a common Metasploit reverse shell port. Normal browsing does not produce hundreds of MB outbound to a single unknown IP.',
  },
  {
    id: 'ls-03',
    title: 'Auth Log — Off-Hours Access',
    iocType: 'off-hours-access',
    logLines: [
      '2024-03-15 08:45:02 AUTH SUCCESS user=alice    src=10.0.1.20   type=WORKSTATION',
      '2024-03-15 09:12:31 AUTH SUCCESS user=bob      src=10.0.1.33   type=WORKSTATION',
      '2024-03-15 09:55:18 AUTH SUCCESS user=charlie  src=10.0.1.51   type=WORKSTATION',
      '2024-03-15 03:47:22 AUTH SUCCESS user=charlie  src=185.220.101.7 type=VPN',
      '2024-03-15 12:00:00 AUTH SUCCESS user=alice    src=10.0.1.20   type=WORKSTATION',
    ],
    suspiciousIndex: 3,
    explanation: 'Charlie authenticating at 03:47 from an external IP (185.220.101.7 — a Tor exit node range) via VPN is highly suspicious. Off-hours access from an unexpected external IP is a classic insider threat or account compromise indicator.',
  },
  {
    id: 'ls-04',
    title: 'Auth Log — Password Spraying',
    iocType: 'password-spraying',
    logLines: [
      '2024-03-14 14:22:01 AUTH FAIL  user=alice    src=10.5.0.200 attempt=1',
      '2024-03-14 14:22:03 AUTH FAIL  user=bob      src=10.5.0.200 attempt=1',
      '2024-03-14 14:22:05 AUTH FAIL  user=charlie  src=10.5.0.200 attempt=1',
      '2024-03-14 14:22:07 AUTH FAIL  user=diana    src=10.5.0.200 attempt=1',
      '2024-03-14 14:22:09 AUTH FAIL  user=evan     src=10.5.0.200 attempt=1',
    ],
    suspiciousIndex: 0,
    explanation: 'One attempt per account, all from the same source IP in rapid succession — this is password spraying. Attackers avoid lockout by limiting attempts per account, cycling through many usernames with a single common password. The suspicious entry is the first (the pattern defines the IoC).',
  },
  {
    id: 'ls-05',
    title: 'System Log — Privilege Escalation',
    iocType: 'privilege-escalation',
    logLines: [
      '2024-03-14 11:30:22 LOGIN   user=webapp_svc  shell=/bin/false  tty=none',
      '2024-03-14 11:31:45 PROCESS user=webapp_svc  cmd=/usr/bin/python3 /opt/app/server.py',
      '2024-03-14 11:34:12 SUDO    user=webapp_svc  cmd=/bin/bash      tty=pts/0  status=SUCCESS',
      '2024-03-14 11:34:15 PROCESS user=root        cmd=/bin/bash      pid=4421',
      '2024-03-14 11:34:20 PROCESS user=root        cmd=/etc/passwd    pid=4422',
    ],
    suspiciousIndex: 2,
    explanation: 'webapp_svc is a service account with shell=/bin/false — it should never run an interactive shell. Successful sudo to /bin/bash indicates privilege escalation, likely via a misconfigured sudoers entry or exploit.',
  },
  {
    id: 'ls-06',
    title: 'Web Server Log — Log Gap',
    iocType: 'log-gap',
    logLines: [
      '2024-03-14 10:44:33 GET /index.html 200 src=203.0.113.5',
      '2024-03-14 10:44:35 GET /about.html 200 src=203.0.113.5',
      '2024-03-14 10:44:37 GET /login.html 200 src=203.0.113.5',
      '2024-03-14 12:19:02 GET /index.html 200 src=203.0.113.8',
      '2024-03-14 12:19:05 GET /api/status  200 src=203.0.113.8',
    ],
    suspiciousIndex: 3,
    explanation: 'There is a 1h 35min gap in web server logs (10:44 → 12:19). Log gaps can indicate an attacker deleted or tampered with log files to cover their tracks. Log integrity monitoring (SIEM/WORM storage) helps detect this.',
  },
  {
    id: 'ls-07',
    title: 'Auth Log — Foreign Source IP',
    iocType: 'foreign-ip',
    logLines: [
      '2024-03-14 09:05:11 AUTH SUCCESS user=ceo@corp.com  src=10.0.1.5    country=US',
      '2024-03-14 09:07:44 AUTH SUCCESS user=ceo@corp.com  src=41.66.26.14  country=NG',
      '2024-03-14 09:08:02 AUTH SUCCESS user=ceo@corp.com  src=10.0.1.5    country=US',
    ],
    suspiciousIndex: 1,
    explanation: 'The CEO\'s account logged in from Nigeria (41.66.26.14) between two US logins 2 minutes apart — physically impossible travel, known as "impossible travel" or "concurrent session from different geography." Strong account compromise indicator.',
  },
  {
    id: 'ls-08',
    title: 'Auth Log — Repeated Failures, Single Account',
    iocType: 'repeated-failures',
    logLines: [
      '2024-03-14 13:00:01 AUTH FAIL user=admin src=198.51.100.9',
      '2024-03-14 13:00:31 AUTH FAIL user=admin src=198.51.100.9',
      '2024-03-14 13:01:01 AUTH FAIL user=admin src=198.51.100.9',
      '2024-03-14 13:01:31 AUTH FAIL user=admin src=198.51.100.9',
      '2024-03-14 13:02:01 AUTH FAIL user=admin src=198.51.100.9',
    ],
    suspiciousIndex: 0,
    explanation: 'Five consecutive auth failures for the "admin" account at 30-second intervals from an external IP suggest a slow brute-force or dictionary attack against the admin account. Uniform spacing may indicate automated tooling.',
  },
  {
    id: 'ls-09',
    title: 'Windows Event Log — Account Lockout',
    iocType: 'account-lockout',
    logLines: [
      '2024-03-15 09:14:02 EventID=4625 user=jdoe    src=10.0.5.77  reason=UnknownUserOrBadPassword',
      '2024-03-15 09:14:04 EventID=4625 user=jdoe    src=10.0.5.77  reason=UnknownUserOrBadPassword',
      '2024-03-15 09:14:06 EventID=4625 user=jdoe    src=10.0.5.77  reason=UnknownUserOrBadPassword',
      '2024-03-15 09:14:08 EventID=4625 user=jdoe    src=10.0.5.77  reason=UnknownUserOrBadPassword',
      '2024-03-15 09:14:09 EventID=4740 user=jdoe    src=10.0.5.77  reason=AccountLockedOut',
    ],
    suspiciousIndex: 4,
    explanation: 'Windows Event ID 4625 is a failed logon. Four rapid failures in under 10 seconds trigger Event ID 4740 — Account Lockout. The 4740 event is the key IoC: it confirms the account has been locked, which may indicate a targeted brute-force attempt. In Active Directory environments, 4740 alerts are high-priority and should trigger immediate investigation.',
  },
  {
    id: 'ls-10',
    title: 'Web Server Log — SQL Injection Attempt',
    iocType: 'sql-injection',
    logLines: [
      "2024-03-15 11:02:33 GET /products?id=42 200 src=203.0.113.21",
      "2024-03-15 11:02:35 GET /products?id=43 200 src=203.0.113.21",
      "2024-03-15 11:02:38 GET /login?user=admin&pass=' OR 1=1-- 200 src=203.0.113.21",
      "2024-03-15 11:02:41 GET /products?id=44 200 src=203.0.113.21",
      "2024-03-15 11:02:43 GET /products?id=45 200 src=203.0.113.21",
    ],
    suspiciousIndex: 2,
    explanation: "The URL parameter pass=' OR 1=1-- is a classic SQL injection payload. The single quote breaks out of the SQL string context, OR 1=1 makes the WHERE clause always true (bypassing password checks), and -- comments out the remainder of the query. A 200 response indicates the server processed the request — this should be blocked by a WAF and parameterized queries.",
  },
  {
    id: 'ls-11',
    title: 'DNS Log — DNS Tunneling',
    iocType: 'dns-tunneling',
    logLines: [
      '2024-03-15 14:00:01 QUERY A    mail.corp.com                          src=10.0.2.15',
      '2024-03-15 14:00:02 QUERY A    updates.microsoft.com                  src=10.0.2.15',
      '2024-03-15 14:00:03 QUERY TXT  aGVsbG8td29ybGQ.c2VjcmV0LmV4aWwuY29t  src=10.0.2.15',
      '2024-03-15 14:00:04 QUERY TXT  dGhpcy1pcy1leGZpbA.c2VjcmV0LmV4aWwuY29t src=10.0.2.15',
      '2024-03-15 14:00:05 QUERY TXT  bW9yZS1kYXRhLWhlcmU.c2VjcmV0LmV4aWwuY29t src=10.0.2.15',
    ],
    suspiciousIndex: 2,
    explanation: 'Legitimate DNS queries use short, human-readable hostnames. The TXT queries here use unusually long Base64-encoded subdomains queried at high frequency to the same parent domain (secret.exil.com). This is DNS tunneling — a C2 or exfiltration technique that encodes data inside DNS queries to bypass firewalls that permit DNS outbound. Indicators: long subdomain labels, TXT record type abuse, high query rate to one domain.',
  },
  {
    id: 'ls-12',
    title: 'Firewall Log — Port Scan',
    iocType: 'port-scan',
    logLines: [
      '2024-03-15 16:45:01 DENY TCP src=198.51.100.42:60001 dst=10.0.1.10:21   SYN',
      '2024-03-15 16:45:01 DENY TCP src=198.51.100.42:60002 dst=10.0.1.10:22   SYN',
      '2024-03-15 16:45:01 DENY TCP src=198.51.100.42:60003 dst=10.0.1.10:23   SYN',
      '2024-03-15 16:45:02 DENY TCP src=198.51.100.42:60004 dst=10.0.1.10:80   SYN',
      '2024-03-15 16:45:02 DENY TCP src=198.51.100.42:60005 dst=10.0.1.10:443  SYN',
    ],
    suspiciousIndex: 0,
    explanation: 'Sequential SYN packets to incrementing ports (21, 22, 23, 80, 443) on a single destination IP from a single source IP within one second is a textbook TCP SYN port scan — likely Nmap or a similar tool performing reconnaissance to discover open services. The suspicious entry is the first (the pattern across all entries defines the IoC). An IDS/IPS should alert on this pattern and block the source IP.',
  },
  {
    id: 'ls-13',
    title: 'Auth Log — Default Credential Attempt',
    iocType: 'default-credentials',
    logLines: [
      '2024-03-15 20:10:02 AUTH FAIL user=admin         src=185.220.101.55 service=SSH',
      '2024-03-15 20:10:05 AUTH FAIL user=administrator  src=185.220.101.55 service=SSH',
      '2024-03-15 20:10:08 AUTH FAIL user=root           src=185.220.101.55 service=SSH',
      '2024-03-15 20:10:11 AUTH FAIL user=guest          src=185.220.101.55 service=SSH',
      '2024-03-15 20:10:14 AUTH FAIL user=ubuntu         src=185.220.101.55 service=SSH',
    ],
    suspiciousIndex: 0,
    explanation: 'Cycling through admin, administrator, root, guest, and ubuntu — all well-known default or common system usernames — from a single external IP is a default credential attack. Attackers use automated tools to try manufacturer defaults and OS-level accounts that may have weak or unchanged passwords. This pattern from an external IP should trigger an automatic block and alert.',
  },
  {
    id: 'ls-14',
    title: 'Email Server Log — Phishing Indicator',
    iocType: 'phishing',
    logLines: [
      '2024-03-15 08:30:11 RECV from=support@corp.com          to=alice@corp.com  SPF=PASS   DKIM=PASS',
      '2024-03-15 08:31:44 RECV from=noreply@corp.com          to=bob@corp.com    SPF=PASS   DKIM=PASS',
      '2024-03-15 08:33:02 RECV from=it-helpdesk@c0rp.com      to=ceo@corp.com    SPF=FAIL   DKIM=FAIL  relay=91.108.4.200',
      '2024-03-15 08:34:17 RECV from=newsletter@vendor.com     to=team@corp.com   SPF=PASS   DKIM=PASS',
      '2024-03-15 08:35:50 RECV from=alerts@monitoring.corp.com to=ops@corp.com   SPF=PASS   DKIM=PASS',
    ],
    suspiciousIndex: 2,
    explanation: 'The third entry shows an email claiming to be from it-helpdesk@c0rp.com (note the zero replacing the letter "o" — a homograph spoof of corp.com) with both SPF FAIL and DKIM FAIL, relayed from a suspicious IP. SPF failure means the sending server is not authorised to send for that domain; DKIM failure means the message was not cryptographically signed by the legitimate domain. Together these are strong phishing indicators. DMARC policy should reject or quarantine such messages.',
  },
]
