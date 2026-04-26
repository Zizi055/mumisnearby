export default function VoiceAnalytics() {
  return (
    <div className="lk-voice">
      <h2 className="lk-title">Аналитика голоса</h2>

      <div className="lk-kpi">
        <Kpi title="Прослушивания" value="1 240" />
        <Kpi title="Удержание" value="78%" />
        <Kpi title="Среднее время" value="6 мин" />
      </div>

      <div className="lk-card lk-chart">
        <div className="lk-chart__fake" />
      </div>
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="lk-card lk-card--accent">
      <div className="lk-card__value">{value}</div>
      <div className="lk-card__label">{title}</div>
    </div>
  );
}