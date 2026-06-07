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
