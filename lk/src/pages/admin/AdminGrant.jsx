import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gift, AlertTriangle } from 'lucide-react';
import { grantSubscription } from '../../api/admin.service';
import { PLAN_ID_MAP } from '../../data/planIdMap';
import { tariffs } from '../../data/tariffs.data';

// ─────────────────────────────────────────────────────────────────────
// Ручная выдача подписки — POST /subscription/admin/grant.
//
// Единственный легальный способ включить тариф без оплаты. Раньше это
// умел POST /subscription/activate, доступный вообще любому залогиненному
// пользователю: он мог выдать себе «Волшебника» на год бесплатно. По
// итогам security-ревью (критичный пункт №3) эндпоинт удалили, а выдачу
// оставили только админам.
//
// Нужно для возвратов, компенсаций за сбои и ручной активации, когда
// оплата прошла мимо ЮKassa.
// ─────────────────────────────────────────────────────────────────────

// Тарифы, которые реально можно выдать: у «Конструктора» числового
// plan_id нет, демо-тариф через этот эндпоинт не выдаётся.
function todayStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const GRANTABLE = tariffs
  .filter((t) => PLAN_ID_MAP[t.id])
  .map((t) => ({ id: PLAN_ID_MAP[t.id], name: t.name }));

export default function AdminGrant() {
  // Со страницы «Пользователи» приходим с уже известным ID — подставляем
  // его, чтобы админ не переписывал число руками и не ошибся.
  const [params] = useSearchParams();

  const [userId, setUserId] = useState(params.get('user') ?? '');
  const [planId, setPlanId] = useState(String(GRANTABLE[0]?.id ?? ''));
  const [expiresOn, setExpiresOn] = useState(defaultExpiryDate);

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');
  const [granted, setGranted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Укажите числовой ID пользователя.');
      setStatus('error');
      return;
    }

    if (!expiresOn || expiresOn < todayStamp()) {
      setError('Укажите дату окончания не раньше сегодняшнего дня.');
      setStatus('error');
      return;
    }

    const plan = GRANTABLE.find((p) => String(p.id) === String(planId));

    setStatus('loading');
    setError('');

    try {
      const expiresAt = `${expiresOn}T23:59:59+03:00`;
      await grantSubscription({ userId: id, planId, expiresAt });

      setGranted({
        userId: id,
        planName: plan?.name ?? `тариф #${planId}`,
        until: new Date(expiresAt).toLocaleDateString('ru-RU'),
      });
      setStatus('success');
      setUserId('');
    } catch (err) {
      // 404 — неизвестный пользователь или тариф.
      setError(
        /404|не найден/i.test(err.message || '')
          ? 'Пользователь или тариф не найден. Проверьте ID.'
          : err.message || 'Не удалось выдать подписку'
      );
      setStatus('error');
    }
  };

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Выдать подписку</h1>
        </div>
      </header>

      <div className="lk-admin-detail">
        <h2 className="lk-admin-detail__title">Ручная активация тарифа</h2>

        <p className="lk-admin-detail__hint lk-admin-detail__hint--warn">
          <AlertTriangle size={14} />
          Подписка включится сразу и без оплаты. Используйте для возвратов,
          компенсаций и платежей, прошедших мимо ЮKassa.
        </p>

        <form className="lk-admin-form" onSubmit={handleSubmit}>
          <label className="lk-admin-login__field">
            <span>ID пользователя</span>
            <input
              type="number"
              min="1"
              value={userId}
              placeholder="например 42"
              onChange={(e) => setUserId(e.target.value)}
            />
          </label>

          <label className="lk-admin-login__field">
            <span>Тариф</span>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {GRANTABLE.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID {p.id})
                </option>
              ))}
            </select>
          </label>

          <label className="lk-admin-login__field">
            <span>Действует до</span>
            <input
              type="date"
              value={expiresOn}
              min={todayStamp()}
              required
              onChange={(e) => setExpiresOn(e.target.value)}
            />
          </label>

          {status === 'error' && (
            <div className="lk-admin-login__error lk-admin-form__full">{error}</div>
          )}

          {status === 'success' && granted && (
            <div className="lk-admin-login__success lk-admin-form__full">
              Пользователю #{granted.userId} выдан «{granted.planName}»
              до {granted.until}.
            </div>
          )}

          <div className="lk-admin-form__actions">
            <button type="submit" disabled={status === 'loading'}>
              <Gift size={15} />
              {status === 'loading' ? 'Выдаём…' : 'Выдать подписку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
