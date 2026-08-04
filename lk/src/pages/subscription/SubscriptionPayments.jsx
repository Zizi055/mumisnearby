import { useState, useEffect } from 'react';
import { getPayments } from '../../api/payments.service';
import { generateReceipt } from '../../utils/generateReceipt';
import {
  ArrowUpRight,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import LkButton from '../../components/ui/LkButton';

export default function SubscriptionPayments() {

  const [rawPayments, setRawPayments] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | success | failed
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoadStatus('loading');
    try {
      const data = await getPayments();
      setRawPayments(data);
      setLoadStatus('success');
    } catch {
      setLoadStatus('failed');
    }
  }

  const payments = rawPayments.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    date: p.date ? new Date(p.date).toLocaleDateString('ru-RU') : '—',
    amount: `${p.amount.toLocaleString('ru-RU')} ₽`,
    status: p.status,
    method: p.method || '—',
    receiptUrl: p.receiptUrl,
    items: [
      { label: 'Подписка', value: `${p.amount.toLocaleString('ru-RU')} ₽` },
    ],
  }));

  const lastPayment = payments[0] || null;

  // Список платежей растёт бесконечно — листаем по 10 (5 рядов по 2).
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visiblePayments = payments.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedPayment(null);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const getStatusLabel = (status) => {
    if (status === 'paid') return 'Успешно';
    if (status === 'pending') return 'Ожидает';
    if (status === 'failed') return 'Ошибка';
    return 'Неизвестно';
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return <CheckCircle size={14} />;
    if (status === 'pending') return <Clock size={14} />;
    if (status === 'failed') return <AlertCircle size={14} />;
    return null;
  };

  const handleDownloadReceipt = (payment) => {
    if (!payment) return;
    generateReceipt(payment);
  };

  const handleRetryPayment = (payment) => {
    console.log('Повторить оплату:', payment.id);
  };

  return (
    <section className="lk-payments">

      {/* HEADER */}
      <div className="lk-payments__head">
        <div>
          <h2 className="lk-title">Платежи</h2>
          <p className="lk-text">
            История списаний и оплат по подписке
          </p>
        </div>

        <LkButton
          variant="secondary"
          size="sm"
          onClick={() => handleDownloadReceipt(lastPayment)}
        >
          Скачать чек
        </LkButton>
      </div>

      {/* SUMMARY */}
      <div className="lk-payments-summary">

        <div className="lk-payments-summary__item">
          <span className="lk-payments-summary__label">
            Последний платеж
          </span>
          <strong className="lk-payments-summary__value">
            {lastPayment ? lastPayment.amount : '—'}
          </strong>
        </div>

        <div className="lk-payments-summary__item">
          <span className="lk-payments-summary__label">
            Дата
          </span>
          <strong className="lk-payments-summary__value">
            {lastPayment ? lastPayment.date : '—'}
          </strong>
        </div>

        <div className="lk-payments-summary__item">
          <span className="lk-payments-summary__label">
            Статус
          </span>

          {lastPayment ? (
            <span className={`lk-payments-status is-${lastPayment.status}`}>
              {getStatusIcon(lastPayment.status)}
              {getStatusLabel(lastPayment.status)}
            </span>
          ) : (
            <span>—</span>
          )}

        </div>

      </div>

      {/* LIST */}
      {loadStatus === 'loading' && (
        <div className="lk-payments-loader">
          <Loader size={20} className="lk-spin" />
        </div>
      )}

      {loadStatus === 'failed' && (
        <div className="lk-payments-empty">
          Не удалось загрузить платежи.{' '}
          <button type="button" className="lk-payments-empty__retry" onClick={loadPayments}>
            Попробовать ещё раз
          </button>
        </div>
      )}

      {loadStatus === 'success' && payments.length === 0 && (
        <div className="lk-payments-empty">Платежей пока нет</div>
      )}

      {loadStatus === 'success' && payments.length > 0 && (
      <>
      <div className="lk-payments-list">

        {visiblePayments.map((item) => (
          <div
            key={item.id}
            className={`lk-payments-item ${
              selectedPayment?.id === item.id ? 'is-active' : ''
            }`}
          >

            <div className="lk-payments-item__left">

              <div
                className="lk-payments-item__icon"
                onClick={() => setSelectedPayment(item)}
              >
                <Receipt size={16} />
              </div>

              <div className="lk-payments-item__info">
                <strong>{item.title}</strong>
                <span>
                  {item.type} • {item.date}
                </span>
              </div>

            </div>

            <div className="lk-payments-item__right">

              <strong>{item.amount}</strong>

              <span className={`lk-payments-status is-${item.status}`}>
                {getStatusIcon(item.status)}
                {getStatusLabel(item.status)}
              </span>

            </div>

          </div>
        ))}

      </div>

      {totalPages > 1 && (
        <div className="lk-payments-pager">
          <button
            type="button"
            className="lk-carousel-nav__btn"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="lk-payments-pager__counter">
            {safePage + 1} / {totalPages}
          </span>

          <button
            type="button"
            className="lk-carousel-nav__btn"
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            aria-label="Следующая страница"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      </>
      )}

      {/* ACTION */}
      <div className="lk-payments-actions">
        <LkButton
          variant="primary"
         
          onClick={() => setSelectedPayment(lastPayment)}
        >
          Подробнее
          <ArrowUpRight size={16} />
        </LkButton>
      </div>

      {/* ИНВОЙС */}
      {selectedPayment && (
        <div className="lk-invoice">

          <div
            className="lk-invoice__overlay"
            onClick={() => setSelectedPayment(null)}
          />

          <div className="lk-invoice__panel">

            <div className="lk-invoice__head">
              <h3>Платеж</h3>

              <span className={`lk-invoice-status is-${selectedPayment.status}`}>
                {getStatusIcon(selectedPayment.status)}
                {getStatusLabel(selectedPayment.status)}
              </span>

            </div>

            <div className="lk-invoice__main">

              <div className="lk-invoice__row">
                <span>Сумма</span>
                <strong>{selectedPayment.amount}</strong>
              </div>

              <div className="lk-invoice__row">
                <span>Дата</span>
                <strong>{selectedPayment.date}</strong>
              </div>

              <div className="lk-invoice__row">
                <span>Метод оплаты</span>
                <strong>{selectedPayment.method}</strong>
              </div>

            </div>

            <div className="lk-invoice__breakdown">

              {selectedPayment.items?.map((i, idx) => (
                <div key={idx} className="lk-invoice__line">
                  <span>{i.label}</span>
                  <strong>{i.value}</strong>
                </div>
              ))}

            </div>

            <div className="lk-invoice__actions">

              {selectedPayment.status === 'failed' && (
                <LkButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryPayment(selectedPayment)}
                >
                  Повторить оплату
                </LkButton>
              )}

              {selectedPayment.status === 'paid' && (
                <LkButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                >
                  Скачать чек
                </LkButton>
              )}

              <LkButton
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPayment(null)}
              >
                Закрыть
              </LkButton>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}