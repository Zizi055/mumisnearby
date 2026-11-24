import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import LkInput from '../../components/ui/LkInput';
import { activatePromoCode } from '../../api/promo.service';
import { isStaffCabinet } from '../../config/cabinetMode';

// Вход по ссылке вида #/promo?code=XXXX. Без сессии уводим на вход
// и возвращаем сюда. Сотруднику компании промокод не нужен: тариф
// назначает кабинет юрлица.
export function PromoEntry() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const target = code
    ? `/subscription/promo?code=${encodeURIComponent(code)}`
    : '/subscription/promo';

  if (isStaffCabinet()) {
    return <Navigate to="/dashboard/progress" replace />;
  }

  if (!localStorage.getItem('token')) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <Navigate to={target} replace />;
}

function formatDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('ru-RU');
}

export default function PromoCode() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) {
      setError('Введите промокод.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const data = await activatePromoCode(clean);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Не удалось активировать промокод');
      setStatus('error');
    }
  };

  const until = formatDay(result?.conditions?.expires_at);
  const planName = result?.conditions?.plan_name;

  return (
    <section className="lk-bonus">
      <div className="lk-bonus__head">
        <div>
          <h2 className="lk-title">Промокод</h2>
          <p className="lk-text">
            Код включает тариф без оплаты. Его можно ввести один раз, после регистрации.
          </p>
        </div>
      </div>

      <form className="lk-promo-form" onSubmit={handleSubmit}>
        <LkInput
          label="Код"
          name="promo"
          value={code}
          autoComplete="off"
          placeholder="Вставьте код"
          disabled={status === 'loading' || status === 'success'}
          error={status === 'error' ? error : ''}
          onChange={(e) => {
            setCode(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
        />

        {status === 'success' && (
          <p className="lk-promo-form__ok">
            Код принят. Тариф «{planName || 'подписка'}»
            {until ? ` действует до ${until}` : ''}.
          </p>
        )}

        <LkButton
          type="submit"
          variant="primary"
          loading={status === 'loading'}
          disabled={status === 'success'}
        >
          <Ticket size={16} />
          {status === 'success' ? 'Активирован' : 'Активировать'}
        </LkButton>
      </form>
    </section>
  );
}
