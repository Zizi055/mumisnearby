import { useNavigate } from 'react-router-dom';
import LkButton from '../../components/ui/LkButton';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  return (
    <section className="lk-success">

      <div className="lk-success-card">

        <h2>Оплата прошла успешно</h2>

        <p>Ваш тариф активирован.</p>

        <LkButton
          variant="primary"
          onClick={() => navigate('/subscription/tariff')}
        >
          Перейти к тарифам
        </LkButton>

      </div>

    </section>
  );
}