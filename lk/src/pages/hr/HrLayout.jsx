import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, Repeat2 } from 'lucide-react';
import {
  getCompanyProfile,
  logoutCompany,
  getStoredCompanyName,
  hasCompanySession,
} from '../../api/company.service';
import { isNotImplemented } from '../../api/companyClient';
import { getCompanyAsAdmin, closeCompanyAsAdmin } from '../../api/companySession';

// ─────────────────────────────────────────────────────────────────────
// Оболочка кабинета компании.
//
// Своя, не LkLayout: компании не нужны библиотека, запись голоса и
// профиль ребёнка — сайдбар клиентского кабинета только мешал бы.
//
// Отдельно показываем состояние договора. После истечения expires_at
// компания ещё может войти и смотреть данные, но добавлять сотрудников
// и менять тарифы уже нельзя — бэк отвечает 403. Без явного баннера это
// выглядит как поломка: кнопки есть, а ничего не происходит.
// ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/company/dashboard', label: 'Обзор' },
  { path: '/company/staff', label: 'Сотрудники' },
  { path: '/company/profile', label: 'Компания' },
];

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HrLayout() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('checking'); // checking | ready
  const [company, setCompany] = useState(null);
  // Под административной учёткой название берётся из выбранной
  // карточки: запрос профиля ещё не вернулся, а шапка уже должна
  // показывать, чей кабинет открыт.
  const asAdmin = getCompanyAsAdmin();
  const [name, setName] = useState(asAdmin?.name || getStoredCompanyName());

  useEffect(() => {
    if (!hasCompanySession()) {
      const current = window.location.hash.replace(/^#/, '') || '/company/dashboard';
      navigate(`/company/login?redirect=${encodeURIComponent(current)}`, {
        replace: true,
      });
      return;
    }

    getCompanyProfile()
      .then((data) => {
        setCompany(data);
        if (data?.name) setName(data.name);
        setStatus('ready');
      })
      .catch((err) => {
        // Эндпоинта ещё нет на этом сервере — пускаем внутрь, экраны
        // сами покажут заглушку. 401 уже увёл на вход из companyClient.
        if (isNotImplemented(err)) setStatus('ready');
        else setStatus('ready');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logoutCompany();
    navigate('/company/login', { replace: true });
  }

  // Админ не выходит из своей учётки — он закрывает карточку компании
  // и возвращается к списку.
  function handleSwitchCompany() {
    closeCompanyAsAdmin();
    navigate('/company/select', { replace: true });
  }

  if (status === 'checking') {
    return (
      <div className="lk-hr-shell">
        <div className="lk-hr-page">Проверяем доступ…</div>
      </div>
    );
  }

  const expired =
    company && (company.is_active === false || isPast(company.expires_at));

  return (
    <div className="lk-hr-shell">
      <nav className="lk-hr-nav">
        <div className="lk-hr-nav__brand">
          <span className="lk-hr-nav__title">Кабинет компании</span>
          {name && <span className="lk-hr-nav__company">{name}</span>}
        </div>

        <div className="lk-hr-nav__links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `lk-hr-nav__link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="lk-hr-nav__user">
          {asAdmin && (
            <button
              type="button"
              onClick={handleSwitchCompany}
              title="Выбрать другую компанию"
            >
              <Repeat2 size={16} />
            </button>
          )}
          <button type="button" onClick={handleLogout} title="Выйти">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {expired && (
        <div className="lk-hr-banner">
          <AlertTriangle size={16} />
          <div>
            <strong>
              {company.is_active === false
                ? 'Доступ компании приостановлен'
                : `Договор истёк ${formatDate(company.expires_at)}`}
            </strong>
            <p>
              Сотрудники не могут пользоваться сервисом, добавлять новых и
              менять тарифы нельзя. Данные сохранены — обратитесь к менеджеру
              для продления.
            </p>
          </div>
        </div>
      )}

      <Outlet context={{ company, expired }} />
    </div>
  );
}

function isPast(iso) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t < Date.now();
}
