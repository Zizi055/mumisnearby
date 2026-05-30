import { api } from './client';
 
// Маппинг полей бэкенда в формат который ожидает LibraryCard и стор
function mapFairyTale(item) {
  return {
    id:          item.id,
    type:        'fairy_tale',
    title:       item.title,
    description: item.description ?? '',
    age:         String(item.age),
    duration:    0,                        // бэкенд не возвращает — пока 0
    emotions:    [],
    themes:      [],
    image:       item.preview_url ?? null,
    isFavorite:  false,
    isNew:       false,
    isPremium:   false,
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
 
  // family_story — нет эндпоинта на бэкенде, возвращаем пустой массив
  return [];
}
 
// Остальные функции — уточни у бэкенда есть ли они
export async function generateStory(payload) {
  return api.post('/stories/generate', payload);
}
 
export async function getStory(id) {
  return api.get(`/stories/${id}`);
}
 
export async function toggleFavorite(id) {
  return api.post(`/library/${id}/favorite`);
}
 