import { HashRouter, Routes, Route } from 'react-router-dom'
import { Hub } from './components/Hub'
import { lazy, Suspense } from 'react'

const PortMaster     = lazy(() => import('./games/PortMaster/PortMaster'))
const FirewallForge  = lazy(() => import('./games/FirewallForge/FirewallForge'))
const LogHunter      = lazy(() => import('./games/LogHunter/LogHunter'))
const AttackMatch    = lazy(() => import('./games/AttackMatch/AttackMatch'))
const IncidentOrder  = lazy(() => import('./games/IncidentOrder/IncidentOrder'))
const AccessControl  = lazy(() => import('./games/AccessControl/AccessControl'))
const CryptoSelect   = lazy(() => import('./games/CryptoSelect/CryptoSelect'))
const NetZones       = lazy(() => import('./games/NetZones/NetZones'))
const PkiLab         = lazy(() => import('./games/PkiLab/PkiLab'))
const WirelessConfig = lazy(() => import('./games/WirelessConfig/WirelessConfig'))
const HardenTarget   = lazy(() => import('./games/HardenTarget/HardenTarget'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-[var(--c-cyan)] text-sm">
      <span className="pulse-glow">LOADING MODULE…</span>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/"                element={<Hub />} />
          <Route path="/port-master"     element={<PortMaster />} />
          <Route path="/firewall-forge"  element={<FirewallForge />} />
          <Route path="/log-hunter"      element={<LogHunter />} />
          <Route path="/attack-match"    element={<AttackMatch />} />
          <Route path="/incident-order"  element={<IncidentOrder />} />
          <Route path="/access-control"  element={<AccessControl />} />
          <Route path="/crypto-select"   element={<CryptoSelect />} />
          <Route path="/net-zones"       element={<NetZones />} />
          <Route path="/pki-lab"         element={<PkiLab />} />
          <Route path="/wireless-config" element={<WirelessConfig />} />
          <Route path="/harden-target"   element={<HardenTarget />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
