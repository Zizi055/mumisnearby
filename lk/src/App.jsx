import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { captureReferralCode } from './utils/referral';

import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Subscription from './pages/Subscription';

import SubscriptionTariff from './pages/subscription/SubscriptionTariff';
import SubscriptionPayments from './pages/subscription/SubscriptionPayments';
import SubscriptionManage from './pages/subscription/SubscriptionManage';
import SubscriptionBonus from './pages/subscription/SubscriptionBonus';
import Checkout from './pages/subscription/Checkout';
import SubscriptionSuccess from './pages/subscription/SubscriptionSuccess';
import Constructor from './pages/subscription/Constructor';

import Voice from './pages/Voice';
import VoiceMy from './pages/voice/VoiceMy';
import VoiceManage from './pages/voice/VoiceManage';
import VoiceAnalytics from './pages/voice/VoiceAnalytics';

import Activity from './pages/Activity.jsx';
import Support from './pages/Support.jsx';
import Auth from './pages/Auth.jsx';
import AuthReset from './pages/AuthReset.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Profile from './pages/profile/Profile.jsx';
import Settings from './pages/settings/Settings.jsx';

import LkLayout from './components/layout/LkLayout';
import LibraryItem from './components/library/LibraryItem';
import LibraryGenerations from './pages/library/LibraryGenerations';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminSupport from './pages/admin/AdminSupport.jsx';
import AdminLeads from './pages/admin/AdminLeads.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminAdmins from './pages/admin/AdminAdmins.jsx';
function App() {
  // Ловим ?ref=CODE (или /ref/CODE) сразу при заходе в приложение — на
  // случай прямой ссылки в ЛК, минуя маркетинговый сайт. См. utils/referral.js
  useEffect(() => {
    captureReferralCode();
  }, []);

  return (
    <Routes>

      {/* Auth —  до LkLayout */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/reset" element={<AuthReset />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Админка — своя, без клиентского LkLayout (сайдбар/шапка ЛК не нужны).
          Отдельный логин (/auth/admin/login, /auth/super_admin/login) —
          не путать с пользовательским /auth. AdminLayout сам проверяет
          токен и редиректит на /admin/login, если доступа нет. */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/support" replace />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="admins" element={<AdminAdmins />} />
      </Route>

      {/* ЛК */}
      <Route element={<LkLayout />}>

        {/* Голый /profile тоже должен открываться: на него ведёт аватар
            в меню и, что важнее, на него редиректит бэк после перехода
            по ссылке из письма — GET /profile/confirm-email-change
            отправляет на /profile?email_changed=true. Без этого маршрута
            подтверждение почты приводило на пустой экран. */}
        <Route path="/profile" element={<Profile />} />
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
        <Route path="/library/poems" element={<Library />} />
        <Route path="/library/short-stories" element={<Library />} />
        <Route path="/library/generations" element={<LibraryGenerations />} />
        <Route
  path="/library/item/:type/:id"
  element={<LibraryItem />}
/>

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
          <Route path="checkout/success" element={<SubscriptionSuccess />} />
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