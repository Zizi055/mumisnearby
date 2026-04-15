export const navigation = [
  {
    icon: '🏠',
    path: '/dashboard',
    label: 'Главная',
    children: [
      { label: 'Прогресс', path: '/dashboard/progress' },
      { label: 'Активность', path: '/dashboard/activity' },
      { label: 'Поддержка', path: '/dashboard/support' },
    ],
  },
  {
    icon: '📚',
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
    icon: '🎤',
    path: '/voice',
    label: 'Голос',
    children: [
      { label: 'Мой голос', path: '/voice/my' },
      { label: 'Управление', path: '/voice/manage' },
      { label: 'Аналитика', path: '/voice/analytics' },
    ],
  },
  {
    icon: '💳',
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
    icon: '⚙️',
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
    icon: '👤',
    path: '/profile',
    label: 'Профиль',
    children: [
      { label: 'Данные', path: '/profile/info' },
      { label: 'Дети', path: '/profile/kids' },
      { label: 'Предпочтения', path: '/profile/preferences' },
    ],
  },
];