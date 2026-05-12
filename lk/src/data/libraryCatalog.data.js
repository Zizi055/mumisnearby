export const LIBRARY_CONTENT_TYPES = {
  FAIRY_TALE: 'fairy_tale',
  LULLABY: 'lullaby',
  THERAPY: 'therapy',
  FAMILY_STORY: 'family_story',
};

export const LIBRARY_FILTERS = {
  age: [
    { id: '0-2', label: '0–2 года' },
    { id: '3-6', label: '3–6 лет' },
    { id: '7-10', label: '7–10 лет' },
    { id: '10+', label: '10+' },
  ],

  duration: [
    { id: 'under-7', label: 'до 7 минут', min: 0, max: 7 },
    { id: '7-14', label: '7–14 минут', min: 7, max: 14 },
    { id: '14-21', label: '14–21 минут', min: 14, max: 21 },
    { id: 'over-20', label: 'от 20 минут', min: 20, max: null },
  ],

  emotions: [
    { id: 'happiness', label: 'Счастье' },
    { id: 'sleep', label: 'Сон' },
    { id: 'coziness', label: 'Уют' },
    { id: 'calm', label: 'Спокойствие' },
    { id: 'warmth', label: 'Тепло' },
    { id: 'joy', label: 'Радость' },
    { id: 'bravery', label: 'Смелость' },
  ],

  themes: [
    { id: 'friendship', label: 'Дружба' },
    { id: 'space', label: 'Космос' },
    { id: 'animals', label: 'Животные' },
    { id: 'family', label: 'Семья' },
  ],
};

export const LIBRARY_CATEGORIES = [
  {
    id: LIBRARY_CONTENT_TYPES.FAIRY_TALE,
    label: 'Сказки',
    description: 'Добрые истории для сна, воображения и спокойного вечера.',
  },
  {
    id: LIBRARY_CONTENT_TYPES.LULLABY,
    label: 'Колыбельные',
    description: 'Мягкие аудиосценарии для засыпания и вечернего ритуала.',
  },
  {
    id: LIBRARY_CONTENT_TYPES.THERAPY,
    label: 'Терапия',
    description: 'Бережные сценарии для тревоги, адаптации и эмоциональной поддержки.',
  },
  {
    id: LIBRARY_CONTENT_TYPES.FAMILY_STORY,
    label: 'Семейные истории',
    description: 'Личные истории, семейные воспоминания и тёплые голосовые послания.',
  },
];

export const LIBRARY_ITEMS = [
  {
    id: 1,
    type: LIBRARY_CONTENT_TYPES.FAIRY_TALE,
    title: 'Совушка и малыш',
    description: 'Тихая сказка о дружбе, доме и мягком вечернем свете.',
    duration: 7,
    age: '3-6',
    emotions: ['calm', 'sleep', 'family'],
    themes: ['friendship', 'animals', 'family'],
    image: `${import.meta.env.BASE_URL}img/owl.png`,
    isFavorite: true,
    isPremium: false,
  },
  {
    id: 2,
    type: LIBRARY_CONTENT_TYPES.FAIRY_TALE,
    title: 'В мире сказки',
    description: 'Тёплая история о маленьком путешествии и добром выборе.',
    duration: 12,
    age: '0-2',
    emotions: ['warmth', 'coziness', 'bravery'],
    themes: ['friendship', 'family'],
    image: `${import.meta.env.BASE_URL}img/boy.png`,
    isFavorite: true,
    isPremium: false,
  },
  {
    id: 3,
    type: LIBRARY_CONTENT_TYPES.LULLABY,
    title: 'Сонный лес',
    description: 'Медленный сценарий для засыпания с мягкими паузами.',
    duration: 9,
    age: '0-2',
    emotions: ['sleep', 'calm', 'warmth'],
    themes: ['animals', 'family'],
    image: `${import.meta.env.BASE_URL}img/story.png`,
    isFavorite: false,
    isPremium: false,
  },
  {
    id: 4,
    type: LIBRARY_CONTENT_TYPES.THERAPY,
    title: 'Я рядом',
    description: 'Поддерживающий сценарий для тревожного состояния.',
    duration: 14,
    age: '7-10',
    emotions: ['calm', 'warmth', 'bravery'],
    themes: ['family'],
    image: `${import.meta.env.BASE_URL}img/story2.png`,
    isFavorite: false,
    isPremium: true,
  },
  {
    id: 5,
    type: LIBRARY_CONTENT_TYPES.FAMILY_STORY,
    title: 'История про наш дом',
    description: 'Личная семейная история для сохранения родного голоса.',
    duration: 11,
    age: '10+',
    emotions: ['warmth', 'coziness', 'joy'],
    themes: ['family'],
    image: `${import.meta.env.BASE_URL}img/story3.png`,
    isFavorite: false,
    isPremium: true,
  },
];