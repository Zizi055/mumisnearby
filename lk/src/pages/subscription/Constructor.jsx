import LkButton from '../../components/ui/LkButton';
import { useNavigate } from 'react-router-dom';

export default function Constructor() {
  const navigate = useNavigate();

  return (
    <section className="lk-page">
      <div className="lk-page__inner">
        <div className="lk-empty-state">
          <h2 className="lk-title">Конструктор тарифа</h2>
          <p className="lk-text">
            Скоро здесь можно будет собрать индивидуальный тариф под семью.
          </p>

          <LkButton variant="primary" onClick={() => navigate('/subscription/tariff')}>
            Вернуться к тарифам
          </LkButton>
        </div>
      </div>
    </section>
  );
}