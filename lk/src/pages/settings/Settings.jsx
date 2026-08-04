import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Shield, Users, Sliders, Eye, EyeOff, Check } from 'lucide-react';
import { changePassword, getPasswordChangedAt } from '../../api/profile.service';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const getTab = () => {
    if (location.pathname.includes('notifications')) return 'notifications';
    if (location.pathname.includes('security')) return 'security';
    if (location.pathname.includes('family')) return 'family';
    return 'general';
  };
  const tab = getTab();

  // Уведомления
  const [notifStories, setNotifStories] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifTips, setNotifTips] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);

  // Безопасность
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordChangedAt, setPasswordChangedAt] = useState(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    getPasswordChangedAt()
      .then((res) => setPasswordChangedAt(res.password_changed_at))
      .catch(() => {});
  }, []);

  const passwordLastChangedLabel = passwordChangedAt
    ? new Date(passwordChangedAt).toLocaleDateString('ru-RU')
    : 'никогда';

  // Семья
  const [familyAccess, setFamilyAccess] = useState(true);
  // childMode используется только в закомментированном ниже переключателе
  // «Детский режим» — оставили для быстрого возврата.
  const [childMode, setChildMode] = useState(false);

  const handleSavePassword = async () => {
    // Раньше здесь стоял молчаливый `return`: при пустом или коротком
    // пароле кнопка просто ничего не делала и не показывала причину —
    // выглядело как «не сохраняется и никаких уведомлений».
    if (!oldPassword) {
      setPasswordError('Введите текущий пароль');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Новый пароль должен быть не короче 8 символов');
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordError('Новый пароль совпадает с текущим');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');

    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });

      setPasswordSaved(true);
      setOldPassword('');
      setNewPassword('');

      // По спеке после смены пароля все старые токены становятся
      // невалидными — текущая сессия тоже, так что зовём логаут и
      // уводим на вход, а не притворяемся, что всё ок дальше.
      setTimeout(() => {
        logout();
        navigate('/auth');
      }, 1500);
    } catch (e) {
      setPasswordError(e.message || 'Не удалось сменить пароль');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <section className="lk-settings">

      {/* ── ОБЩИЕ ── */}
      {tab === 'general' && (
        <div className="lk-settings__block">
          <div className="lk-settings__block-head">
            <div className="lk-settings__block-icon"><Sliders size={16} /></div>
            <h3>Общие настройки</h3>
          </div>

          <div className="lk-settings__rows">
            <div className="lk-settings__row">
              <div>
                <strong>Автовоспроизведение</strong>
                <p>Следующая сказка запускается автоматически</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" defaultChecked />
                <span />
              </label>
            </div>

            {/* Качество аудио и скорость воспроизведения — пока такого
                функционала на сайте не будет, скрыла. Код оставила ниже
                в комментарии, чтобы вернуть, когда появится реализация.

            <div className="lk-settings__row">
              <div>
                <strong>Качество аудио</strong>
                <p>Высокое качество потребляет больше трафика</p>
              </div>
              <select className="lk-settings__select">
                <option>Высокое</option>
                <option>Стандартное</option>
                <option>Экономное</option>
              </select>
            </div>

            <div className="lk-settings__row">
              <div>
                <strong>Скорость воспроизведения</strong>
                <p>По умолчанию 1×</p>
              </div>
              <select
                className="lk-settings__select"
                defaultValue="1×"
              >
                <option>0.75×</option>
                <option value="1×">1×</option>
                <option>1.25×</option>
                <option>1.5×</option>
              </select>
            </div>
            */}
          </div>
        </div>
      )}

      {/* ── УВЕДОМЛЕНИЯ ── */}
      {tab === 'notifications' && (
        <div className="lk-settings__block">
          <div className="lk-settings__block-head">
            <div className="lk-settings__block-icon"><Bell size={16} /></div>
            <h3>Уведомления</h3>
          </div>

          <div className="lk-settings__rows">
            <div className="lk-settings__row">
              <div>
                <strong>Новые сказки</strong>
                <p>Когда в библиотеке появляется новый контент</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={notifStories} onChange={() => setNotifStories(v => !v)} />
                <span />
              </label>
            </div>

            <div className="lk-settings__row">
              <div>
                <strong>Платежи</strong>
                <p>Уведомления о списаниях и статусе подписки</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={notifPayments} onChange={() => setNotifPayments(v => !v)} />
                <span />
              </label>
            </div>

            <div className="lk-settings__row">
              <div>
                <strong>Советы и рекомендации</strong>
                <p>AI-инсайты по использованию голосов</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={notifTips} onChange={() => setNotifTips(v => !v)} />
                <span />
              </label>
            </div>

            <div className="lk-settings__row">
              <div>
                <strong>Email-рассылка</strong>
                <p>Дайджест и новости платформы</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={notifEmail} onChange={() => setNotifEmail(v => !v)} />
                <span />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── БЕЗОПАСНОСТЬ ── */}
      {tab === 'security' && (
        <div className="lk-settings__block">
          <div className="lk-settings__block-head">
            <div className="lk-settings__block-icon"><Shield size={16} /></div>
            <h3>Безопасность</h3>
          </div>

          <div className="lk-settings__rows">
            <div className="lk-settings__row">
              <div>
                <strong>Пароль</strong>
                <p>Последнее изменение: {passwordLastChangedLabel}</p>
              </div>
              <button
                type="button"
                className="lk-btn lk-btn--secondary lk-btn--sm"
                onClick={() => setShowPasswordForm(v => !v)}
              >
                <span className="lk-btn__content">Изменить</span>
              </button>
            </div>

            {showPasswordForm && (
              <div className="lk-settings__password-form">
                <div className="lk-settings__password-field">
                  <input
                    className="lk-settings__input"
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="Текущий пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lk-settings__password-eye"
                    onClick={() => setShowOldPassword((v) => !v)}
                    aria-label={showOldPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="lk-settings__password-field">
                  <input
                    className="lk-settings__input"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Новый пароль (минимум 8 символов)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lk-settings__password-eye"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordError && (
                  <p className="lk-settings__error">{passwordError}</p>
                )}

                {passwordSaved && (
                  <p className="lk-settings__success">
                    Пароль изменён. Сейчас выйдем из аккаунта — войдите с новым паролем.
                  </p>
                )}
                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--md"
                  onClick={handleSavePassword}
                  disabled={passwordSaving}
                >
                  <span className="lk-btn__content">
                    {passwordSaving ? 'Сохраняем…' : passwordSaved ? <>Сохранено <Check size={15} /></> : 'Сохранить пароль'}
                  </span>
                </button>
              </div>
            )}

            <div className="lk-settings__row">
              <div>
                <strong>Двухфакторная аутентификация</strong>
                <p>Дополнительная защита аккаунта через SMS</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={twoFactor} onChange={() => setTwoFactor(v => !v)} />
                <span />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── СЕМЬЯ ── */}
      {tab === 'family' && (
        <div className="lk-settings__block">
          <div className="lk-settings__block-head">
            <div className="lk-settings__block-icon"><Users size={16} /></div>
            <h3>Семья</h3>
          </div>

          <div className="lk-settings__rows">
            <div className="lk-settings__row">
              <div>
                <strong>Семейный доступ</strong>
                <p>Другие члены семьи могут использовать аккаунт</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={familyAccess} onChange={() => setFamilyAccess(v => !v)} />
                <span />
              </label>
            </div>

            {/* Детский режим — пока такого функционала на сайте не будет,
                скрыла. Код оставила в комментарии, чтобы вернуть, когда
                появится реализация.

            <div className="lk-settings__row">
              <div>
                <strong>Детский режим</strong>
                <p>Ограничивает контент по возрасту ребёнка</p>
              </div>
              <label className="lk-switch">
                <input type="checkbox" checked={childMode} onChange={() => setChildMode(v => !v)} />
                <span />
              </label>
            </div>
            */}
          </div>
        </div>
      )}

    </section>
  );
}
