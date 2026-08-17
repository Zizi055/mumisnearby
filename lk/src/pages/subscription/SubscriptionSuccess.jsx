import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { getPayments } from '../../api/payments.service';
import { getSubscription } from '../../api/subscription.service';
import LkButton from '../../components/ui/LkButton';

const POLL_INTERVAL_MS = 2000;

// 15 попыток по 2 секунды = 30 секунд. Было 8 (16 секунд) — с 16.08.2026
// вебхук перед активацией ещё раз ходит в API ЮKassa за настоящим статусом
// (критичный пункт №4 ревью), поэтому подтверждение приходит позже.
const MAX_ATTEMPTS = 15;

// Сюда ЮKassa возвращает клиента после оплаты (Checkout.jsx уводит браузер
// на confirmation_url, а дальше — вне нашего контроля до самого возврата).
// Сам факт возврата на эту страницу НЕ значит, что оплата прошла: ЮKassa
// возвращает и при отмене/ошибке тоже, а настоящее подтверждение приходит
// асинхронно через POST /api/payments/webhook и может на пару секунд
// отставать от редиректа. Поэтому опрашиваем историю платежей вместо того,
// чтобы сразу писать «успешно».
export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [state, setState] = useState('checking'); // checking | success | failed | timeout

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    let timer;

    async function check() {
      attempts += 1;

      try {
        // Главный признак — подписка реально включилась. Её выдаёт только
        // вебхук после проверки платежа в ЮKassa; форсировать активацию
        // с фронта нельзя (POST /subscription/activate удалён, вернёт 405).
        const sub = await getSubscription().catch(() => null);
        const planId = sub?.plan?.id ?? sub?.plan_id ?? null;

        if (planId) {
          if (!cancelled) setState('success');
          return;
        }

        // Запасная проверка по истории платежей: бэк отдаёт статус
        // 'success', наш normalizeStatus приводит его к 'paid'.
        const payments = await getPayments();
        const latest = payments[0];

        if (latest?.status === 'paid') {
          if (!cancelled) setState('success');
          return;
        }

        if (latest?.status === 'failed') {
          if (!cancelled) setState('failed');
          return;
        }
      } catch {
        // не удалось получить данные — попробуем ещё раз на следующей попытке
      }

      if (attempts >= MAX_ATTEMPTS) {
        if (!cancelled) setState('timeout');
        return;
      }

      timer = setTimeout(check, POLL_INTERVAL_MS);
    }

    check();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="lk-success">
      <div className="lk-success-card">

        {state === 'checking' && (
          <>
            <Loader size={32} className="lk-spin" />
            <h2>Проверяем оплату…</h2>
            <p>Обычно это занимает несколько секунд, не закрывайте страницу.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle size={32} />
            <h2>Оплата прошла успешно</h2>
            <p>Ваш тариф активирован.</p>
            <LkButton variant="primary" onClick={() => navigate('/subscription/manage')}>
              Перейти в кабинет
            </LkButton>
          </>
        )}

        {state === 'failed' && (
          <>
            <AlertCircle size={32} />
            <h2>Оплата не прошла</h2>
            <p>Платёж отменён или произошла ошибка. Попробуйте ещё раз.</p>
            <LkButton variant="primary" onClick={() => navigate('/subscription/tariff')}>
              Вернуться к тарифам
            </LkButton>
          </>
        )}

        {state === 'timeout' && (
          <>
            <AlertCircle size={32} />
            <h2>Всё ещё обрабатываем платёж</h2>
            <p>Иногда подтверждение занимает больше времени. Проверьте статус в истории платежей чуть позже.</p>
            <LkButton variant="primary" onClick={() => navigate('/subscription/payments')}>
              К истории платежей
            </LkButton>
          </>
        )}

      </div>
    </section>
  );
}
