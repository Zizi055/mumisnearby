export default function SubscriptionPayments() {
  return (
    <div className="lk-subscription">
      <h2 className="lk-title">История платежей</h2>

      <div className="lk-list">
        <div className="lk-list__item">
          <div>
            <div>Хранитель</div>
            <div className="lk-list__time">12.01.2026</div>
          </div>
          <div>14 400 ₽</div>
        </div>

        <div className="lk-list__item">
          <div>
            <div>Продление</div>
            <div className="lk-list__time">12.01.2025</div>
          </div>
          <div>14 400 ₽</div>
        </div>
      </div>
    </div>
  );
}