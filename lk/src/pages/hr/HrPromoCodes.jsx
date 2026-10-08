import { useEffect, useState } from 'react';
import {
  Loader,
  RefreshCw,
  Ticket,
  Copy,
  Check,
  Ban,
  Download,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import {
  getPromoCodes,
  createPromoCodes,
  deactivatePromoCode,
  getCompanyStats,
} from '../../api/b2b.service';
import { isNotImplemented } from '../../api/hrClient';
import { tariffs } from '../../data/tariffs.data';
import { PLAN_ID_MAP, getTariffSlug } from '../../data/planIdMap';
import HrPending from '../../components/hr/HrPending';
import PromoQr, { promoActivationUrl } from '../../components/hr/PromoQr';

// ─────────────────────────────────────────────────────────────────────
// Промокоды: генерация пачкой, список, деактивация.
//
// Главное ограничение, которое должно быть видно ДО нажатия кнопки:
// выдать кодов больше, чем оплачено мест, нельзя. Иначе сотрудник
// активирует код и получит отказ — это хуже, чем не получить код вовсе.
// Поэтому свободные места показаны рядом с полем количества, а поле
// ограничено сверху.
// ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'used', label: 'Использованные' },
  { id: 'expired', label: 'Просроченные' },
  { id: 'deactivated', label: 'Отключённые' },
];

const STATUS_LABELS = {
  active: 'активен',
  used: 'использован',
  expired: 'просрочен',
  deactivated: 'отключён',
};

const GRANTABLE = tariffs.filter((t) => PLAN_ID_MAP[t.id]);

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function planName(planId) {
  const slug = getTariffSlug(planId);
  return tariffs.find((t) => t.id === slug)?.name ?? `тариф #${planId}`;
}

