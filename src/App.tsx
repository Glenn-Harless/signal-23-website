import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StationHome } from './components/Station/StationHome';
import { StationTerminal } from './components/Terminal/StationTerminal';
import { InstrumentsPage } from './components/Instruments/InstrumentsPage';
import { SuccessPage } from './components/Instruments/SuccessPage';
import { WorkstationShell } from './components/WorkstationShell/WorkstationShell';
import { Resonance } from './components/Resonance/Resonance';
import { Growth } from './components/Growth/Growth';
import { ForbiddingBlocks } from './components/ForbiddingBlocks/ForbiddingBlocks';
import { Well } from './components/Well/Well';
import { Tangle } from './components/Tangle/Tangle';
import { Learning } from './components/Learning/Learning';
import { Terms } from './components/Terms/Terms';
import { Stepwell } from './components/Stepwell/Stepwell';
import Broadcast from './components/Broadcast/Broadcast';
import Forest from './components/Forest/Forest';
import { Nerve } from './components/Nerve/Nerve';
import { Face } from './components/Face/Face';
import { Hand } from './components/Hand/Hand';
import { Birth } from './components/Birth/Birth';
import { Murmur } from './components/Murmur/Murmur';
import { Decay } from './components/Decay/Decay';
import { Reclamation } from './components/Reclamation/Reclamation';
import { OperatorIndex } from './components/Operator/OperatorIndex';
import { TransmissionDetail } from './components/Operator/TransmissionDetail';
import { Atlas } from './components/Atlas/Atlas';
import { Streamfront } from './components/Streamfront/Streamfront';
import { Rivulet } from './components/Rivulet/Rivulet';
import { Mycelium } from './components/Mycelium/Mycelium';
import { Mountain } from './components/Mountain/Mountain';
import { Cloudform } from './components/Cloudform/Cloudform';
import { Torchrite } from './components/Torchrite/Torchrite';
import { SignalMemory } from './components/SignalMemory/SignalMemory';
import { ListenRoute } from './components/Listen/ListenRoute';
import { PrivacyPolicy } from './components/Legal/PrivacyPolicy';
import { Standby } from './components/Standby/Standby';



// Main App component with routing
const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <BrowserRouter>
      <WorkstationShell isMobile={isMobile}>
        <Routes>
          <Route path="/" element={<StationHome isMobile={isMobile} />} />
          <Route path="/terminal" element={<StationTerminal isMobile={isMobile} />} />
          <Route path="/av" element={<Standby code="A/V" lines={['RELEASES', 'FILMS', 'VISUAL TRANSMISSIONS']} />} />
          <Route path="/instruments" element={<InstrumentsPage />} />
          <Route path="/instruments/success" element={<SuccessPage />} />
          <Route path="/testblandingpage" element={<Navigate to="/resonance" replace />} />
          <Route path="/resonance" element={<Resonance />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/forbidding" element={<ForbiddingBlocks />} />
          <Route path="/well" element={<Well />} />
          <Route path="/tangle" element={<Tangle />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/stepwell" element={<Stepwell />} />
          <Route path="/broadcast" element={<Broadcast />} />
          <Route path="/forest" element={<Forest />} />
          <Route path="/nerve" element={<Nerve />} />
          <Route path="/face" element={<Face />} />


          <Route path="/hand" element={<Hand />} />
          <Route path="/birth" element={<Birth />} />
          <Route path="/murmur" element={<Murmur />} />
          <Route path="/decay" element={<Decay />} />
          <Route path="/reclamation" element={<Reclamation />} />
          <Route path="/operator" element={<OperatorIndex />} />
          <Route path="/operator/transmissions/:slug" element={<TransmissionDetail />} />
          <Route path="/deaddrop" element={<Atlas />} />
          <Route path="/streamfront" element={<Streamfront />} />
          <Route path="/rivulet" element={<Rivulet />} />
          <Route path="/mycelium" element={<Mycelium />} />
          <Route path="/mountain" element={<Mountain />} />
          <Route path="/cloudform" element={<Cloudform />} />
          <Route path="/torchrite" element={<Torchrite />} />
          <Route path="/signal-memory" element={<SignalMemory />} />
          {/* Ad landing pages. Production serves static listen/<slug>/index.html first; this is the SPA fallback. */}
          <Route path="/listen/:slug" element={<ListenRoute />} />
          {/* Static legal/privacy/index.html is served first in production; SPA fallback. */}
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </WorkstationShell>
    </BrowserRouter>
  );
};

export default App;
