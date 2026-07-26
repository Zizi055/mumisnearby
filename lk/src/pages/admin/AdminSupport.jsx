import { useEffect, useState } from 'react';
import {
  getAdminTickets,
  getAdminTicket,
  addAdminTicketMessage,
  updateAdminTicketStatus,
} from '../../api/admin.service';

import {
  Loader,
  Clock,
  CheckCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

// Строго по бэковому enum'у TicketStatus.
const STATUS_CONFIG = {
  new:         { label: 'Новое',    icon: Clock,       cls: 'is-new'      },
  in_progress: { label: 'В работе', icon: Loader,      cls: 'is-progress' },
  resolved:    { label: 'Решено',   icon: CheckCircle, cls: 'is-resolved' },
};

const TYPE_LABELS = {
  voice_model: 'Голосовая модель',
  billing:     'Подписка и оплата',
  generation:  'Проблема с озвучкой',
  other:       'Другое',
};

// Демо-данные для предпросмотра интерфейса, пока на бэке не готовы роли
// администратора (или пока не залогинена вообще). Показываются вместо
// блокирующего экрана логина — как только /admin/support/tickets начнёт
// реально пускать, эти карточки заменятся настоящими автоматически.
const DEMO_TICKETS = [
  {
    id: 'demo-1',
    subject: 'Не получается загрузить голос',
    type: 'voice_model',
    status: 'new',
    created_at: '2026-07-20T10:15:00Z',
    user_email: 'anna@example.com',
    message: 'Загружаю запись, а модель зависает на обучении и не завершается уже час.',
    messages: [],
  },
  {
    id: 'demo-2',
    subject: 'Списалось дважды за месяц',
    type: 'billing',
    status: 'in_progress',
    created_at: '2026-07-19T14:02:00Z',
    user_email: 'oleg@example.com',
    message: 'По тарифу Хранитель пришло два списания подряд, разберитесь пожалуйста.',
    messages: [
      { id: 'm1', is_staff: true, message: 'Здравствуйте! Проверяем платежи, ответим в течение дня.', created_at: '2026-07-19T15:30:00Z' },
    ],
  },
  {
    id: 'demo-3',
    subject: 'Сказка озвучилась с ошибкой',
    type: 'generation',
    status: 'resolved',
    created_at: '2026-07-17T09:40:00Z',
    user_email: 'marina@example.com',
    message: 'Озвучка «Колобка» упала с ошибкой, остальные сказки в порядке.',
    messages: [
      { id: 'm2', is_staff: true, message: 'Перегенерировали, всё готово — проверьте, пожалуйста.', created_at: '2026-07-17T11:00:00Z' },
      { id: 'm3', is_staff: false, message: 'Да, теперь работает, спасибо!', created_at: '2026-07-17T11:20:00Z' },
    ],
  },
];

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Поля пользователя в TicketShort/TicketDetail точно не подтверждены по
// спеке — подстраховываемся несколькими вариантами имён.
function getRequester(ticket) {
  return (
    ticket.user?.email ??
    ticket.user_email ??
    ticket.email ??
    ticket.user?.username ??
    (ticket.user_id ? `#${ticket.user_id}` : 'неизвестно')
  );
}

function TicketStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status || '—', icon: Clock, cls: '' };
  const Icon = cfg.icon;
  return (
    <span className={`lk-admin-badge ${cfg.cls}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

export default function AdminSupport() {
  const [tickets, setTickets]     = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | success | failed
  const [isDemo, setIsDemo]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail]         = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');

  const [replyText, setReplyText]   = useState('');
  const [replyStatus, setReplyStatus] = useState('idle');

  const [statusUpdating, setStatusUpdating] = useState(false);

  // Грузим сразу при заходе — без завязки на AuthContext, чтобы не
  // дёргать реальный /admin/... эндпоинт без токена (иначе сработает
  // глобальный редирект на /auth при 401 из client.js).
  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    setListStatus('loading');

    const hasToken = !!localStorage.getItem('token');
    if (!hasToken) {
      setIsDemo(true);
      setTickets(DEMO_TICKETS);
      setListStatus('success');
      return;
    }

    try {
      const data = await getAdminTickets();
      setIsDemo(false);
      setTickets(data);
      setListStatus('success');
    } catch {
      // Нет прав (403) или другая ошибка — не блокируем экран, показываем
      // демо-данные, чтобы можно было смотреть интерфейс уже сейчас.
      setIsDemo(true);
      setTickets(DEMO_TICKETS);
      setListStatus('success');
    }
  }

  async function selectTicket(id) {
    setSelectedId(id);
    setDetailStatus('loading');
    setReplyText('');

    if (isDemo) {
      const found = tickets.find((t) => t.id === id);
      setDetail(found || null);
      setDetailStatus(found ? 'success' : 'error');
      return;
    }

    try {
      const data = await getAdminTicket(id);
      setDetail(data);
      setDetailStatus('success');
    } catch {
      setDetailStatus('error');
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !selectedId) return;

    if (isDemo) {
      const newMsg = { id: `local-${Date.now()}`, is_staff: true, message: replyText.trim(), created_at: new Date().toISOString() };
      setDetail((prev) => prev ? { ...prev, messages: [...(prev.messages || []), newMsg] } : prev);
      setTickets((prev) => prev.map((t) => t.id === selectedId ? { ...t, messages: [...(t.messages || []), newMsg] } : t));
      setReplyText('');
      return;
    }

    setReplyStatus('loading');
    try {
      await addAdminTicketMessage(selectedId, replyText.trim());
      setReplyText('');
      setReplyStatus('idle');
      selectTicket(selectedId);
    } catch {
      setReplyStatus('error');
    }
  }

  async function handleStatusChange(newStatus) {
    if (!selectedId || statusUpdating) return;

    if (isDemo) {
      setDetail((prev) => prev ? { ...prev, status: newStatus } : prev);
      setTickets((prev) => prev.map((t) => t.id === selectedId ? { ...t, status: newStatus } : t));
      return;
    }

    setStatusUpdating(true);
    try {
      await updateAdminTicketStatus(selectedId, newStatus);
      await Promise.all([selectTicket(selectedId), loadTickets()]);
    } catch {
      // молча — если бэк отклонит статус, просто ничего не поменяется
    } finally {
      setStatusUpdating(false);
    }
  }

  const filtered = filterStatus === 'all'
    ? tickets
    : tickets.filter((t) => t.status === filterStatus);

  const messages = detail?.messages ?? detail?.items ?? [];

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Обращения в поддержку</h1>
        </div>
        <button type="button" className="lk-admin__refresh" onClick={loadTickets} title="Обновить">
          <RefreshCw size={16} className={listStatus === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      {isDemo && listStatus === 'success' && (
        <div className="lk-admin-demo-banner">
          <Sparkles size={16} />
          Демо-режим: показаны примерные обращения, а не реальные. Как только на бэке настроят права
          администратора и ты войдёшь под таким аккаунтом — здесь появятся настоящие данные.
        </div>
      )}

      {listStatus === 'failed' && (
        <div className="lk-admin-gate">
          <h2>Не удалось загрузить обращения</h2>
          <button type="button" onClick={loadTickets}>Попробовать снова</button>
        </div>
      )}

      {(listStatus === 'success' || listStatus === 'loading') && (
        <div className="lk-admin-grid">

          <div className="lk-admin-list">
            <div className="lk-admin-list__filters">
              {['all', 'new', 'in_progress', 'resolved'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`lk-admin-filter ${filterStatus === s ? 'is-active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? `Все (${tickets.length})` : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>

            {listStatus === 'loading' && (
              <div className="lk-admin-list__loader"><Loader size={20} className="is-spinning" /></div>
            )}

            {listStatus === 'success' && filtered.length === 0 && (
              <div className="lk-admin-list__empty">Обращений нет</div>
            )}

            <div className="lk-admin-list__items">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lk-admin-item ${selectedId === t.id ? 'is-active' : ''}`}
                  onClick={() => selectTicket(t.id)}
                >
                  <div className="lk-admin-item__top">
                    <TicketStatusBadge status={t.status} />
                    <span className="lk-admin-item__type">{TYPE_LABELS[t.type] ?? t.type}</span>
                  </div>
                  <strong className="lk-admin-item__subject">{t.subject}</strong>
                  <div className="lk-admin-item__meta">
                    <span>{getRequester(t)}</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lk-admin-detail">
            {!selectedId && (
              <div className="lk-admin-detail__placeholder">Выберите обращение слева</div>
            )}

            {selectedId && detailStatus === 'loading' && (
              <div className="lk-admin-detail__placeholder"><Loader size={20} className="is-spinning" /></div>
            )}

            {selectedId && detailStatus === 'error' && (
              <div className="lk-admin-detail__placeholder">Не удалось загрузить обращение</div>
            )}

            {selectedId && detailStatus === 'success' && detail && (
              <>
                <div className="lk-admin-detail__head">
                  <div>
                    <span className="lk-admin-item__type">{TYPE_LABELS[detail.type] ?? detail.type}</span>
                    <h2>{detail.subject}</h2>
                    <p className="lk-admin-detail__from">
                      {getRequester(detail)} · {formatDate(detail.created_at)}
                    </p>
                  </div>

                  <div className="lk-admin-status-switch">
                    {Object.keys(STATUS_CONFIG).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={statusUpdating}
                        className={`lk-admin-status-btn ${detail.status === s ? 'is-active' : ''}`}
                        onClick={() => handleStatusChange(s)}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="lk-admin-detail__message">{detail.message ?? detail.body}</p>

                {detail.attachment_url && (
                  <a href={detail.attachment_url} target="_blank" rel="noreferrer" className="lk-admin-detail__attachment">
                    📎 Вложение
                  </a>
                )}

                {messages.length > 0 && (
                  <div className="lk-admin-thread">
                    {messages.map((msg, i) => (
                      <div key={msg.id ?? i} className="lk-admin-thread__msg">
                        <span className="lk-admin-thread__author">
                          {msg.is_staff || msg.author === 'staff' || msg.sender === 'support' ? 'Поддержка' : 'Клиент'}
                        </span>
                        <p>{msg.message ?? msg.text ?? msg.body}</p>
                        {msg.created_at && <span className="lk-admin-thread__date">{formatDate(msg.created_at)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <form className="lk-admin-reply" onSubmit={handleReply}>
                  <textarea
                    placeholder="Ответ клиенту..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  {replyStatus === 'error' && <p className="lk-admin-reply__error">Не удалось отправить</p>}
                  <button type="submit" className="lk-btn lk-btn--sm lk-btn--primary" disabled={replyStatus === 'loading' || !replyText.trim()}>
                    {replyStatus === 'loading' ? 'Отправка...' : 'Ответить'}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
