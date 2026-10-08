import { useEffect, useState } from 'react';
import { Loader, Save, Info } from 'lucide-react';
import { getCompany, updateCompany } from '../../api/b2b.service';
import { isNotImplemented } from '../../api/hrClient';
import { tariffs } from '../../data/tariffs.data';
import { getTariffSlug } from '../../data/planIdMap';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Данные компании и состояние подписки.
//
// Тариф и количество мест здесь только показываются, но не меняются:
// и то и другое влияет на сумму к оплате, поэтому идёт через оплату или
// через менеджера, а не через тихое сохранение формы.
// ─────────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  trial: 'пробный период',
  active: 'активна',
  expired: 'истекла',
  cancelled: 'отменена',
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

export default function HrCompany() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', inn: '', contactName: '', contactPhone: '' });

  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const data = await getCompany();
      setCompany(data);
      setForm({
        name: data?.name ?? '',
        inn: data?.inn ?? '',
        contactName: data?.contact_name ?? '',
        contactPhone: data?.contact_phone ?? '',
      });
      setStatus('ready');
    } catch (err) {
      if (isNotImplemented(err)) {
        setStatus('pending');
        return;
      }
      setError(err.message || 'Не удалось загрузить данные компании');
      setStatus('failed');
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const data = await updateCompany(form);
      setCompany(data ?? company);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'pending') return <HrPending what="Данные компании" />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const slug = getTariffSlug(company?.plan_id);
  const plan = tariffs.find((t) => t.id === slug);
  const seats = company?.seats_total ?? 0;

  return (
    <div className="lk-hr-page">
      <header className="lk-hr-page__head">
        <div>
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Компания</h1>
        </div>
      </header>

      {status === 'loading' && (
        <div className="lk-hr-loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-hr-pending">
          <h2>Не удалось загрузить данные</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <section className="lk-hr-card">
            <h2 className="lk-hr-card__title">Подписка</h2>

            <dl className="lk-hr-dl">
              <dt>Тариф</dt>
              <dd>{plan?.name ?? `#${company?.plan_id ?? '—'}`}</dd>

              <dt>Статус</dt>
              <dd>
                <em className={`lk-hr-status lk-hr-status--${company?.status}`}>
                  {STATUS_LABELS[company?.status] ?? company?.status ?? '—'}
                </em>
              </dd>

              <dt>Мест оплачено</dt>
              <dd>{seats}</dd>

              {plan?.priceYear && seats > 0 && (
                <>
                  <dt>Стоимость в год</dt>
                  <dd>
                    {formatMoney(plan.priceYear * seats)}
                    <em> — {formatMoney(plan.priceYear)} за сотрудника</em>
                  </dd>
                </>
              )}

              <dt>Действует с</dt>
              <dd>{formatDate(company?.started_at)}</dd>

              <dt>Действует до</dt>
              <dd>{formatDate(company?.expires_at)}</dd>
            </dl>

            <p className="lk-hr-hint">
              <Info size={14} />
              Сменить тариф или докупить места можно через персонального
              менеджера — это меняет сумму к оплате.
            </p>
          </section>

          <section className="lk-hr-card">
            <h2 className="lk-hr-card__title">Реквизиты и контакты</h2>

            <form className="lk-hr-form lk-hr-form--grid" onSubmit={handleSave}>
              <label className="lk-hr-field">
                <span>Название компании</span>
                <input type="text" value={form.name} required onChange={set('name')} />
              </label>

              <label className="lk-hr-field">
                <span>ИНН</span>
                <input type="text" value={form.inn} inputMode="numeric" onChange={set('inn')} />
              </label>

              <label className="lk-hr-field">
                <span>Контактное лицо</span>
                <input
                  type="text"
                  value={form.contactName}
                  required
                  onChange={set('contactName')}
                />
              </label>

              <label className="lk-hr-field">
                <span>Телефон</span>
                <input type="tel" value={form.contactPhone} onChange={set('contactPhone')} />
              </label>

              {/* Почта не редактируется: она же логин HR. Смена логина —
                  отдельная процедура с подтверждением, как в клиентском
                  кабинете, а не поле в общей форме. */}
              <label className="lk-hr-field">
                <span>Почта <em>— логин, менять через поддержку</em></span>
                <input type="email" value={company?.contact_email ?? ''} disabled />
              </label>

              {error && <div className="lk-hr-error lk-hr-form__full">{error}</div>}

              {saved && (
                <div className="lk-hr-success lk-hr-form__full">Изменения сохранены.</div>
              )}

              <div className="lk-hr-form__full">
                <button
                  type="submit"
                  className="lk-btn lk-btn--primary lk-btn--md"
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
