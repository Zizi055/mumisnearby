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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Сколько обращений тянем за раз. Совпадает с page_size на бэке.
const PAGE_SIZE = 20;

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

// TicketDetail отдаёт только user_id (числом) — ни email, ни username бэк
// не возвращает. Показываем как есть, красивое имя появится только если
// когда-нибудь на бэке TicketDetail расширят.
function getRequester(ticket) {
  return ticket.user_id ? `Пользователь #${ticket.user_id}` : 'неизвестно';
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
  const [filterStatus, setFilterStatus] = useState('all');

  // Фильтрация и постраничная выдача теперь на стороне бэка
  // (?status_filter=&page=&page_size=). Раньше грузили все обращения
  // целиком и фильтровали в браузере — на сотне тикетов это лишний
  // трафик и заметная задержка.
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail]         = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');

  const [replyText, setReplyText]   = useState('');
  const [replyStatus, setReplyStatus] = useState('idle');

  const [statusUpdating, setStatusUpdating] = useState(false);

  // Перезагружаем при смене фильтра и страницы.
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, page]);

  // Смена фильтра сбрасывает на первую страницу, иначе можно попасть
  // на пустую пятую страницу отфильтрованного списка.
  function changeFilter(next) {
    setFilterStatus(next);
    setPage(1);
  }

  async function loadTickets() {
    setListStatus('loading');
    try {
      const res = await getAdminTickets({
        status: filterStatus,
        page,
        pageSize: PAGE_SIZE,
      });
      setTickets(res.items);
      setTotal(res.total);
      setListStatus('success');
    } catch {
      setListStatus('failed');
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

  // Список уже отфильтрован бэком — локально ничего не отсеиваем.
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const messages = detail?.messages ?? [];

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
                  onClick={() => changeFilter(s)}
                >
                  {s === 'all' ? `Все (${total})` : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>

            {listStatus === 'loading' && (
              <div className="lk-admin-list__loader"><Loader size={20} className="is-spinning" /></div>
            )}

            {listStatus === 'success' && tickets.length === 0 && (
              <div className="lk-admin-list__empty">Обращений нет</div>
            )}

            <div className="lk-admin-list__items">
              {tickets.map((t) => (
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
                    {/* TicketShort (список) не содержит данных о пользователе —
                        они есть только в TicketDetail после открытия карточки. */}
                    <span>#{t.id}</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="lk-admin-pager">
                <button
                  type="button"
                  className="lk-carousel-nav__btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || listStatus === 'loading'}
                  aria-label="Предыдущая страница"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="lk-admin-pager__counter">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  className="lk-carousel-nav__btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || listStatus === 'loading'}
                  aria-label="Следующая страница"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
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

                {/* TicketDetail не хранит отдельный текст обращения — исходное
                    сообщение это просто первый элемент messages[]. */}
                {detail.attachments?.length > 0 && (
                  <div className="lk-admin-detail__attachments">
                    {detail.attachments.map((att) => (
                      <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="lk-admin-detail__attachment">
                        📎 {att.filename}
                      </a>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="lk-admin-thread">
                    {messages.map((msg, i) => (
                      <div key={msg.id ?? i} className="lk-admin-thread__msg">
                        <span className="lk-admin-thread__author">
                          {msg.is_admin ? 'Поддержка' : 'Клиент'}
                        </span>
                        <p>{msg.body}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="lk-admin-detail__attachments">
                            {msg.attachments.map((att) => (
                              <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="lk-admin-detail__attachment">
                                📎 {att.filename}
                              </a>
                            ))}
                          </div>
                        )}
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
