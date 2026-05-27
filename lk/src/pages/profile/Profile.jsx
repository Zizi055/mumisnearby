import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Plus,
  Trash2,
  LogOut,
  User,
  Baby,
} from 'lucide-react';

const MOCK_KIDS = [
  { id: 1, name: 'Алиса', age: 5 },
  { id: 2, name: 'Миша', age: 3 },
];

const MOCK_PARENTS = [
  { id: 1, name: 'Бабушка Зоя', role: 'Бабушка' },
];

export default function Profile() {
  const { user, setUser, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // ─────────────────────────────────────
  // TAB
  // ─────────────────────────────────────

  const getTab = () => {
    if (location.pathname.includes('kids')) return 'kids';
    if (location.pathname.includes('preferences')) return 'preferences';

    return 'info';
  };

  const tab = getTab();

  // ─────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [saved, setSaved] = useState(false);

  // ─────────────────────────────────────
  // KIDS
  // ─────────────────────────────────────

  const [kids, setKids] = useState(MOCK_KIDS);

  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');

  const [showKidForm, setShowKidForm] = useState(false);

  // ─────────────────────────────────────
  // PARENTS
  // ─────────────────────────────────────

  const [parents, setParents] = useState(MOCK_PARENTS);

  const [newParentName, setNewParentName] = useState('');
  const [newParentRole, setNewParentRole] = useState('');

  const [showParentForm, setShowParentForm] = useState(false);

  // ─────────────────────────────────────
  // SAVE PROFILE
  // ─────────────────────────────────────

  const handleSave = () => {
    setUser({
      ...user,
      name,
      email,
      phone,
    });

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  // ─────────────────────────────────────
  // ADD KID
  // ─────────────────────────────────────

  const handleAddKid = () => {
    if (!newKidName.trim()) return;

    setKids((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newKidName.trim(),
        age: Number(newKidAge) || 0,
      },
    ]);

    setNewKidName('');
    setNewKidAge('');

    setShowKidForm(false);
  };

  // ─────────────────────────────────────
  // ADD PARENT
  // ─────────────────────────────────────

  const handleAddParent = () => {
    if (!newParentName.trim()) return;

    setParents((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newParentName.trim(),
        role: newParentRole.trim() || 'Родитель',
      },
    ]);

    setNewParentName('');
    setNewParentRole('');

    setShowParentForm(false);
  };

  // ─────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // ─────────────────────────────────────
  // AVATAR INITIAL
  // ─────────────────────────────────────

  const getInitial = () => {
    return name ? name[0].toUpperCase() : '?';
  };

  return (
    <section className="lk-profile">

      {/* ─────────────────────────────────────
          HERO
      ───────────────────────────────────── */}

      <div className="lk-profile__hero">

        <div className="lk-profile__avatar-wrap">

          <div className="lk-profile__avatar">
            {getInitial()}
          </div>

          <button
            type="button"
            className="lk-profile__avatar-edit"
            aria-label="Изменить фото"
          >
            <Camera size={14} />
          </button>

        </div>

        <div className="lk-profile__hero-info">

          <h2 className="lk-profile__hero-name">
            {name || 'Пользователь'}
          </h2>

          <p className="lk-profile__hero-email">
            {email}
          </p>

        </div>

      </div>

      {/* ─────────────────────────────────────
          INFO
      ───────────────────────────────────── */}

      {tab === 'info' && (
        <div className="lk-profile__block">

          <h3 className="lk-profile__block-title">
            Личные данные
          </h3>

          <div className="lk-profile__form">

            <div className="lk-profile__field">

              <label className="lk-profile__label">
                Имя
              </label>

              <input
                className="lk-profile__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
              />

            </div>

            <div className="lk-profile__field">

              <label className="lk-profile__label">
                Email
              </label>

              <input
                className="lk-profile__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />

            </div>

            <div className="lk-profile__field">

              <label className="lk-profile__label">
                Телефон
              </label>

              <input
                className="lk-profile__input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
              />

            </div>

          </div>

          <div className="lk-profile__actions">

            <button
              type="button"
              className="lk-btn lk-btn--primary lk-btn--md"
              onClick={handleSave}
            >
              <span className="lk-btn__content">
                {saved ? 'Сохранено ✓' : 'Сохранить'}
              </span>
            </button>

          </div>

          <div className="lk-profile__logout">

            <button
              type="button"
              className="lk-btn lk-btn--danger lk-btn--md"
              onClick={handleLogout}
            >
              <span className="lk-btn__content">
                <LogOut size={16} />
                Выйти из аккаунта
              </span>
            </button>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────
          KIDS
      ───────────────────────────────────── */}

      {tab === 'kids' && (
        <>

          {/* ───────────── ДЕТИ ───────────── */}

          <div className="lk-profile__block">

            <h3 className="lk-profile__block-title">
              Дети
            </h3>

            <p className="lk-profile__block-hint">
              Добавьте детей чтобы получать персональные рекомендации
            </p>

            <div className="lk-profile__members">

              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="lk-profile__member"
                >

                  <div className="lk-profile__member-avatar lk-profile__member-avatar--kid">
                    <Baby size={14} />
                  </div>

                  <div className="lk-profile__member-info">
                    <strong>{kid.name}</strong>
                    <span>
                      {kid.age} {getAgeLabel(kid.age)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="lk-profile__member-remove"
                    onClick={() =>
                      setKids((prev) =>
                        prev.filter((k) => k.id !== kid.id)
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>

                </div>
              ))}

            </div>

            <div className="lk-profile__add">

              {!showKidForm && (
                <button
                  type="button"
                  className="lk-btn lk-btn--secondary lk-btn--md"
                  onClick={() => setShowKidForm(true)}
                >
                  <span className="lk-btn__content">
                    <Plus size={16} />
                    Добавить ребёнка
                  </span>
                </button>
              )}

              {showKidForm && (
                <div className="lk-profile__add-row">

                  <input
                    className="lk-profile__input lk-profile__input--sm"
                    type="text"
                    placeholder="Имя ребёнка"
                    value={newKidName}
                    onChange={(e) => setNewKidName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddKid()
                    }
                  />

                  <input
                    className="lk-profile__input lk-profile__input--sm lk-profile__input--age"
                    type="number"
                    placeholder="Лет"
                    min={0}
                    max={18}
                    value={newKidAge}
                    onChange={(e) => setNewKidAge(e.target.value)}
                  />

                  <div className="lk-profile__add-actions">

                    <button
                      type="button"
                      className="lk-btn lk-btn--primary lk-btn--md"
                      onClick={handleAddKid}
                    >
                      <span className="lk-btn__content">
                        Сохранить
                      </span>
                    </button>

                    <button
                      type="button"
                      className="lk-btn lk-btn--ghost lk-btn--md"
                      onClick={() => setShowKidForm(false)}
                    >
                      <span className="lk-btn__content">
                        Отмена
                      </span>
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

          {/* ───────────── РОДИТЕЛИ ───────────── */}

          <div className="lk-profile__block">

            <h3 className="lk-profile__block-title">
              Родители и близкие
            </h3>

            <p className="lk-profile__block-hint">
              Добавьте тех, кто будет записывать голос
            </p>

            <div className="lk-profile__members">

              {parents.map((parent) => (
                <div
                  key={parent.id}
                  className="lk-profile__member"
                >

                  <div className="lk-profile__member-avatar lk-profile__member-avatar--parent">
                    <User size={14} />
                  </div>

                  <div className="lk-profile__member-info">
                    <strong>{parent.name}</strong>
                    <span>{parent.role}</span>
                  </div>

                  <button
                    type="button"
                    className="lk-profile__member-remove"
                    onClick={() =>
                      setParents((prev) =>
                        prev.filter((p) => p.id !== parent.id)
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>

                </div>
              ))}

            </div>

            <div className="lk-profile__add">

              {!showParentForm && (
                <button
                  type="button"
                  className="lk-btn lk-btn--secondary lk-btn--md"
                  onClick={() => setShowParentForm(true)}
                >
                  <span className="lk-btn__content">
                    <Plus size={16} />
                    Добавить близкого
                  </span>
                </button>
              )}

              {showParentForm && (
                <div className="lk-profile__add-row">

                  <input
                    className="lk-profile__input lk-profile__input--sm"
                    type="text"
                    placeholder="Имя"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddParent()
                    }
                  />

                  <input
                    className="lk-profile__input lk-profile__input--sm"
                    type="text"
                    placeholder="Роль"
                    value={newParentRole}
                    onChange={(e) => setNewParentRole(e.target.value)}
                  />

                  <div className="lk-profile__add-actions">

                    <button
                      type="button"
                      className="lk-btn lk-btn--primary lk-btn--md"
                      onClick={handleAddParent}
                    >
                      <span className="lk-btn__content">
                        Сохранить
                      </span>
                    </button>

                    <button
                      type="button"
                      className="lk-btn lk-btn--ghost lk-btn--md"
                      onClick={() => setShowParentForm(false)}
                    >
                      <span className="lk-btn__content">
                        Отмена
                      </span>
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </>
      )}

      {/* ─────────────────────────────────────
          PREFERENCES
      ───────────────────────────────────── */}

      {tab === 'preferences' && (
        <div className="lk-profile__block">

          <h3 className="lk-profile__block-title">
            Предпочтения
          </h3>

          <div className="lk-profile__prefs">

            <div className="lk-profile__pref">

              <div>
                <strong>Язык интерфейса</strong>
                <p>Язык отображения текстов в приложении</p>
              </div>

              <select className="lk-profile__select">
                <option>Русский</option>
                <option>English</option>
              </select>

            </div>

            <div className="lk-profile__pref">

              <div>
                <strong>Тема оформления</strong>
                <p>Светлая, тёмная или системная</p>
              </div>

              <select
                className="lk-profile__select"
                onChange={(e) => applyTheme(e.target.value)}
              >
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
                <option value="system">Системная</option>
              </select>

            </div>

            <div className="lk-profile__pref">

              <div>
                <strong>Автовоспроизведение</strong>
                <p>Следующая сказка запускается автоматически</p>
              </div>

              <label className="lk-switch">
                <input type="checkbox" defaultChecked />
                <span />
              </label>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

// ─────────────────────────────────────
// THEME
// ─────────────────────────────────────

function applyTheme(value) {
  const root = document.documentElement;

  if (value === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (value === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    root.setAttribute(
      'data-theme',
      prefersDark ? 'dark' : 'light'
    );
  }
}

// ─────────────────────────────────────
// AGE LABEL
// ─────────────────────────────────────

function getAgeLabel(age) {
  if (age >= 11 && age <= 14) return 'лет';

  const last = age % 10;

  if (last === 1) return 'год';
  if (last >= 2 && last <= 4) return 'года';

  return 'лет';
}