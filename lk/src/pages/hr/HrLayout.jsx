import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, FlaskConical } from 'lucide-react';
import {
  getCompanyProfile,
  logoutCompany,
  getStoredCompanyName,
  hasCompanySession,
} from '../../api/company.service';
import { isDemoData } from '../../api/companyClient';

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
  const [demo, setDemo] = useState(false);
  const [company, setCompany] = useState(null);
  const [name, setName] = useState(getStoredCompanyName());

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
        setDemo(isDemoData());
        setStatus('ready');
      })
      .catch(() => {
        // Внутрь пускаем в любом случае: 401 уже увёл на вход из
        // companyClient, а остальные ошибки экраны показывают сами —
        // запирать человека на экране загрузки из-за одного неудачного
        // запроса незачем.
        setStatus('ready');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logoutCompany();
    navigate('/company/login', { replace: true });
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
          <button type="button" onClick={handleLogout} title="Выйти">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {demo && (
        <div className="lk-hr-banner lk-hr-banner--demo">
          <FlaskConical size={16} />
          <div>
            <strong>Это демонстрационные данные</strong>
            <p>
              Корпоративный раздел ещё не выкачен на сервер, поэтому кабинет
              показывает придуманную компанию и семерых несуществующих
              сотрудников. Так выглядят экраны с настоящими данными. Плашка
              исчезнет сама, как только бэкенд начнёт отвечать.
            </p>
          </div>
        </div>
      )}

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
