import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Shield, Users, Sliders } from 'lucide-react';

export default function Settings() {
  const location = useLocation();

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
  const [twoFactor, setTwoFactor] = useState(false);

  // Семья
  const [familyAccess, setFamilyAccess] = useState(true);
  const [childMode, setChildMode] = useState(false);

  const handleSavePassword = () => {
    if (!oldPassword || newPassword.length < 8) return;
    setPasswordSaved(true);
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => {
      setPasswordSaved(false);
      setShowPasswordForm(false);
    }, 2000);
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
                <p>Последнее изменение: никогда</p>
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
                <input
                  className="lk-settings__input"
                  type="password"
                  placeholder="Текущий пароль"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  className="lk-settings__input"
                  type="password"
                  placeholder="Новый пароль (минимум 8 символов)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--md"
                  onClick={handleSavePassword}
                >
                  <span className="lk-btn__content">
                    {passwordSaved ? 'Сохранено ✓' : 'Сохранить пароль'}
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
          </div>
        </div>
      )}

    </section>
  );
}
