import { useEffect, useState } from 'react';
import { Loader, Save, Info, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  getCompanyProfile,
  changeCompanyPassword,
  getSlots,
  readSlotLevel,
  logoutCompany,
} from '../../api/company.service';
import { isNotImplemented } from '../../api/companyClient';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Карточка компании: реквизиты, договор, пакет слотов, смена пароля.
//
// Реквизиты и пакет компания НЕ редактирует — их задаёт администратор
// сервиса при заключении договора. Единственное, что здесь можно
// изменить, — пароль. Поэтому поля показаны только для чтения, а не
// формой с неработающей кнопкой «Сохранить».
// ─────────────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  1: 'Уровень 1 · Сказочник',
  2: 'Уровень 2 · Хранитель',
  3: 'Уровень 3 · Волшебник',
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

export default function HrCompany() {
  const [company, setCompany] = useState(null);
  const [slots, setSlots] = useState(null);

  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');

  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', repeat: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const [profile, slotsData] = await Promise.all([getCompanyProfile(), getSlots()]);
      setCompany(profile);
      setSlots(slotsData);
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

  const handlePassword = async (e) => {
    e.preventDefault();

    if (pwd.newPassword.length < 8) {
      setPwdError('Новый пароль должен быть не короче 8 символов.');
      return;
    }

    if (pwd.newPassword !== pwd.repeat) {
      setPwdError('Пароли не совпадают.');
      return;
    }

    setSaving(true);
    setPwdError('');
    setSaved(false);

    try {
      await changeCompanyPassword(pwd);

      setSaved(true);
      setPwd({ oldPassword: '', newPassword: '', repeat: '' });

      // Бэк инвалидирует токен сразу после смены пароля, поэтому любой
      // следующий запрос дал бы 401 посреди работы. Выходим сами и
      // предупреждаем — так понятнее, чем внезапный выброс на вход.
      setTimeout(() => {
        logoutCompany();
        window.location.hash = '/company/login';
      }, 2200);
    } catch (err) {
      setPwdError(err.message || 'Не удалось сменить пароль');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'pending') return <HrPending what="Данные компании" />;

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
          <AlertCircle size={26} />
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
            <h2 className="lk-hr-card__title">Реквизиты и договор</h2>

            <dl className="lk-hr-dl">
              <dt>Название</dt>
              <dd>{company?.name ?? '—'}</dd>

              <dt>ИНН</dt>
              <dd>{company?.inn ?? '—'}</dd>

              <dt>Почта</dt>
              <dd>{company?.email ?? '—'}</dd>

              <dt>Телефон</dt>
              <dd>{company?.phone || '—'}</dd>

              <dt>Статус</dt>
              <dd>
                <em
                  className={`lk-hr-status lk-hr-status--${
                    company?.is_active === false ? 'cancelled' : 'active'
                  }`}
                >
                  {company?.is_active === false ? 'приостановлен' : 'активен'}
                </em>
              </dd>

              <dt>Договор до</dt>
              <dd>{formatDate(company?.expires_at)}</dd>
            </dl>

            <p className="lk-hr-hint">
              <Info size={14} />
              Реквизиты, количество мест и срок договора меняет менеджер
              сервиса — напишите ему, если что-то нужно поправить.
            </p>
          </section>

          <section className="lk-hr-card">
            <h2 className="lk-hr-card__title">Пакет</h2>

            <dl className="lk-hr-dl">
              <dt>Мест всего</dt>
              <dd>
                {slots?.staff_limit ?? 0}
                <em> — занято {slots?.staff_used ?? 0}</em>
              </dd>

              {[1, 2, 3].map((lvl) => {
                const l = readSlotLevel(slots, lvl);
                if (l.limit === 0) return null;

                return (
                  <div key={lvl} style={{ display: 'contents' }}>
                    <dt>{LEVEL_LABELS[lvl]}</dt>
                    <dd>
                      {l.used} из {l.limit}
                      <em>{l.free > 0 ? ` — свободно ${l.free}` : ' — слоты закончились'}</em>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="lk-hr-card">
            <h2 className="lk-hr-card__title">Смена пароля</h2>

            <form className="lk-hr-form lk-hr-form--grid" onSubmit={handlePassword}>
              <label className="lk-hr-field">
                <span>Текущий пароль</span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd.oldPassword}
                  required
                  autoComplete="current-password"
                  onChange={(e) => setPwd((p) => ({ ...p, oldPassword: e.target.value }))}
                />
              </label>

              <label className="lk-hr-field">
                <span>Новый пароль <em>— минимум 8 символов</em></span>
                <div className="lk-hr-field__password">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd.newPassword}
                    required
                    autoComplete="new-password"
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Скрыть пароли' : 'Показать пароли'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="lk-hr-field">
                <span>Повторите новый</span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd.repeat}
                  required
                  autoComplete="new-password"
                  onChange={(e) => setPwd((p) => ({ ...p, repeat: e.target.value }))}
                />
              </label>

              <p className="lk-hr-hint lk-hr-form__full">
                <Info size={14} />
                После смены пароля текущая сессия закроется — нужно будет войти
                заново.
              </p>

              {pwdError && <div className="lk-hr-error lk-hr-form__full">{pwdError}</div>}

              {saved && (
                <div className="lk-hr-success lk-hr-form__full">
                  Пароль изменён. Сейчас переведём вас на страницу входа.
                </div>
              )}

              <div className="lk-hr-form__full">
                <button
                  type="submit"
                  className="lk-btn lk-btn--primary lk-btn--md"
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? 'Сохраняем…' : 'Сменить пароль'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
