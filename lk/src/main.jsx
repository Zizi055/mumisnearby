import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { HashRouter } from 'react-router-dom';

import App from './App.jsx';

import {
  AuthProvider,
} from './context/AuthContext';

import './styles/scss/style.scss';
import { isB2B } from './config/edition';

// Графитовая тема корпоративной редакции. Класс ставится до первого
// рендера, поэтому кабинет не успевает мигнуть зелёной палитрой.
//
// Montserrat подключается здесь же, а не в index.html: файл общий для
// обеих сборок, и у «Родных голосов» этот шрифт не используется —
// незачем тянуть две сотни килобайт на каждую загрузку их кабинета.
// Веса те же, что на корпоративном лендинге, иначе 800-й начертание
// подменится синтетическим жирным и заголовки поедут.
if (isB2B) {
  document.documentElement.classList.add('theme-b2b');

  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href =
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(font);
}

createRoot(
  document.getElementById('root')
).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);