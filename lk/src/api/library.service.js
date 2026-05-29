import { api } from './client';

export async function getLibraryItems(type) {

  switch (type) {

    case 'fairy_tale':

      return api.get('/content/fairy-tales');

    case 'lullaby':

      return api.get('/content/lullabies');

    case 'therapy':

      return api.get('/content/therapies');

    default:

      return api.get('/content/fairy-tales');

  }

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