// Срок по умолчанию — через 90 дней: достаточно, чтобы HR успел раздать
// коды и напомнить, но не настолько долго, чтобы забытый код жил годами.
function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export default function HrPromoCodes() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const [seatsFree, setSeatsFree] = useState(null);

  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    count: '5',
    planId: String(PLAN_ID_MAP[GRANTABLE[1]?.id ?? GRANTABLE[0]?.id] ?? ''),
    expiresAt: defaultExpiry(),
    maxActivations: '1',
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [justCreated, setJustCreated] = useState([]);

  const [copied, setCopied] = useState(null);
  const [qrFor, setQrFor] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const data = await getPromoCodes({ status: filter, page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
      setStatus('ready');
    } catch (err) {
      if (isNotImplemented(err)) {
        setStatus('pending');
        return;
      }
      setError(err.message || 'Не удалось загрузить промокоды');
      setStatus('failed');
      return;
    }

    // Свободные места — отдельный запрос; если он не прошёл, список всё
    // равно показываем, просто без подсказки о лимите.
    try {
      const stats = await getCompanyStats();
      setSeatsFree(stats?.seats_free ?? null);
    } catch {
      setSeatsFree(null);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();

    const count = Number(form.count);

    if (!Number.isInteger(count) || count < 1) {
      setCreateError('Укажите количество кодов — минимум один.');
      return;
    }

    if (seatsFree != null && count > seatsFree) {
      setCreateError(
        `Свободно ${seatsFree} ${seatsFree === 1 ? 'место' : 'мест'} — больше кодов выдать нельзя. Докупите места или уменьшите количество.`
      );
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const created = await createPromoCodes({
        count,
        planId: form.planId,
        expiresAt: form.expiresAt,
        maxActivations: form.maxActivations,
      });

      setJustCreated(created);
      setPage(1);
      setFilter('all');
      await load();
    } catch (err) {
      setCreateError(err.message || 'Не удалось создать промокоды');
    } finally {
      setCreating(false);
    }
  };

  async function handleDeactivate(code) {
    try {
      await deactivatePromoCode(code);
      setItems((list) =>
        list.map((p) => (p.code === code ? { ...p, status: 'deactivated' } : p))
      );
    } catch (err) {
      setError(err.message || 'Не удалось отключить код');
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  // Выгрузка в CSV — HR рассылает коды через свою систему или печатает.
  // Разделитель «;» и BOM: иначе Excel в русской локали сваливает всё в
  // одну колонку и ломает кириллицу.
  function downloadCsv(list) {
    const rows = [
      ['Промокод', 'Тариф', 'Действует до', 'Ссылка для активации'],
      ...list.map((p) => [
        p.code,
        planName(p.plan_id),
        formatDate(p.expires_at),
        promoActivationUrl(p.code),
      ]),
    ];

    const csv = '﻿' + rows.map((r) => r.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `promocodes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  if (status === 'pending') return <HrPending what="Промокоды" />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="lk-hr-page">
      <header className="lk-hr-page__head">
        <div>
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Промокоды</h1>
        </div>

        <button type="button" className="lk-hr-refresh" onClick={load} title="Обновить">
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      {/* ГЕНЕРАТОР */}
      <section className="lk-hr-card">
        <h2 className="lk-hr-card__title">Выдать коды</h2>

        <form className="lk-hr-form lk-hr-form--grid" onSubmit={handleCreate}>
          <label className="lk-hr-field">
            <span>
              Количество
              {seatsFree != null && <em> — свободно {seatsFree}</em>}
            </span>
            <input
              type="number"
              min="1"
              max={seatsFree ?? undefined}
              value={form.count}
              onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
            />
          </label>

          <label className="lk-hr-field">
            <span>Тариф</span>
            <select
              value={form.planId}
              onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
            >
              {GRANTABLE.map((t) => (
                <option key={t.id} value={PLAN_ID_MAP[t.id]}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="lk-hr-field">
            <span>Действует до</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </label>

          <label className="lk-hr-field">
            <span>Активаций на код</span>
            <input
              type="number"
              min="1"
              value={form.maxActivations}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxActivations: e.target.value }))
              }
            />
          </label>

          {createError && (
            <div className="lk-hr-error lk-hr-form__full">{createError}</div>
          )}

          <div className="lk-hr-form__full">
            <button
              type="submit"
              className="lk-btn lk-btn--primary lk-btn--md"
              disabled={creating}
            >
              <Ticket size={15} />
              {creating ? 'Создаём…' : 'Создать коды'}
            </button>
          </div>
        </form>
      </section>

      {/* ТОЛЬКО ЧТО СОЗДАННЫЕ — отдельным блоком: после генерации пачки
          HR нужно их сразу скачать или раздать, а искать свежие коды в
          общем списке из сотни строк неудобно. */}
      {justCreated.length > 0 && (
        <section className="lk-hr-card lk-hr-card--accent">
          <h2 className="lk-hr-card__title">
            Создано кодов: {justCreated.length}
          </h2>

          <p className="lk-hr-hint">
            <AlertTriangle size={14} />
            Скачайте список сейчас — потом коды придётся выбирать из общего
            списка по одному.
          </p>

          <div className="lk-hr-codes">
            {justCreated.map((p) => (
              <code key={p.code}>{p.code}</code>
            ))}
          </div>

          <div className="lk-hr-actions">
            <button
              type="button"
              className="lk-btn lk-btn--primary lk-btn--md"
              onClick={() => downloadCsv(justCreated)}
            >
              <Download size={15} />
              Скачать CSV
            </button>

            <button
              type="button"
              className="lk-btn lk-btn--secondary lk-btn--md"
              onClick={() =>
                copy(justCreated.map((p) => p.code).join('\n'), 'batch')
              }
            >
              {copied === 'batch' ? <Check size={15} /> : <Copy size={15} />}
              {copied === 'batch' ? 'Скопировано' : 'Скопировать все'}
            </button>

            <button
              type="button"
              className="lk-btn lk-btn--ghost lk-btn--md"
              onClick={() => setJustCreated([])}
            >
              Свернуть
            </button>
          </div>
        </section>
      )}

      {/* ФИЛЬТРЫ */}
      <div className="lk-hr-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filter === f.id ? 'is-active' : ''}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className="lk-hr-loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-hr-pending">
          <h2>Не удалось загрузить промокоды</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="lk-hr-empty">
          {filter === 'all'
            ? 'Промокодов пока нет. Создайте первую пачку выше.'
            : 'В этом статусе кодов нет.'}
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <div className="lk-hr-table">
            <div className="lk-hr-table__row lk-hr-table__row--head">
              <span>Код</span>
              <span>Тариф</span>
              <span>Действует до</span>
              <span>Статус</span>
              <span />
            </div>

            {items.map((p) => (
              <div key={p.code} className="lk-hr-table__group">
                <div className="lk-hr-table__row">
                  <span className="lk-hr-table__code">{p.code}</span>
                  <span>{planName(p.plan_id)}</span>
                  <span>{formatDate(p.expires_at)}</span>
                  <span>
                    <em className={`lk-hr-status lk-hr-status--${p.status}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </em>
                    {p.max_activations > 1 && (
                      <em className="lk-hr-status__sub">
                        {p.activations_count ?? 0} из {p.max_activations}
                      </em>
                    )}
                  </span>

                  <span className="lk-hr-table__tools">
                    <button
                      type="button"
                      onClick={() => copy(p.code, p.code)}
                      title="Скопировать код"
                    >
                      {copied === p.code ? <Check size={15} /> : <Copy size={15} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrFor(qrFor === p.code ? null : p.code)}
                      title="QR-код"
                    >
                      <QrCode size={15} />
                    </button>

                    {p.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(p.code)}
                        title="Отключить код"
                      >
                        <Ban size={15} />
                      </button>
                    )}
                  </span>
                </div>

                {qrFor === p.code && (
                  <div className="lk-hr-table__qr">
                    <PromoQr code={p.code} />
                    <div>
                      <p>
                        Сотрудник сканирует код телефоном и попадает на страницу
                        активации с уже заполненным полем.
                      </p>
                      <button
                        type="button"
                        className="lk-btn lk-btn--secondary lk-btn--sm"
                        onClick={() =>
                          copy(promoActivationUrl(p.code), `link-${p.code}`)
                        }
                      >
                        {copied === `link-${p.code}` ? 'Ссылка скопирована' : 'Скопировать ссылку'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lk-hr-actions">
            <button
              type="button"
              className="lk-btn lk-btn--secondary lk-btn--md"
              onClick={() => downloadCsv(items)}
            >
              <Download size={15} />
              Скачать эту страницу в CSV
            </button>
          </div>

          {totalPages > 1 && (
            <div className="lk-hr-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </button>
              <span>
                {page} из {totalPages} · всего {total}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
