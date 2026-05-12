import { useState, useEffect } from 'react';
import { tariffs } from '../../data/tariffs.data';
import { useSubscription } from '../../hooks/useSubscription';
import jsPDF from 'jspdf';

import { generateReceipt } from '../../utils/generateReceipt';
import {
  ArrowUpRight,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import LkButton from '../../components/ui/LkButton';

const paymentsMock = [
  {
    id: 1,
    title: 'Хранитель',
    type: 'Подписка',
    date: '12.01.2026',
    amount: '14 400 ₽',
    status: 'paid',
    method: 'VISA •••• 4242',
    receiptUrl: '#',
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
  {
    id: 2,
    title: 'Хранитель',
    type: 'Автосписание',
    date: '12.02.2026',
    amount: '14 400 ₽',
    status: 'pending',
    method: 'VISA •••• 4242',
    receiptUrl: null,
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
  {
    id: 3,
    title: 'Хранитель',
    type: 'Ошибка оплаты',
    date: '12.03.2026',
    amount: '14 400 ₽',
    status: 'failed',
    method: 'VISA •••• 4242',
    receiptUrl: null,
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
];

export default function SubscriptionPayments() {

const subscription = useSubscription();

const payments = (subscription.payments || []).map((p) => ({
  id: p.id,
  title: tariffs.find(t => t.id === p.planId)?.name || 'Тариф',
  type: 'Подписка',
  date: new Date(p.date).toLocaleDateString('ru-RU'),
  amount: `${p.amount.toLocaleString('ru-RU')} ₽`,
  status: p.status === 'success' ? 'paid' : p.status,
  method: 'VISA •••• 4242',
  receiptUrl: '#',
  items: [
    { label: 'Подписка', value: `${p.amount.toLocaleString('ru-RU')} ₽` },
  ],
}));
  const [selectedPayment, setSelectedPayment] = useState(null);

const lastPayment = payments[0] || null;

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

          <span className={`lk-payments-status is-${lastPayment.status}`}>
            {getStatusIcon(lastPayment.status)}
            {getStatusLabel(lastPayment.status)}
          </span>

        </div>

      </div>

      {/* LIST */}
      <div className="lk-payments-list">

        {payments.map((item) => (
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

      {/* ACTION */}
      <div className="lk-payments-actions">
        <LkButton
          variant="primary"
          className="lk-btn--icon"
          onClick={() => setSelectedPayment(lastPayment)}
        >
          Подробнее
          <span className="lk-btn__circle">
            <ArrowUpRight size={14} />
          </span>
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