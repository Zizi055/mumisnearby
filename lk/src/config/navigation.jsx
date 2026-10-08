import { Home, Book, Mic, CreditCard, Settings, User } from 'lucide-react';
import { isB2B } from './edition';

const b2cNavigation = [
  {
    icon: <Home size={20} strokeWidth={1.7} />,
    path: '/dashboard',
    label: 'Главная',
    tooltip: 'Главная',
    children: [
      { label: 'Прогресс', path: '/dashboard/progress' },
      { label: 'Активность', path: '/dashboard/activity' },
      { label: 'Поддержка', path: '/dashboard/support' },
    ],
  },
  {
    icon: <Book size={20} strokeWidth={1.7} />,
    path: '/library',
    label: 'Библиотека',
    tooltip: 'Библиотека',
    children: [
      { label: 'Сказки', path: '/library/stories' },
      { label: 'Колыбельные', path: '/library/lullabies' },
      { label: 'Терапия', path: '/library/therapy' },
      { label: 'Семейные истории', path: '/library/family' },
      { label: 'Стихи', path: '/library/poems' },
      { label: 'Рассказы', path: '/library/short-stories' },
      { label: 'Мои сказки', path: '/library/generations' },
    ],
  },
  {
    icon: <Mic size={20} strokeWidth={1.7} />,
    path: '/voice',
    label: 'Голос',
    tooltip: 'Управление голосом',
    children: [
      { label: 'Мой голос', path: '/voice/my' },
      { label: 'Управление', path: '/voice/manage' },
      { label: 'Аналитика', path: '/voice/analytics' },
    ],
  },
  {
    icon: <CreditCard size={20} strokeWidth={1.7} />,
    path: '/subscription',
    label: 'Подписка',
    tooltip: 'Платежи и тарифы',
    children: [
      { label: 'Тариф', path: '/subscription/tariff' },
      { label: 'Платежи', path: '/subscription/payments' },
      { label: 'Управление', path: '/subscription/manage' },
      { label: 'Бонусы', path: '/subscription/bonus' },
    ],
  },
  {
    icon: <Settings size={20} strokeWidth={1.7} />,
    path: '/settings',
    label: 'Настройки',
    tooltip: 'Настройки и профиль',
    children: [
      { label: 'Общие', path: '/settings/general' },
      { label: 'Уведомления', path: '/settings/notifications' },
      { label: 'Безопасность', path: '/settings/security' },
      { label: 'Семья', path: '/settings/family' },
    ],
  },
  {
    icon: <User size={20} strokeWidth={1.7} />,
    path: '/profile',
    label: 'Профиль',
    tooltip: 'Профиль',
    children: [
      { label: 'Данные', path: '/profile/info' },
      // 31.07.2026: блок «Дети» на этой вкладке скрыт (SHOW_KIDS_SECTION
      // в src/pages/profile/Profile.jsx), осталось только «Родители и
      // близкие» — поэтому пункт назван «Семья», а не «Дети».
      // Путь /profile/kids менять не стали: он уже в закладках и роутере.
      // Когда вернём детей — можно переименовать обратно.
      // Названо «Близкие», а не «Семья», чтобы не путалось с пунктом
      // «Семья» в разделе «Настройки» (/settings/family).
      { label: 'Близкие', path: '/profile/kids' },
      { label: 'Предпочтения', path: '/profile/preferences' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Меню сотрудника компании (B2B).
//
// Отличия от B2C ровно два, и оба — состав, а не поведение:
//
//  1. В разделе «Подписка» остался только «Тариф», и он только для
//     чтения. Сотрудник ничего не покупает и не отменяет: доступ оплатила
//     компания и выдала промокодом. Показывать ему «Платежи», «Управление»
//     и «Бонусы» — значит обещать кнопки, которые приведут к отказу бэка.
//
//  2. Нет пункта «Семья» в настройках: семейный доступ — история B2C
//     подписки, в корпоративной его роль играют места компании.
// ─────────────────────────────────────────────────────────────────────
const b2bNavigation = b2cNavigation.map((section) => {
  if (section.path === '/subscription') {
    return {
      ...section,
      label: 'Доступ',
      tooltip: 'Корпоративный доступ',
      children: [{ label: 'Мой тариф', path: '/subscription/tariff' }],
    };
  }

  if (section.path === '/settings') {
    return {
      ...section,
      children: section.children.filter((c) => c.path !== '/settings/family'),
    };
  }

  return section;
});

export const navigation = isB2B ? b2bNavigation : b2cNavigation;