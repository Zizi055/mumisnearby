import { useState, useEffect } from 'react';

import {
  Search,
  ChevronDown,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  FileText,
} from 'lucide-react';

// ========================================
//   КОНСТАНТЫ
// ========================================

const INITIAL_FORM = {
  category: 'voice_model',
  subject: '',
  message: '',
  file: null,
};

const FAQ = {
  knowledge: [
    {
      question: 'Как создаётся голосовая модель?',
      answer:
        'После загрузки записи система анализирует интонации, тембр и особенности речи. Обычно создание модели занимает до 24 часов.',
    },
    {
      question: 'Можно ли использовать несколько голосов?',
      answer:
        'Да. Внутри аккаунта можно хранить несколько семейных голосовых моделей и переключаться между ними.',
    },
    {
      question: 'Сколько длится хранение голосов?',
      answer:
        'Голосовые модели хранятся в рамках активной подписки и доступны для повторного использования.',
    },
    {
      question: 'Можно ли загрузить собственный текст?',
      answer:
        'Да. Вы можете создавать персональные сценарии, сказки и обращения для ребёнка.',
    },
  ],
  security: [
    {
      question: 'Где хранятся голосовые данные?',
      answer:
        'Все голосовые модели защищены и доступны только владельцу аккаунта.',
    },
    {
      question: 'Можно ли удалить голосовую модель?',
      answer:
        'Да. Пользователь может полностью удалить модель и связанные данные.',
    },
    {
      question: 'Кто имеет доступ к голосу?',
      answer:
        'Только владелец аккаунта и пользователи семейного доступа, если он был предоставлен.',
    },
    {
      question: 'Передаются ли данные третьим лицам?',
      answer:
        'Нет. Платформа не передаёт персональные голосовые данные сторонним сервисам.',
    },
  ],
  voices: [
    {
      question: 'Почему голос звучит иначе?',
      answer:
        'На качество модели влияют шумы записи, эмоциональность речи и длина исходного аудио.',
    },
    {
      question: 'Как улучшить качество модели?',
      answer:
        'Используйте чистую запись без фонового шума и спокойную естественную речь.',
    },
    {
      question: 'Сколько минут записи нужно?',
      answer:
        'Для качественной модели рекомендуется от 7 до 15 минут чистой речи.',
    },
    {
      question: 'Можно ли обновить голос?',
      answer:
        'Да. Вы можете загрузить новые записи и улучшить существующую модель.',
    },
  ],
};

const STATUS_CONFIG = {
  new:         { label: 'Новое',    icon: Clock,       className: 'lk-ticket-badge--new'      },
  in_progress: { label: 'В работе', icon: Loader,      className: 'lk-ticket-badge--progress' },
  resolved:    { label: 'Решено',   icon: CheckCircle, className: 'lk-ticket-badge--resolved' },
  closed:      { label: 'Закрыто',  icon: AlertCircle, className: 'lk-ticket-badge--closed'   },
};

const TYPE_LABELS = {
  voice_model: 'Голосовая модель',
  billing:     'Подписка и оплата',
  technical:   'Ошибка платформы',
  other:       'Другое',
};

// ========================================
//   УТИЛИТЫ
// ========================================

function formatDate(iso) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ========================================
//   SUPPORT MODAL
// ========================================

