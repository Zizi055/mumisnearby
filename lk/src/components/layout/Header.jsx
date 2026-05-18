import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigation } from '../../config/navigation';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    text: 'Голос «Мамин голос» успешно обучен',
    time: '5 мин назад',
    read: false,
  },
  {
    id: 2,
    text: 'Новая сказка добавлена в библиотеку',
    time: '1 час назад',
    read: false,
  },
  {
    id: 3,
    text: 'Подписка активна до 04.06.2026',
    time: 'Вчера',
    read: true,
  },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
      <div className="lk-header__left">
        <div className="lk-header__breadcrumb">
          {current?.label} / {currentChild?.label}
        </div>

        <h1 className="lk-header__title">
          {currentChild?.label}
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
                    className={`lk-notif-item ${n.read ? 'is-read' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="lk-notif-item__dot" />
                    <div className="lk-notif-item__body">
                      <p>{n.text}</p>
                      <span>{n.time}</span>
                    </div>
                    {!n.read && (
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
          onClick={() => navigate('/profile')}
        >
          <div className="lk-header__avatar">
            {getInitial()}
          </div>
          <span className="lk-header__username">
            {getDisplayName()}
          </span>
        </button>

      </div>
    </header>
  );
}
