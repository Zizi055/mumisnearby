const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Хранилище в памяти (для dev-режима) ─────────────────────────────────────
// В продакшене это должно быть в БД (PostgreSQL)
const users = new Map();     // token → { id, email, referral_code, invites, balance_discount }
const referrals = new Map(); // referral_code → owner_token

// Создаём тестового пользователя
const TEST_TOKEN = 'test-token-123';
const TEST_CODE  = 'ZIZI2025';
users.set(TEST_TOKEN, {
  id: 1,
  email: 'test@rodnyegolosa.ru',
  referral_code: TEST_CODE,
  invited_count: 2,
  max_invites: 10,
  balance_discount: 0,       // % скидки на балансе
  weekly_content: true,
});
referrals.set(TEST_CODE, TEST_TOKEN);

// ── Middleware: авторизация по Bearer-токену ──────────────────────────────────
function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.replace('Bearer ', '').trim();

  if (!token) return res.status(401).json({ detail: 'Not authenticated' });

  if (!users.has(token)) {
    // В dev-режиме автоматически создаём пользователя для нового токена
    const code = 'REF' + Math.random().toString(36).slice(2, 8).toUpperCase();
    users.set(token, {
      id: Date.now(),
      email: 'user@rodnyegolosa.ru',
      referral_code: code,
      invited_count: 0,
      max_invites: 10,
      balance_discount: 0,
      weekly_content: true,
    });
    referrals.set(code, token);
  }

  req.user = users.get(token);
  req.token = token;
  next();
}

// ── GET /api/subscription/bonus ───────────────────────────────────────────────
app.get('/api/subscription/bonus', auth, (req, res) => {
  const u = req.user;
  res.json({
    referral_code:  u.referral_code,
    invited_count:  u.invited_count,
    max_invites:    u.max_invites,
    weekly_content: u.weekly_content,
    balance_discount: u.balance_discount,  // % скидки за приглашения
  });
});

// ── POST /api/subscription/bonus/claim ───────────────────────────────────────
app.post('/api/subscription/bonus/claim', auth, (req, res) => {
  const u = req.user;
  if (u.invited_count < u.max_invites) {
    return res.status(400).json({ detail: 'Не набрано достаточно приглашений' });
  }
  // Начисляем 1 месяц бесплатно (флаг на сервере)
  u.bonus_claimed = true;
  res.json({ ok: true, message: 'Бонус начислен — 1 месяц бесплатно' });
});

// ── POST /api/referral/apply ──────────────────────────────────────────────────
// Вызывается при регистрации нового пользователя с реферальным кодом
app.post('/api/referral/apply', auth, (req, res) => {
  const { referral_code } = req.body;
  if (!referral_code) return res.status(400).json({ detail: 'Не передан referral_code' });

  const ownerToken = referrals.get(referral_code.toUpperCase());
  if (!ownerToken) return res.status(404).json({ detail: 'Реферальный код не найден' });

  const owner = users.get(ownerToken);
  const newUser = req.user;

  // Защита: нельзя применить свой же код
  if (ownerToken === req.token) {
    return res.status(400).json({ detail: 'Нельзя использовать собственный реферальный код' });
  }

  // Начисляем новому пользователю скидку 10% (хранится на балансе)
  const NEW_USER_DISCOUNT = 10;
  newUser.balance_discount = Math.min((newUser.balance_discount || 0) + NEW_USER_DISCOUNT, 30);
  newUser.referral_applied = referral_code.toUpperCase();

  // Увеличиваем счётчик у владельца кода
  owner.invited_count = (owner.invited_count || 0) + 1;

  // Если владелец набрал 5+ приглашений — даём ему +5% скидку
  if (owner.invited_count % 5 === 0) {
    owner.balance_discount = Math.min((owner.balance_discount || 0) + 5, 50);
  }

  console.log(`[referral] ${newUser.email} применил код ${referral_code} → скидка ${NEW_USER_DISCOUNT}% | владелец: приглашений ${owner.invited_count}`);

  res.json({
    ok: true,
    discount_percent: NEW_USER_DISCOUNT,
    message: `Скидка ${NEW_USER_DISCOUNT}% добавлена на ваш баланс`,
  });
});

// ── GET /api/referral/discount ────────────────────────────────────────────────
// Текущая скидка пользователя на балансе
app.get('/api/referral/discount', auth, (req, res) => {
  res.json({
    discount_percent: req.user.balance_discount || 0,
    referral_applied: req.user.referral_applied || null,
  });
});

// ── Health-check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, env: 'dev2' }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`\n✅ Bonus server запущен → http://localhost:${PORT}`);
  console.log(`   Тестовый токен: Bearer ${TEST_TOKEN}`);
  console.log(`   Тестовый код:   ${TEST_CODE}\n`);
});
