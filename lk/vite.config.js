import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Редакция задаётся переменной окружения при сборке:
//
//   npm run build        → B2C (rodnyegolosa.ru)
//   npm run build:b2b    → B2B (rodnoygolos.ru)
//
// Значение по умолчанию — b2c. Это важно: если кто-то соберёт без флага,
// получится привычная версия для частных клиентов, а не полусобранная
// корпоративная.
export default defineConfig(() => {
  const edition = process.env.VITE_EDITION === 'b2b' ? 'b2b' : 'b2c';

  return {
    plugins: [react()],

    base: '/lk/',

    define: {
      // Пробрасываем явно, а не через .env-файлы: флаг приходит из
      // команды сборки, и держать два .env на сервере — лишний способ
      // перепутать, какую редакцию выкатили.
      'import.meta.env.VITE_EDITION': JSON.stringify(edition),
    },

    build: {
      // Отдельная папка на редакцию: иначе вторая сборка затирает первую,
      // и на один из двух доменов уезжает чужой кабинет.
      outDir: edition === 'b2b' ? 'dist-b2b' : 'dist',
      emptyOutDir: true,
    },
  };
})
