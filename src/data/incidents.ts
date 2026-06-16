export const IR_STEPS = [
  'Preparation',
  'Identification',
  'Containment',
  'Eradication',
  'Recovery',
  'Lessons Learned',
]

export const IR_DESCRIPTIONS: Record<string, string> = {
  'Preparation':      'Establish IR plan, train team, deploy tools/SIEM, define communication channels before any incident occurs.',
  'Identification':   'Detect and confirm an incident via alerts, logs, or user reports. Determine scope and severity.',
  'Containment':      'Isolate affected systems to prevent further spread. Short-term (disconnect) and long-term (patch) containment.',
  'Eradication':      'Remove the root cause — malware, backdoors, malicious accounts, exploited vulnerabilities.',
  'Recovery':         'Restore systems from clean backups, verify integrity, monitor closely. Return to production.',
  'Lessons Learned':  'Post-incident review: what happened, what worked, what failed, how to improve. Update IR plan.',
}

// Windows Event IDs most tested on SY0-701
export const WINDOWS_EVENT_IDS: Record<string, string> = {
  '4624': 'Successful logon — after many 4625s indicates brute-force success',
  '4625': 'Failed logon — rapid sequence = brute force or password spray',
  '4648': 'Logon with explicit credentials — Pass-the-Hash indicator',
  '4672': 'Special privileges assigned to new logon — privilege escalation',
  '4688': 'New process created — suspicious if spawned by Word, Excel, or browser',
  '4698': 'Scheduled task created — persistence mechanism',
  '4720': 'User account created — unauthorized account creation',
  '4732': 'User added to security-enabled local group — privilege escalation',
  '4740': 'Account locked out — triggered by too many 4625 failures',
}

// Chain of custody — forensic evidence handling steps (drag-order)
export const FORENSIC_STEPS = [
  'Photograph the scene and document device state',
  'Use write blocker before any media connection',
  'Create forensic image (bit-for-bit copy) with MD5/SHA hash',
  'Verify hash of image matches hash of source',
  'Seal original evidence and log chain of custody',
  'Conduct analysis on the forensic image copy only',
  'Document all findings and maintain evidence log',
]

export const FORENSIC_DESCRIPTIONS: Record<string, string> = {
  'Photograph the scene and document device state':     'Document power state (on/off), connected cables, running processes visible on screen before touching anything.',
  'Use write blocker before any media connection':       'Hardware write blocker prevents any writes to evidence drives during acquisition — preserves integrity for court admissibility.',
  'Create forensic image (bit-for-bit copy) with MD5/SHA hash': 'Bit-for-bit copy includes all sectors including deleted space. Hash (MD5 or SHA-256) is taken simultaneously during imaging.',
  'Verify hash of image matches hash of source':         'Hash verification proves the copy is identical to the original — any tampering would change the hash.',
  'Seal original evidence and log chain of custody':     'Original goes into tamper-evident packaging. Every person who handles it signs the chain of custody log (who, when, why).',
  'Conduct analysis on the forensic image copy only':    'Never analyze original evidence — analysis could modify it. Work only on verified copies.',
  'Document all findings and maintain evidence log':     'All findings must be reproducible and documented to withstand legal scrutiny. Notes become part of the formal report.',
}

export const OOV_STEPS = [
  'CPU registers & cache',
  'RAM (memory)',
  'Network state & connections',
  'Running processes',
  'Disk storage',
  'Logs & archived media',
  'Physical backups & offline media',
]

export const OOV_DESCRIPTIONS: Record<string, string> = {
  'CPU registers & cache':            'Extremely volatile — lost the moment power is cut or context-switches. Collect first with live forensics tools.',
  'RAM (memory)':                     'Lost on reboot. Contains running processes, encryption keys, network connections, and clipboard data.',
  'Network state & connections':      'Active connections, ARP table, routing table, open ports — lost when network is disrupted.',
  'Running processes':                'Process list, open handles, loaded DLLs — capture before shutdown.',
  'Disk storage':                     'Persistent but can be overwritten. Image drives before running any tools that write to disk.',
  'Logs & archived media':            'Usually persistent but may be rotated or tampered with. Collect before system changes.',
  'Physical backups & offline media': 'Tapes, external drives — least volatile. May be needed for historical forensics.',
}
