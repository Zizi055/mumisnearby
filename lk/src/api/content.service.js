import { api } from './client';

// Сказки
// GET /api/content/fairy-tales?skip=0&limit=50
// Возвращает: [{ id, title, description, category, age, preview_url }]
export async function getFairyTales(skip = 0, limit = 50) {
  return api.get(`/api/content/fairy-tales?skip=${skip}&limit=${limit}`);
}

// Колыбельные
// GET /api/content/lullabies?skip=0&limit=50
// Возвращает: [{ id, title, age, preview_url }]
export async function getLullabies(skip = 0, limit = 50) {
  return api.get(`/api/content/lullabies?skip=${skip}&limit=${limit}`);
}

// Терапевтические сценарии
// GET /api/content/therapies?skip=0&limit=50
// Возвращает: [{ id, title, description, age, preview_url }]
export async function getTherapies(skip = 0, limit = 50) {
  return api.get(`/api/content/therapies?skip=${skip}&limit=${limit}`);
}
