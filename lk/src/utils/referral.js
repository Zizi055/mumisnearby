// Захват реферального кода при заходе на ЛК.
//
// Ссылка может привести на разные точки входа:
//   1. Через маркетинговый сайт (rodnyegolosa.ru/?ref=CODE, /ref/CODE,
//      /invite/CODE) — там код уже ловит main.js и кладёт в localStorage
//      до перехода в /lk/.
//   2. Напрямую в приложение ЛК (/lk/?ref=CODE#/auth или
//      /lk/#/auth?ref=CODE) — main.js на этой странице не подключён
//      (отдельная сборка), поэтому код нужно ловить здесь же.
//
// Приложение живёт на HashRouter, поэтому query-параметр может оказаться
// как в обычной query-строке (до #), так и внутри самого hash-роута
// (после #) — проверяем оба варианта.
const REF_STORAGE_KEY = 'ref_code';

function extractRefCode() {
  // Обычная query-строка: /lk/?ref=CODE#/auth
  const search = new URLSearchParams(window.location.search);
  let code = search.get('ref');

  const hash = window.location.hash || '';

  // Query-строка внутри hash-роута: /lk/#/auth?ref=CODE
  if (!code) {
    const queryStart = hash.indexOf('?');
    if (queryStart !== -1) {
      const hashParams = new URLSearchParams(hash.slice(queryStart + 1));
      code = hashParams.get('ref');
    }
  }

  // Путь вида /ref/CODE внутри hash-роута: /lk/#/ref/CODE
  if (!code) {
    code = hash.match(/\/ref\/([A-Z0-9]+)/i)?.[1] || null;
  }

  return code ? code.toUpperCase() : null;
}

// Вызывать один раз при загрузке приложения (см. App.jsx) — если код есть
// в адресе, сохраняем его на случай, если регистрация произойдёт позже
// (пользователь сначала осмотрелся, зарегистрировался в другой раз).
export function captureReferralCode() {
  const code = extractRefCode();
  if (code) {
    localStorage.setItem(REF_STORAGE_KEY, code);
  }
}

export function getStoredReferralCode() {
  return localStorage.getItem(REF_STORAGE_KEY);
}

// Вызывать после того как referral_code реально ушёл на бэк при регистрации.
export function clearStoredReferralCode() {
  localStorage.removeItem(REF_STORAGE_KEY);
}