function SupportModal({ isOpen, onClose, onSuccess }) {
  const [ticketForm, setTicketForm]   = useState(INITIAL_FORM);
  const [ticketStatus, setTicketStatus] = useState('idle');
  const [ticketError, setTicketError]   = useState(null);

  function updateTicketField(field, value) {
    setTicketForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setTicketForm(INITIAL_FORM);
      setTicketStatus('idle');
      setTicketError(null);
    }, 200);
  }

  async function submitTicket(e) {
    e.preventDefault();

    if (!ticketForm.subject.trim()) { setTicketError('Укажите тему обращения'); return; }
    if (!ticketForm.message.trim())  { setTicketError('Напишите сообщение');     return; }

    setTicketStatus('loading');
    setTicketError(null);

    try {
      const body = new FormData();
      body.append('type',       ticketForm.category);
      body.append('subject',    ticketForm.subject.trim());
      body.append('message',    ticketForm.message.trim());
      body.append('user_id',    'USER_ID_HERE');    // TODO: заменить на auth-контекст
      body.append('user_email', 'USER_EMAIL_HERE'); // TODO: заменить на auth-контекст
      if (ticketForm.file) body.append('attachment', ticketForm.file);

      const res = await fetch('/api/support/tickets', { method: 'POST', body });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Ошибка ${res.status}`);
      }

      setTicketStatus('success');
      onSuccess?.();
    } catch (err) {
      setTicketStatus('error');
      setTicketError(err.message || 'Что-то пошло не так, попробуйте ещё раз');
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="lk-support-modal-overlay" onClick={handleClose} />
      <div className="lk-support-modal">
        <div className="lk-support-modal__head">
          <div>
            <span>Поддержка</span>
            <h2>Новое обращение</h2>
          </div>
          <button type="button" onClick={handleClose}>×</button>
        </div>

        {ticketStatus === 'success' ? (
          <div className="lk-support-success">
            <div className="lk-support-success__icon">✓</div>
            <strong>Обращение отправлено</strong>
            <p>Среднее время ответа — до 15 минут.</p>
            <button type="button" onClick={handleClose}>Закрыть</button>
          </div>
        ) : (
          <form className="lk-support-form" onSubmit={submitTicket}>
            {ticketError && <p className="lk-support-form__error">{ticketError}</p>}

            <div className="lk-support-form__group">
              <label>Тип обращения</label>
              <select value={ticketForm.category} onChange={(e) => updateTicketField('category', e.target.value)}>
                <option value="voice_model">Голосовая модель</option>
                <option value="billing">Подписка и оплата</option>
                <option value="technical">Ошибка платформы</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div className="lk-support-form__group">
              <label>Тема</label>
              <input
                type="text"
                placeholder="Кратко опишите проблему"
                value={ticketForm.subject}
                onChange={(e) => updateTicketField('subject', e.target.value)}
              />
            </div>

            <div className="lk-support-form__group">
              <label>Сообщение</label>
              <textarea
                placeholder="Что произошло?"
                value={ticketForm.message}
                onChange={(e) => updateTicketField('message', e.target.value)}
              />
            </div>

            <div className="lk-support-form__group">
              <label>Вложения</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => updateTicketField('file', e.target.files[0])}
              />
            </div>

            <div className="lk-support-form__actions">
              <button type="button" className="lk-support-form__cancel" onClick={handleClose}>
                Отмена
              </button>
              <button type="submit" className="lk-support-form__submit" disabled={ticketStatus === 'loading'}>
                {ticketStatus === 'loading' ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ========================================
//   МОИ ОБРАЩЕНИЯ
// ========================================

function TicketBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  const Icon = config.icon;
  return (
    <span className={`lk-ticket-badge ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function TicketCard({ ticket }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`lk-ticket-card ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="lk-ticket-card__head" onClick={() => setIsOpen((v) => !v)}>
        <div className="lk-ticket-card__meta">
          <TicketBadge status={ticket.status} />
          <span className="lk-ticket-card__type">{TYPE_LABELS[ticket.type] ?? ticket.type}</span>
        </div>
        <strong className="lk-ticket-card__subject">{ticket.subject}</strong>
        <div className="lk-ticket-card__footer">
          <span className="lk-ticket-card__date">{formatDate(ticket.created_at)}</span>
          <ChevronDown size={16} className="lk-ticket-card__chevron" />
        </div>
      </button>

      {isOpen && (
        <div className="lk-ticket-card__body">
          <p className="lk-ticket-card__message">{ticket.message}</p>
          {ticket.attachment_url && (
            <a href={ticket.attachment_url} target="_blank" rel="noreferrer" className="lk-ticket-card__attachment">
              📎 Вложение
            </a>
          )}
          <div className="lk-ticket-card__id">#{String(ticket.id).slice(0, 8).toUpperCase()}</div>
        </div>
      )}
    </div>
  );
}

function UserTickets({ onCreateTicket, refreshKey }) {
  const [tickets, setTickets]           = useState([]);
  const [fetchStatus, setFetchStatus]   = useState('loading');
  const [filterStatus, setFilterStatus] = useState('all');

  async function fetchTickets() {
    setFetchStatus('loading');
    try {
      // TODO: заменить user_id на auth-контекст
      const res = await fetch('/api/support/tickets?user_id=USER_ID_HERE');
      if (!res.ok) throw new Error();
      setTickets(await res.json());
      setFetchStatus('success');
    } catch {
      setFetchStatus('error');
    }
  }

  useEffect(() => { fetchTickets(); }, [refreshKey]);

  const filtered = filterStatus === 'all' ? tickets : tickets.filter((t) => t.status === filterStatus);

  return (
    <div className="lk-tickets">
      <div className="lk-tickets__head">
        <div>
          <h2>Мои обращения</h2>
          <p>История всех ваших обращений в поддержку.</p>
        </div>
        <div className="lk-tickets__actions">
          <button
            type="button"
            className="lk-tickets__refresh"
            onClick={fetchTickets}
            disabled={fetchStatus === 'loading'}
            title="Обновить"
          >
            <RefreshCw size={16} className={fetchStatus === 'loading' ? 'is-spinning' : ''} />
          </button>
          <button type="button" className="lk-btn lk-btn--primary lk-btn--lg " onClick={onCreateTicket}>
            + Новое обращение
          </button>
        </div>
      </div>

      {fetchStatus === 'success' && tickets.length > 0 && (
        <div className="lk-tickets__filters">
          {['all', 'new', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              type="button"
              className={`lk-tickets__filter ${filterStatus === s ? 'is-active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? `Все (${tickets.length})` : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      )}

      {fetchStatus === 'loading' && (
        <div className="lk-tickets__loader">
          <Loader size={24} className="is-spinning" />
        </div>
      )}

      {fetchStatus === 'error' && (
        <div className="lk-tickets__error">
          <AlertCircle size={20} />
          <span>Не удалось загрузить обращения</span>
          <button type="button" 
          onClick={fetchTickets}>Попробовать снова</button>
        </div>
      )}

      {fetchStatus === 'success' && tickets.length === 0 && (
        <div className="lk-tickets-empty">
          <div className="lk-tickets-empty__icon"><MessageSquare size={28} /></div>
          <strong>Обращений пока нет</strong>
          <p>Если у вас возник вопрос — мы поможем разобраться.</p>
          <button type="button" className="lk-btn lk-btn--primary lk-btn--lg " onClick={onCreateTicket}>
            Создать обращение
          </button>
        </div>
      )}

      {fetchStatus === 'success' && filtered.length > 0 && (
        <div className="lk-tickets__list">
          {filtered.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
        </div>
      )}
    </div>
  );
}

// ========================================
//   ОСНОВНОЙ КОМПОНЕНТ
// ========================================

export default function Support() {
  const [openedFaq, setOpenedFaq]               = useState(0);
  const [activeCategory, setActiveCategory]     = useState('knowledge');
  const [activeTab, setActiveTab]               = useState('faq');       // faq | tickets
  const [isTicketOpen, setIsTicketOpen]         = useState(false);
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);

  const currentFaq = FAQ[activeCategory];

  function openTicketModal() {
    setIsTicketOpen(true);
  }

  function handleTicketSuccess() {
    // После отправки — переключаем на вкладку «Мои обращения» и обновляем список
    setTicketsRefreshKey((k) => k + 1);
    setActiveTab('tickets');
  }

  return (
    <>
      <SupportModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        onSuccess={handleTicketSuccess}
      />

      <section className="lk-support">

        {/* Hero */}
        <div className="lk-support-hero">
          <div className="lk-support-hero__content">
            <span>Центр поддержки</span>
            <h1>Поможем быстро разобраться с платформой</h1>
            <p>
              Ответы на популярные вопросы, инструкции и помощь
              по работе с голосовыми моделями.
            </p>
            <div className="lk-support-search">
              <Search size={18} />
              <input type="text" placeholder="Поиск по базе знаний" />
            </div>
          </div>

          <div className="lk-support-hero__card">
            <div className="lk-support-hero__icon">
              <Sparkles size={22} />
            </div>
            <strong>AI помощник</strong>
            <p>Подскажет как загрузить голос, настроить сценарии и решить частые вопросы.</p>
            <button type="button" className="lk-btn lk-btn--primary lk-btn--lg">
              Открыть помощника
            </button>
          </div>
        </div>

        {/* Табы: База знаний / Мои обращения */}
        <div className="lk-support-tabs">
          <button
            type="button"
            className={`lk-support-tab ${activeTab === 'faq' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <BookOpen size={16} />
            База знаний
          </button>
          <button
            type="button"
            className={`lk-support-tab ${activeTab === 'tickets' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <FileText size={16} />
            Мои обращения
          </button>
        </div>

        {/* Вкладка FAQ */}
        {activeTab === 'faq' && (
          <div className="lk-support-grid">

            {/* LEFT */}
            <div className="lk-support-main">
              <div className="lk-support-categories">
                <button
                  type="button"
                  className={activeCategory === 'knowledge' ? 'is-active' : ''}
                  onClick={() => setActiveCategory('knowledge')}
                >
                  <BookOpen size={18} />
                  База знаний
                </button>
                <button
                  type="button"
                  className={activeCategory === 'security' ? 'is-active' : ''}
                  onClick={() => setActiveCategory('security')}
                >
                  <ShieldCheck size={18} />
                  Безопасность
                </button>
                <button
                  type="button"
                  className={activeCategory === 'voices' ? 'is-active' : ''}
                  onClick={() => setActiveCategory('voices')}
                >
                  <MessageSquare size={18} />
                  Голосовые модели
                </button>
              </div>

              <div className="lk-support-faq">
                <div className="lk-support-faq__head">
                  <div>
                    <h2>Частые вопросы</h2>
                    <p>Основная информация по платформе.</p>
                  </div>
                </div>
                <div className="lk-support-faq__list">
                  {currentFaq.map((item, index) => (
                    <div
                      key={item.question}
                      className={`lk-support-faq__item ${openedFaq === index ? 'is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="lk-support-faq__trigger"
                        onClick={() => setOpenedFaq(openedFaq === index ? null : index)}
                      >
                        <strong>{item.question}</strong>
                        <ChevronDown size={18} />
                      </button>
                      {openedFaq === index && (
                        <div className="lk-support-faq__content">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <aside className="lk-support-side">
              <div className="lk-support-help">
                <div className="lk-support-help__icon">
                  <MessageSquare size={20} />
                </div>
                <strong>Написать в поддержку</strong>
                <p>Отправьте обращение напрямую внутри платформы.</p>
                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--lg"
                  onClick={openTicketModal}
                >
                  Создать обращение
                </button>
              </div>

              <div className="lk-support-status">
                <span>Статус системы</span>
                <strong>Все сервисы работают стабильно</strong>
                <div className="lk-support-status__dot" />
              </div>
            </aside>

          </div>
        )}

        {/* Вкладка Мои обращения */}
        {activeTab === 'tickets' && (
          <UserTickets
            onCreateTicket={openTicketModal}
            refreshKey={ticketsRefreshKey}
          />
        )}

      </section>
    </>
  );
}
