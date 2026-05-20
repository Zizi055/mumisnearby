import { api } from './client';

export async function register({ name, email, password }) {
  const data = await api.post('/auth/register', {
    username: name,
    email,
    password,
  });

  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }

  return { ...data, name: data.username ?? name };
}

export async function login({ email, password }) {
  // FastAPI OAuth2 ждёт form-data, не JSON
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }

  return { ...data, name: data.username ?? email };
}

export async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function getMe() {
  return api.get('/auth/who_am_i');
}