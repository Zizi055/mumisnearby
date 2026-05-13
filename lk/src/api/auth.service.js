import { api } from './client';

// Регистрация
// POST /auth/register
// body: { name, email, password }
// response: { id, name, email, token }
export async function register({ name, email, password }) {
  const data = await api.post('/auth/register', { name, email, password });

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  return data;
}

// Вход
// POST /auth/login
// body: { email, password }
// response: { id, name, email, token }
export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password });

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  return data;
}

// Выход
// POST /auth/logout
export async function logout() {
  await api.post('/auth/logout', {});
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Получить текущего пользователя
// GET /auth/me
// response: { id, name, email }
export async function getMe() {
  return api.get('/auth/me');
}
