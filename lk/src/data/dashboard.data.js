import { icons } from "lucide-react";
import {

  Crown,

} from 'lucide-react';

export const DASHBOARD_OVERVIEW = {
  stats: [
    {
      id: 'activeVoices',
      value: '2',
      label: 'Активных голоса',
      hint: 'Готовы к использованию',
    },
    {
      id: 'listens',
      value: '220',
      label: 'Прослушиваний',
      hint: '+18% за неделю',
    },
    {
      id: 'session',
      value: '8 мин',
      label: 'Средняя сессия',
      hint: 'Лучшее время — вечер',
    },
  {

  id: 'plan',

  icon: Crown,

  value: 'Хранитель',

  label: 'Тариф',

  hint: 'Активен до 04.06.2026',

},
  ],

  continueListening: {
    title: 'Лесные друзья',
    category: 'Сказка',
    age: '3–6 лет',
    duration: '7 минут',
    progress: 64,
    voice: 'Мамин голос',
    mood: 'Спокойствие',
    image: `${import.meta.env.BASE_URL}img/owl.png`,
  },

  quickStories: [
    {
      id: 1,
      title: 'Мальчик и лиса',
      duration: '8 мин',
    },
    {
      id: 2,
      title: 'Спокойной ночи',
      duration: '6 мин',
    },
    {
      id: 3,
      title: 'Верные друзья',
      duration: '9 мин',
    },
  ],

  aiInsights: [
    'Колыбельные лучше работают после 20:30.',
    'Мамин голос чаще дослушивают до конца.',
    'Сценарии до 10 минут дают лучшее удержание.',
  ],

  recentActivity: [
    {
      id: 1,
      title: 'Прослушана сказка «Лесные друзья»',
      time: 'Сегодня, 21:14',
    },
    {
      id: 2,
      title: 'Голосовая модель «Мамин голос» использована в колыбельной',
      time: 'Сегодня, 20:42',
    },
    {
      id: 3,
      title: 'Добавлен сценарий «Спокойной ночи»',
      time: 'Вчера, 22:08',
    },
  ],
};