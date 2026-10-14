import { defineConfig } from 'vite'
import { resolve } from 'path'

// Маркетинговые страницы. B2B-лендинг (b2b.html) — отдельная точка входа
// в той же сборке: тексты по корпоративному ТЗ переписаны целиком, а стили
// и скрипты общие с главной. Дублировать 8 тысяч строк SCSS, чтобы
// поменять заголовки, смысла нет.
//
// constructor.html остаётся только в B2C: по ТЗ «Конструктор убрать
// совсем», и на B2B-домене ссылок на него нет.
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        constructor: resolve(__dirname, 'constructor.html'),
        b2b: resolve(__dirname, 'b2b.html'),
        // privacy.html лежала в корне, но в список входов не попадала —
        // vite её не копировал, и ссылка «Политика конфиденциальности»
        // отдавала 404 на обоих доменах. Страница самостоятельная, без
        // стилей сборки, так что добавление её только копирует.
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
})
