import { api } from './client';
 
// Маппинг полей бэкенда в формат который ожидает LibraryCard и стор
const FOLK_CATEGORIES = ['folk', 'народная', 'народные', 'russian_folk', 'народная сказка'];

function isFolkCategory(category) {
  if (!category) return false;
  const lower = category.toLowerCase();
  return FOLK_CATEGORIES.some((k) => lower.includes(k));
}

function mapFairyTale(item) {
  return {
    id:            item.id,
    type:          'fairy_tale',
    title:         item.title,
    description:   item.description ?? '',
    age:           String(item.age),
    duration:      0,
    emotions:      [],
    themes:        [],
    image:         item.preview_url ?? null,
    isFavorite:    false,
    isNew:         false,
    isPremium:     false,
    isRussianFolk: isFolkCategory(item.category),
    category:      item.category ?? null,
    accessLvl:     item.access_lvl ?? 0,
  };
}
 
function mapLullaby(item) {
  return {
    id:          item.id,
    type:        'lullaby',
    title:       item.title,
    description: '',
    age:         item.age,
    duration:    0,
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
    accessLvl:   item.access_lvl ?? 0,
  };
}

function mapTherapy(item) {
  return {
    id:          item.id,
    type:        'therapy',
    title:       item.title,
    description: item.description ?? '',
    age:         item.age,
    duration:    0,
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
    accessLvl:   item.access_lvl ?? 0,
  };
}

function mapFamilyStory(item) {
  return {
    id:          item.id,
    type:        'family_story',
    title:       item.title,
    description: item.description ?? '',
    age:         item.age,
    duration:    0,
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
    category:    item.category ?? null,
    accessLvl:   item.access_lvl ?? 0,
  };
}

function mapPoem(item) {
  return {
    id:          item.id,
    type:        'poem',
    title:       item.title,
    description: '',
    age:         item.age,
    duration:    0,
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
    accessLvl:   item.access_lvl ?? 0,
  };
}

function mapStory(item) {
  return {
    id:          item.id,
    type:        'story',
    title:       item.title,
    description: item.description ?? '',
    age:         item.age,
    duration:    0,
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
    accessLvl:   item.access_lvl ?? 0,
  };
}

// Загрузить контент по типу — вызывается из library.store.js
export async function getLibraryItems(type) {
  if (type === 'fairy_tale') {
    const data = await api.get('/api/content/fairy-tales?skip=0&limit=100');
    return data.map(mapFairyTale);
  }

  if (type === 'lullaby') {
    const data = await api.get('/api/content/lullabies?skip=0&limit=100');
    return data.map(mapLullaby);
  }

  if (type === 'therapy') {
    const data = await api.get('/api/content/therapies?skip=0&limit=100');
    return data.map(mapTherapy);
  }

  if (type === 'family_story') {
    const data = await api.get('/api/content/family-stories?skip=0&limit=100');
    return data.map(mapFamilyStory);
  }

  if (type === 'poem') {
    // Вкладка в UI называется "Рассказы и стихи" — показываем оба реальных
    // типа контента (poem + story) в одном списке. item.type у каждой
    // карточки остаётся точным ('poem' или 'story'), чтобы генерация
    // озвучки (POST /generations) уходила с правильным content_type.
    const [poems, stories] = await Promise.all([
      api.get('/api/content/poems?skip=0&limit=100'),
      api.get('/api/content/stories?skip=0&limit=100'),
    ]);
    return [...poems.map(mapPoem), ...stories.map(mapStory)];
  }

  return [];
}
