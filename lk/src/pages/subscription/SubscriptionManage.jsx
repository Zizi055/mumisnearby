export default function SubscriptionManage() {
  return (
    <div className="lk-subscription">
      <h2 className="lk-title">Управление подпиской</h2>

      <div className="lk-card">
        <div className="lk-card__label">Следующее списание</div>
        <div className="lk-card__value">12 февраля 2026</div>
      </div>

      <div className="lk-actions">
        <button className="lk-btn-primary">Сменить тариф</button>
        <button className="lk-btn-secondary">Отменить подписку</button>
      </div>
    </div>
  );
}