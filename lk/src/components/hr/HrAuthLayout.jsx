import AuthDNA from '../../pages/AuthDNA';
import HrAuthTabs from './HrAuthTabs';

// ─────────────────────────────────────────────────────────────────────
// Экран входа в кабинет компании — тот же сплит, что в клиентском ЛК:
// слева анимация ДНК на тёмном фоне, справа форма.
//
// Переиспользуем классы .auth__* и сам компонент AuthDNA, а не копируем
// их: это 260 строк канваса и 500 строк стилей, которые иначе пришлось
// бы править в двух местах. Отличается только текст слева — он про
// компанию, а не про родителя.
//
// Левая колонка на телефоне скрывается (правило в auth.scss): анимация
// там съедала бы весь первый экран, а форма уезжала бы под сгиб.
// ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  'Промокоды для сотрудников — пачкой и с QR',
  'Статистика без доступа к записям семей',
  'Первые 3 дня бесплатно, без оплаты',
];

export default function HrAuthLayout({ wide = false, children }) {
  return (
    <div className="auth">
      <div className="auth__left">
        <AuthDNA />

        <div className="auth__left-content">
          <div className="auth__brand">Родной Голос · для компаний</div>

          <div className="auth__tagline">
            <h1>
              Забота о том,
              <br />
              что сотруднику
              <br />
              важнее работы
            </h1>
            <p>
              Корпоративная льгота, которая возвращает родителям вечер с
              ребёнком. Голос сотрудника читает его детям сказки — даже когда
              он на смене, в рейсе или на совещании.
            </p>
          </div>

          <div className="auth__features">
            {FEATURES.map((text) => (
              <div className="auth__feature" key={text}>
                <span className="auth__feature-dot" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth__right">
        <div
          className={`auth__card auth__card--hr ${wide ? 'auth__card--hr-wide' : ''}`}
        >
          <HrAuthTabs />
          {children}
        </div>
      </div>
    </div>
  );
}
