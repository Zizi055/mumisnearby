import { Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Subscription from './pages/Subscription';

import SubscriptionTariff from './pages/subscription/SubscriptionTariff';
import SubscriptionPayments from './pages/subscription/SubscriptionPayments';
import SubscriptionManage from './pages/subscription/SubscriptionManage';
import SubscriptionBonus from './pages/subscription/SubscriptionBonus';
import Checkout from './pages/subscription/Checkout';
import Constructor from './pages/subscription/Constructor';

import Voice from './pages/Voice';
import VoiceMy from './pages/voice/VoiceMy';
import VoiceManage from './pages/voice/VoiceManage';
import VoiceAnalytics from './pages/voice/VoiceAnalytics';

import Activity from './pages/Activity.jsx';
import Support from './pages/Support.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';

import LkLayout from './components/layout/LkLayout';
function App() {
  return (
    <Routes>

      {/* Auth —  до LkLayout */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/reset" element={<Auth />} />

      {/* ЛК */}
      <Route element={<LkLayout />}>

        <Route path="/profile/info" element={<Profile />} />
        <Route path="/profile/kids" element={<Profile />} />
        <Route path="/profile/preferences" element={<Profile />} />

        <Route path="/settings/general" element={<Settings />} />
        <Route path="/settings/notifications" element={<Settings />} />
        <Route path="/settings/security" element={<Settings />} />
        <Route path="/settings/family" element={<Settings />} />

        <Route path="/dashboard" element={<Navigate to="/dashboard/progress" replace />} />
        <Route path="/dashboard/progress" element={<Dashboard />} />
        <Route path="/dashboard/activity" element={<Activity />} />
        <Route path="/dashboard/support" element={<Support />} />

        <Route path="/library" element={<Navigate to="/library/stories" replace />} />
        <Route path="/library/stories" element={<Library />} />
        <Route path="/library/lullabies" element={<Library />} />
        <Route path="/library/therapy" element={<Library />} />
        <Route path="/library/family" element={<Library />} />

        <Route path="/voice" element={<Voice />}>
          <Route index element={<Navigate to="my" replace />} />
          <Route path="my" element={<VoiceMy />} />
          <Route path="manage" element={<VoiceManage />} />
          <Route path="analytics" element={<VoiceAnalytics />} />
        </Route>

        <Route path="/subscription" element={<Subscription />}>
          <Route index element={<Navigate to="tariff" replace />} />
          <Route path="tariff" element={<SubscriptionTariff />} />
          <Route path="payments" element={<SubscriptionPayments />} />
          <Route path="manage" element={<SubscriptionManage />} />
          <Route path="bonus" element={<SubscriptionBonus />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="constructor" element={<Constructor />} />
        </Route>

      </Route>

      {/* Корень и 404 — в самом конце */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />

    </Routes>
  );
}
export default App;