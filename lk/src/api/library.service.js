import { api } from './client';

export async function getLibraryItems(type) {
  return api.get(`/library?type=${type}`);
}

export async function generateStory(payload) {
  return api.post('/stories/generate', payload);
}

export async function getStory(id) {
  return api.get(`/stories/${id}`);
}

export async function toggleFavorite(id) {
  return api.post(`/library/${id}/favorite`);
}