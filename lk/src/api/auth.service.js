import { api } from './client';

export async function register({ name, email, password }) {
  const data = await api.post('/auth/register', {
    username: name,   // ← бэк ждёт username
    email,
    password,
  });

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  // бэк возвращает username — переименовываем в name для фронта
  return { ...data, name: data.username ?? data.name };
}

export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password });

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  return { ...data, name: data.username ?? data.name };
}

export async function logout() {
  await api.post('/auth/logout', {});
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function getMe() {
  return api.get('/auth/me');
}