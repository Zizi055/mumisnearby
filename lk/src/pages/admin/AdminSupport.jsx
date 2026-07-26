import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  AlertCircle,
  LogIn,
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
  const { user, loading: authLoading } = useAuth();

  const [tickets, setTickets]     = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | success | unauthorized | forbidden | failed
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail]         = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');

  const [replyText, setReplyText]   = useState('');
  const [replyStatus, setReplyStatus] = useState('idle');

  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && user) loadTickets();
  }, [authLoading, user]);

  async function loadTickets() {
    setListStatus('loading');
    try {
      const data = await getAdminTickets();
      setTickets(data);
      setListStatus('success');
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('403')) setListStatus('forbidden');
      else if (msg.includes('401')) setListStatus('unauthorized');
      else setListStatus('failed');
    }
  }

  async function selectTicket(id) {
    setSelectedId(id);
    setDetailStatus('loading');
    setReplyText('');
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

  // Не залогинена вообще
  if (!authLoading && !user) {
    return (
      <div className="lk-admin lk-admin--gate">
        <div className="lk-admin-gate">
          <LogIn size={28} />
          <h2>Нужен вход</h2>
          <p>Войдите под учётной записью с правами администратора.</p>
          <a className="lk-admin-gate__link" href="#/auth">Войти</a>
        </div>
      </div>
    );
  }

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

      {listStatus === 'forbidden' && (
        <div className="lk-admin-gate">
          <AlertCircle size={28} />
          <h2>Доступ запрещён</h2>
          <p>Этот аккаунт не имеет прав администратора — обратитесь к тому, кто их выдаёт.</p>
        </div>
      )}

      {listStatus === 'unauthorized' && (
        <div className="lk-admin-gate">
          <LogIn size={28} />
          <h2>Сессия истекла</h2>
          <a className="lk-admin-gate__link" href="#/auth">Войти снова</a>
        </div>
      )}

      {listStatus === 'failed' && (
        <div className="lk-admin-gate">
          <AlertCircle size={28} />
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
