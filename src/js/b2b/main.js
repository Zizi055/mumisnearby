/**
 * Точка входа корпоративного лендинга (rodnoygolos.ru).
 *
 * Отдельная от main.js «Родных голосов»: там половина кода обслуживает
 * конструктор, программу лояльности и реферальные ссылки, которых в
 * корпоративной версии нет по ТЗ.
 */

import '../../scss/b2b.scss';

import { initMobileMenu, initSectionHighlight } from './navigation.js';
import { initVoiceWave } from './voice-wave.js';
import { initPlayers } from './player.js';
import { initAccordion } from './accordion.js';
import { initLeadForms } from './lead-form.js';
import { initReveal } from './reveal.js';

function bootstrap() {
  initMobileMenu();
  initSectionHighlight();
  initVoiceWave(document.querySelector('[data-voice-wave]'));
  initPlayers();
  initAccordion();
  initLeadForms();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
