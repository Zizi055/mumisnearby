import { useEffect, useState } from 'react';
import { getAdminLeads } from '../../api/admin.service';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';

const SOURCE_LABELS = {
  home:        'Главная страница',
  constructor: 'Конструктор',
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

// Заявки с формы «Свяжитесь с нами» на главной и с модалки на Конструкторе
// (main.js шлёт их на POST /leads). Без демо-режима — как только бэк
// добавит GET /admin/leads, здесь появятся настоящие заявки.
export default function AdminLeads() {
  const [leads, setLeads]   = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | failed

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setStatus('loading');
    try {
      const data = await getAdminLeads();
      const sorted = [...data].sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
      setLeads(sorted);
      setStatus('success');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Заявки</h1>
        </div>
        <button type="button" className="lk-admin__refresh" onClick={loadLeads} title="Обновить">
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      {status === 'loading' && (
        <div className="lk-admin-list__loader"><Loader size={20} className="is-spinning" /></div>
      )}

      {status === 'failed' && (
        <div className="lk-admin-gate">
          <AlertCircle size={28} />
          <h2>Не удалось загрузить заявки</h2>
          <p>Эндпоинт /admin/leads пока может быть не готов на бэке.</p>
          <button type="button" onClick={loadLeads}>Попробовать снова</button>
        </div>
      )}

      {status === 'success' && leads.length === 0 && (
        <div className="lk-admin-list__empty">Заявок пока нет</div>
      )}

      {status === 'success' && leads.length > 0 && (
        <div className="lk-admin-table">
          <div className="lk-admin-table__row lk-admin-table__row--head">
            <span>Имя</span>
            <span>Контакты</span>
            <span>Источник</span>
            <span>Дата</span>
          </div>
          {leads.map((lead) => (
            <div className="lk-admin-table__row" key={lead.id}>
              <span className="lk-admin-table__name">{lead.name}</span>
              <span className="lk-admin-table__contacts">
                {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
                {lead.phone && <a href={`tel:${lead.phone}`}>{lead.phone}</a>}
              </span>
              <span>{SOURCE_LABELS[lead.source] ?? lead.source ?? '—'}</span>
              <span>{formatDate(lead.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
