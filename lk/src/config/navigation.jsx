import { Home, Book, Mic, CreditCard, Settings, User } from 'lucide-react';

export const navigation = [
  {
    icon: <Home size={20} strokeWidth={1.7} />,
    path: '/dashboard',
    label: 'Главная',
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
    children: [
      { label: 'Сказки', path: '/library/stories' },
      { label: 'Колыбельные', path: '/library/lullabies' },
      { label: 'Терапия', path: '/library/therapy' },
      { label: 'Семейные истории', path: '/library/family' },
    ],
  },
  {
    icon: <Mic size={20} strokeWidth={1.7} />,
    path: '/voice',
    label: 'Голос',
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
    children: [
      { label: 'Данные', path: '/profile/info' },
      { label: 'Дети', path: '/profile/kids' },
      { label: 'Предпочтения', path: '/profile/preferences' },
    ],
  },
];