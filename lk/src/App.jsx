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
import AdminGrant from './pages/admin/AdminGrant.jsx';

import { isB2B } from './config/edition';

import PromoActivate from './pages/PromoActivate.jsx';
import HrLayout from './pages/hr/HrLayout.jsx';
import HrLogin from './pages/hr/HrLogin.jsx';
import HrRegister from './pages/hr/HrRegister.jsx';
import HrDashboard from './pages/hr/HrDashboard.jsx';
import HrPromoCodes from './pages/hr/HrPromoCodes.jsx';
import HrEmployees from './pages/hr/HrEmployees.jsx';
import HrCompany from './pages/hr/HrCompany.jsx';

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
          Отдельный логин (/auth/admin/login) —
          не путать с пользовательским /auth. AdminLayout сам проверяет
          токен и редиректит на /admin/login, если доступа нет. */}
      {/* ─── Корпоративная часть — только в B2B-сборке ───────────────
          В B2C этих роутов нет вовсе: активация промокода и кабинет
          компании на домене для частных клиентов не нужны и только
          путали бы. Монтируем по флагу редакции (config/edition.js). */}
      {isB2B && <Route path="/promo" element={<PromoActivate />} />}
      {isB2B && <Route path="/hr/login" element={<HrLogin />} />}
      {isB2B && <Route path="/hr/register" element={<HrRegister />} />}
      {isB2B && (
        <Route path="/hr" element={<HrLayout />}>
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HrDashboard />} />
          <Route path="promocodes" element={<HrPromoCodes />} />
          <Route path="employees" element={<HrEmployees />} />
          <Route path="company" element={<HrCompany />} />
        </Route>
      )}

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/support" replace />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="grant" element={<AdminGrant />} />
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

        {/* Подписка. В B2B сотрудник ничего не покупает и не отменяет:
            доступ оплатила компания и выдала промокодом. Поэтому оплата,
            платежи, управление, бонусы и конструктор там не смонтированы
            — иначе прямая ссылка привела бы на экран с кнопками, которые
            гарантированно получают отказ бэка. */}
        <Route path="/subscription" element={<Subscription />}>
          <Route index element={<Navigate to="tariff" replace />} />
          <Route path="tariff" element={<SubscriptionTariff />} />

          {!isB2B && <Route path="payments" element={<SubscriptionPayments />} />}
          {!isB2B && <Route path="manage" element={<SubscriptionManage />} />}
          {!isB2B && <Route path="bonus" element={<SubscriptionBonus />} />}
          {!isB2B && <Route path="checkout" element={<Checkout />} />}
          {!isB2B && (
            <Route path="checkout/success" element={<SubscriptionSuccess />} />
          )}
          {!isB2B && <Route path="constructor" element={<Constructor />} />}

          {/* Старые ссылки на закрытые разделы не должны вести в пустоту. */}
          {isB2B && <Route path="*" element={<Navigate to="/subscription/tariff" replace />} />}
        </Route>

      </Route>

      {/* Корень и 404 — в самом конце */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />

    </Routes>
  );
}
export default App;