import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ArrowRight, LogOut } from 'lucide-react';
import { getCompanies } from '../../api/adminCompanies.service';
import { openCompanyAsAdmin } from '../../api/companySession';
import { logoutAdmin } from '../../api/adminAuth.service';

// ─────────────────────────────────────────────────────────────────────
// Выбор компании при входе под административной учёткой.
//
// У юрлица этого шага нет: оно одно и попадает сразу в свой кабинет.
// Администратор видит их все, поэтому обязан сначала сказать, чей
// кабинет открывает, — иначе непонятно, чьи сотрудники на экране.
//
// Дальше начинается обычный кабинет компании, тот же самый: выбор
// только переключает адреса запросов (см. api/companySession.js).
// ─────────────────────────────────────────────────────────────────────

export default function CompanySelect() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/auth?role=company', { replace: true });
      return;
    }

    getCompanies({ limit: 100 })
      .then((data) => {
        setItems(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message || 'Не удалось загрузить список компаний');
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function open(company) {
    openCompanyAsAdmin({ id: company.id, name: company.name });
    navigate('/company/dashboard', { replace: true });
  }

  function handleLogout() {
    logoutAdmin();
    navigate('/auth?role=company', { replace: true });
  }

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter((c) => (c.name || '').toLowerCase().includes(needle))
    : items;

  return (
    <div className="lk-pick">
      <header className="lk-pick__head">
        <div>
          <p className="lk-pick__kicker">Административный доступ</p>
          <h1 className="lk-pick__title">Выберите компанию</h1>
          <p className="lk-pick__lead">
            Откроется её кабинет — тот же, что видит сама компания.
          </p>
        </div>

        <button type="button" className="lk-pick__logout" onClick={handleLogout}>
          <LogOut size={15} />
          Выйти
        </button>
      </header>

      {status === 'loading' && <p className="lk-pick__note">Загружаем список…</p>}

      {status === 'error' && <p className="lk-pick__error">{error}</p>}

      {status === 'ready' && (
        <>
          <label className="lk-pick__search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Название компании"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {visible.length === 0 ? (
            <p className="lk-pick__note">
              {items.length === 0
                ? 'Компаний пока нет. Заведите первую в админке, в разделе «Компании».'
                : 'Ничего не нашлось.'}
            </p>
          ) : (
            <ul className="lk-pick__list">
              {visible.map((company) => (
                <li key={company.id}>
                  <button type="button" className="lk-pick__item" onClick={() => open(company)}>
                    <span className="lk-pick__icon">
                      <Building2 size={18} />
                    </span>

                    <span className="lk-pick__body">
                      <span className="lk-pick__name">{company.name}</span>
                      <span className="lk-pick__meta">
                        {company.staff_limit ? `Мест: ${company.staff_limit}` : 'Пакет не задан'}
                        {company.is_active === false && ' · приостановлена'}
                      </span>
                    </span>

                    <ArrowRight size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
