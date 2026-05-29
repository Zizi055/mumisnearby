// POST /voices/add — multipart/form-data
// Поля: name (обязательно), file (обязательно — .mp3 или .wav), description (опционально)
export async function uploadVoice(file, description = '') {
  const formData = new FormData();
  formData.append('name', file.name);
  formData.append('file', file);
  if (description) formData.append('description', description);

  return api.post('/voices/add', formData);
}

// GET /voices/
export async function getVoices() {
  return api.get('/voices/');
}

// GET /voices/{voice_id}
export async function getVoiceById(id) {
  return api.get(`/voices/${id}`);
}

// DELETE /voices/{voice_id}
export async function deleteVoice(id) {
  return api.del(`/voices/${id}`);
}

// Эти эндпоинты отсутствуют в документации - надо добавить
export async function renameVoice(id, name) {
  return api.patch(`/voices/${id}`, { name });
}

export async function uploadVoiceAvatar(id, file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post(`/voices/${id}/avatar`, formData);
}

export async function updateVoiceSettings(id, settings) {
  return api.patch(`/voices/${id}/settings`, settings);
}
