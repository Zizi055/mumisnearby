// Единый вид «тетрадных линеек» для лимитов тарифа: используется и в
// карточках на странице «Тариф», и в оформлении подписки. Раньше каждая
// страница рисовала свой список по-своему (маркированные точки в одном
// месте, таблица в другом), из-за чего одни и те же данные выглядели
// по-разному.

const LIMIT_ROWS = [
  ['fairyTales', 'Сказки'],
  ['lullabies', 'Колыбельные'],
  ['therapic', 'Терапевтические'],
  ['familyStories', 'Семейные истории'],
  ['poems', 'Стихи'],
  ['stories', 'Рассказы'],
  ['voiceClones', 'Голосовые двойники'],
];

export default function PlanLimitsList({ tariff, title = 'Лимиты генерации в месяц' }) {
  const limits = tariff?.limits;

  // Конструктор и любой тариф без данных с бэка: показываем его
  // текстовые пункты теми же строками, без маркеров-точек.
  if (!limits) {
    const features = tariff?.features || [];
    if (features.length === 0) return null;

    return (
      <div className="lk-plan-limits">
        <p className="lk-plan-limits__title">Что входит</p>

        <ul className="lk-plan-limits__list">
          {features.map((feature) => (
            <li key={feature}>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const rows = LIMIT_ROWS.filter(([key]) => limits[key] != null);
  if (rows.length === 0) return null;

  return (
    <div className="lk-plan-limits">
      <p className="lk-plan-limits__title">{title}</p>

      <ul className="lk-plan-limits__list">
        {rows.map(([key, label]) => (
          <li key={key}>
            <span>{label}</span>
            <strong>{limits[key]}</strong>
          </li>
        ))}
      </ul>

      {tariff.audioFormat && (
        <p className="lk-plan-limits__note">
          Формат аудио: {tariff.audioFormat.toUpperCase()}
          {tariff.hasTimeCapsule ? ' · Капсула времени' : ''}
        </p>
      )}
    </div>
  );
}
