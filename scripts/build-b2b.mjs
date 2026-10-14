// Сборка только корпоративной версии.
//
// Зачем отдельный сценарий, а не одна команда: `vite build` чистит всю
// папку dist перед сборкой, а в ней лежит dist/lk — собранный кабинет
// «Родных голосов». Обычный `npm run build` это переживает, потому что
// следом пересобирает кабинет заново и копирует обратно. Нам же нужно
// НЕ трогать B2C: мы сохраняем готовую сборку и возвращаем её на место
// как есть, не пересобирая.
//
// Что получится после запуска:
//   dist/index.html        — лендинг B2C (перегенерирован, исходник тот же)
//   dist/b2b.html          — лендинг B2B (наши правки)
//   dist/lk/               — кабинет B2C, ровно тот, что был до запуска
//   lk/dist-b2b/           — кабинет B2B (наши правки)
//
// Почему index.html всё же перегенерируется: лендинги — одна сборка
// vite с тремя точками входа, разделить их нельзя. Содержимое страницы
// при этом не меняется, может смениться только хеш в имени общего CSS.

import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const b2cLk = join(root, 'dist', 'lk');

function run(cmd, cwd = root) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Прячем готовый кабинет B2C во временную папку.
let stash = null;

if (existsSync(b2cLk)) {
  stash = mkdtempSync(join(tmpdir(), 'lk-b2c-'));
  cpSync(b2cLk, join(stash, 'lk'), { recursive: true });
  console.log('Кабинет B2C сохранён, пересобирать его не будем');
} else {
  console.log('Кабинета B2C в dist нет — восстанавливать нечего');
}

// 2. Лендинги. Здесь dist очищается целиком.
run('npx vite build');

// 3. Возвращаем кабинет B2C на место — именно тот, что был.
if (stash) {
  cpSync(join(stash, 'lk'), b2cLk, { recursive: true });
  rmSync(stash, { recursive: true, force: true });
  console.log('Кабинет B2C возвращён в dist/lk без пересборки');
}

// 4. Кабинет B2B — в свою папку, dist/lk не затрагивает.
run('npm install', join(root, 'lk'));
run('npm run build:b2b', join(root, 'lk'));

console.log('\nГотово. B2C-кабинет не пересобирался.');
