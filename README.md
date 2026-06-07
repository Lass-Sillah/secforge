# SECFORGE

> **Live:** https://lass-sillah.github.io/secforge/

A browser-based training tool for the CompTIA Security+ SY0-701 exam, focused on the performance-based questions (PBQs) that show up in the actual test. Built to feel like a terminal game rather than a flashcard app.

---

## What it is

Most Security+ prep tools drill you on multiple choice. PBQs are different — they put you in a scenario and make you *do* something: order firewall rules, identify the suspicious log entry, place servers in the right network zone. SECFORGE trains exactly those skills.

11 game modules, each covering a different PBQ category from the SY0-701 exam objectives:

| Module | What you do |
|--------|-------------|
| **PORT MASTER** | Match protocols to their ports and identify secure replacements |
| **FIREWALL FORGE** | Drag ACL rules into the correct top-down order — first match wins |
| **NET ZONES** | Place servers and services into DMZ, Internal LAN, or Secure Zone |
| **LOG HUNTER** | Read real-looking log output and click the suspicious indicator |
| **ATTACK MATCH** | Match attack names to their descriptions |
| **INCIDENT ORDER** | Sequence the IR lifecycle (PICERL) and forensic Order of Volatility |
| **ACCESS CONTROL** | Classify MAC / DAC / RBAC / ABAC scenarios; apply least privilege and SoD |
| **CRYPTO SELECT** | Pick the right algorithm for each use case; flag deprecated ones |
| **PKI LAB** | Choose cert types, diagnose cert issues from a mock viewer, sequence TLS 1.2 |
| **WIRELESS CONFIG** | Select the correct WPA version or EAP method for enterprise scenarios |
| **HARDEN TARGET** | Audit a server or cloud config and flag every misconfiguration |

---

## How it plays

Each module runs on a roguelike progression system:

- **Rank ladder:** E → D → C → B → A → S
- **Stack:** a set of questions for the current rank — you must clear it **with zero mistakes** to rank up
- **One wrong answer** resets you to the top of the same stack with reshuffled options — no skipping ahead
- **Timer:** each rank has a tighter countdown per card
- **Combo multiplier** rewards consecutive correct answers
- **Review mode:** step through your answered cards mid-run without losing your place

Progress and scores save automatically to your browser's local storage.

---

## Domain coverage

| Domain | Weight | Coverage |
|--------|--------|----------|
| D1 — General Security Concepts | 12% | Access Control (models + principles) |
| D2 — Threats, Vulns & Mitigations | 22% | Attack Match (40+ attacks), Log Hunter (14 IoC scenarios) |
| D3 — Security Architecture | 18% | Firewall Forge, Net Zones, PKI Lab, Crypto Select, Wireless Config, Port Master |
| D4 — Security Operations | 28% | Log Hunter, Incident Order, Harden Target |
| D5 — Program Management | 20% | Governance / compliance (primarily MC, not PBQ) |

---

## Tech

React + Vite + TypeScript. Tailwind CSS v4. Zustand for persistent state. PWA — works offline after first load. Zero backend; everything runs in the browser.

---

## Run locally

```bash
npm install
npm run dev
```
