import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigation } from '../../config/navigation';
import {
  Bell,
  Check,
  Menu,
  MessageSquare,
  AudioLines,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../../api/notifications.service';
import LkButton from '../ui/LkButton';

// Иконка по типу уведомления (NotificationType на бэке).
const NOTIF_ICONS = {
  ticket_reply: MessageSquare,
  generation_ready: AudioLines,
  generation_failed: AlertCircle,
  system: Info,
};

// Куда ведёт уведомление. Ответ поддержки открывает само обращение,
// готовая или упавшая озвучка — список «Мои сказки».
function notificationLink(n) {
  if (n.type === 'ticket_reply' && n.ticket_id) {
    return `/dashboard/support?ticket=${n.ticket_id}`;
  }
  if (n.type === 'generation_ready' || n.type === 'generation_failed') {
    return '/library/generations';
  }
  return null;
}

// Человекочитаемое «5 минут назад» из created_at.
function formatAgo(iso) {
  if (!iso) return '';

  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '';

  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;

  return new Date(iso).toLocaleDateString('ru-RU');
}

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  // Реальные уведомления с бэка (GET /notifications). Раньше здесь стоял
  // жёстко вписанный список из трёх записей — одинаковый у всех, включая
  // «Подписка активна до 04.06.2026» с выдуманной датой.
  const [notifications, setNotifications] = useState([]);
  const [unreadFromApi, setUnreadFromApi] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = unreadFromApi;

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(Array.isArray(res?.items) ? res.items : []);
      setUnreadFromApi(res?.unread_count ?? 0);
    } catch {
      // Не залогинен или бэк недоступен — колокольчик просто пустой,
      // шапку из-за этого не роняем.
      setNotifications([]);
      setUnreadFromApi(0);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Живой поток: бэк сам сообщает, когда озвучка готова или пришёл ответ
    // в поддержке — колокольчик обновляется сразу, а не через минуту.
    const unsubscribe = subscribeToNotifications(() => loadNotifications());

    // Подстраховка: если SSE не прошёл через прокси или соединение отвалилось,
    // раз в пять минут всё равно перечитываем список. Раньше это был
    // единственный механизм и опрашивал он каждую минуту.
    const timer = setInterval(loadNotifications, 5 * 60_000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const current = navigation.find((item) =>
    location.pathname.startsWith(item.path)
  );

  const currentChild = current?.children.find((child) =>
    location.pathname === child.path
  );

  // закрыть панель при клике вне
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Помечаем оптимистично, чтобы точка гасла сразу, и параллельно шлём
  // PATCH. Если запрос упал — перезагружаем список и возвращаем правду с бэка.
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadFromApi(0);
    try {
      await markAllNotificationsRead();
    } catch {
      loadNotifications();
    }
  };

  // Клик по уведомлению: помечаем прочитанным и уводим туда, где
  // человек увидит суть — в обращение или в список озвучек.
  const openNotification = (n) => {
    markRead(n.id);

    const link = notificationLink(n);
    if (link) {
      setShowNotifications(false);
      navigate(link);
    }
  };

  const markRead = async (id) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || item.is_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadFromApi((c) => Math.max(0, c - 1));

    try {
      await markNotificationRead(id);
    } catch {
      loadNotifications();
    }
  };

  // Получаем инициалы или первую букву имени
  const getInitial = () => {
    if (!user?.name) return '?';
    return user.name[0].toUpperCase();
  };

  const getDisplayName = () => {
    if (!user?.name) return 'Профиль';
    // Показываем только первое слово если имя длинное
    return user.name.split(' ')[0];
  };

  return (
    <header className="lk-header">

      {/* Hamburger — только на мобильном */}
      <button
        type="button"
        className="lk-header__burger"
        onClick={onMenuToggle}
        aria-label="Открыть меню"
      >
        <Menu size={20} />
      </button>

      <div className="lk-header__left">
        <div className="lk-header__breadcrumb">
          {/* Это ссылка на маркетинговый сайт, а не раздел кабинета.
              Раньше она называлась «Главная» и стояла рядом с разделом
              ЛК, который тоже называется «Главная» — получалось
              «Главная / Главная / Прогресс». Ставим название проекта:
              так сразу видно, что это выход за пределы кабинета. */}
          <a
            href="/"
            className="lk-header__breadcrumb-home"
            title="Перейти на сайт «Родные голоса»"
          >
            Родные голоса
          </a>
          {current?.label && (
            <>
              <span className="lk-header__breadcrumb-sep">/</span>
              <span>{current.label}</span>
            </>
          )}
          {currentChild?.label && (
            <>
              <span className="lk-header__breadcrumb-sep">/</span>
              <span>{currentChild.label}</span>
            </>
          )}
        </div>

        <h1 className="lk-header__title">
          {currentChild?.label ?? current?.label}
        </h1>
      </div>

      <div className="lk-header__right">

        {/* КОЛОКОЛЬЧИК */}
        <div className="lk-header__notif-wrap" ref={panelRef}>
          <button
            className={`lk-header__icon-btn ${showNotifications ? 'is-active' : ''}`}
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Уведомления"
          >
            <Bell size={20} strokeWidth={1.7} />
            {unreadCount > 0 && (
              <span className="lk-header__badge">{unreadCount}</span>
            )}
          </button>

          {/* ПАНЕЛЬ УВЕДОМЛЕНИЙ */}
          {showNotifications && (
            <div className="lk-notif-panel">
              <div className="lk-notif-panel__head">
                <span>Уведомления</span>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead}>
                    Прочитать все
                  </button>
                )}
              </div>

              <div className="lk-notif-panel__list">
                {notifications.length === 0 && (
                  <p className="lk-notif-panel__empty">Нет уведомлений</p>
                )}

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`lk-notif-item ${n.is_read ? 'is-read' : ''} ${
                      notificationLink(n) ? 'is-clickable' : ''
                    }`}
                    onClick={() => openNotification(n)}
                  >
                    <div className="lk-notif-item__icon">
                      {(() => {
                        const Icon = NOTIF_ICONS[n.type] || Info;
                        return <Icon size={15} />;
                      })()}
                    </div>
                    <div className="lk-notif-item__body">
                      <p>{n.title}</p>
                      {n.body && (
                        <p className="lk-notif-item__text">{n.body}</p>
                      )}
                      <span>{formatAgo(n.created_at)}</span>
                    </div>
                    {!n.is_read && (
                      <button
                        type="button"
                        className="lk-notif-item__check"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        aria-label="Отметить прочитанным"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ИМЯ ПОЛЬЗОВАТЕЛЯ */}
        <button
          className="lk-header__user"
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
        >
          <div className="lk-header__avatar">
            {getInitial()}
          </div>
          <span className="lk-header__username">
            {getDisplayName()}
          </span>
        </button>

      </div>

      {/* ПОДТВЕРЖДЕНИЕ ВЫХОДА НА ГЛАВНУЮ СТРАНИЦУ САЙТА */}
      {showLeaveConfirm && (
        <div className="lk-modal">
          <div
            className="lk-modal__overlay"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="lk-modal__content">
            <h3>Покинуть сайт?</h3>
            <p>Вы перейдёте на главную страницу rodnyegolosa.ru, личный кабинет закроется.</p>
            <div className="lk-modal__actions">
              <LkButton onClick={() => setShowLeaveConfirm(false)}>
                Отмена
              </LkButton>
              <LkButton
                variant="primary"
                onClick={() => { window.location.href = '/'; }}
              >
                Выйти
              </LkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
