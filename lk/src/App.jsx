import { Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Subscription from './pages/Subscription';

import SubscriptionTariff from './pages/subscription/SubscriptionTariff';
import SubscriptionPayments from './pages/subscription/SubscriptionPayments';
import SubscriptionManage from './pages/subscription/SubscriptionManage';
import SubscriptionBonus from './pages/subscription/SubscriptionBonus';
import Voice from './pages/Voice';
import VoiceMy from './pages/voice/VoiceMy';
import VoiceManage from './pages/voice/VoiceManage';
import VoiceAnalytics from './pages/voice/VoiceAnalytics';

import LkLayout from './components/layout/LkLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard/progress" replace />} />

      <Route element={<LkLayout />}>

        {/* dashboard */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/progress" replace />} />
        <Route path="/dashboard/progress" element={<Dashboard />} />
        <Route path="/dashboard/activity" element={<Dashboard />} />
        <Route path="/dashboard/support" element={<Dashboard />} />

        {/* library */}
        <Route path="/library" element={<Navigate to="/library/stories" replace />} />
        <Route path="/library/stories" element={<Library />} />
        <Route path="/library/lullabies" element={<Library />} />
        <Route path="/library/therapy" element={<Library />} />
        <Route path="/library/family" element={<Library />} />

        {/* voice */}
       <Route path="/voice" element={<Voice />}>
  <Route index element={<Navigate to="my" replace />} />
  <Route path="my" element={<VoiceMy />} />
  <Route path="manage" element={<VoiceManage />} />
  <Route path="analytics" element={<VoiceAnalytics />} />
</Route>

        {/* subscription — ВЛОЖЕННЫЕ */}
        <Route path="/subscription" element={<Subscription />}>
          <Route index element={<Navigate to="tariff" replace />} />
          <Route path="tariff" element={<SubscriptionTariff />} />
          <Route path="payments" element={<SubscriptionPayments />} />
          <Route path="manage" element={<SubscriptionManage />} />
          <Route path="bonus" element={<SubscriptionBonus />} />
        </Route>

      </Route>

      <Route path="*" element={<Navigate to="/dashboard/progress" replace />} />
    </Routes>
  );
}

export default App;