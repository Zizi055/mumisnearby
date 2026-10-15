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
if (isB2B) {
  document.documentElement.classList.add('theme-b2b');
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