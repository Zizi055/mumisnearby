// Локальные переключатели кабинета. Серверных эндпоинтов у них нет,
// поэтому значение живёт в браузере и не сбрасывается при обновлении.

const KEY = 'lk-prefs';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function readPref(name, fallback) {
  const all = readAll();
  return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : fallback;
}

export function writePref(name, value) {
  const all = readAll();
  all[name] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* приватный режим */
  }
}
