import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Headphones,
  Clock3,
  Activity,
  Sparkles,
  TrendingUp,
  Users,
  AudioLines,
  ShieldCheck,
} from 'lucide-react';

const listensData = [
  { day: '01', value: 120 },
  { day: '02', value: 180 },
  { day: '03', value: 260 },
  { day: '04', value: 310 },
  { day: '05', value: 420 },
  { day: '06', value: 510 },
  { day: '07', value: 640 },
];

const emotionsData = [
  {
    label: 'Спокойный',
    value: 48,
  },
  {
    label: 'Колыбельный',
    value: 31,
  },
  {
    label: 'Терапевтический',
    value: 21,
  },
];

const topStories = [
  {
    title: 'Сонный лес',
    listens: 284,
    avg: '5:22',
  },
  {
    title: 'Тихий океан',
    listens: 196,
    avg: '4:48',
  },
  {
    title: 'Лунный свет',
    listens: 142,
    avg: '6:11',
  },
];

export default function VoiceAnalytics() {
  return (
    <section className="lk-voice-analytics">
      {/* hero */}
      <div className="lk-voice-analytics__hero">
        <div>
          <span className="lk-voice-analytics__eyebrow">
            Аналитика голоса
          </span>

          <h2>
            Поведение пользователей и качество взаимодействия
          </h2>

          <p>
            Отслеживайте прослушивания, удержание, эмоциональные сценарии
            и вовлечённость голосовой модели.
          </p>
        </div>

        <div className="lk-voice-analytics__badge">
          <ShieldCheck size={16} />
          Голос активен
        </div>
      </div>

      {/* stats */}
      <div className="lk-voice-analytics__stats">
        <AnalyticsCard
          icon={<Headphones size={18} />}
          title="Прослушивания"
          value="1 240"
          growth="+18%"
        />

        <AnalyticsCard
          icon={<Activity size={18} />}
          title="Удержание"
          value="78%"
          growth="+4%"
        />

        <AnalyticsCard
          icon={<Clock3 size={18} />}
          title="Среднее время"
          value="6 мин"
          growth="+12%"
        />

        <AnalyticsCard
          icon={<Users size={18} />}
          title="Уникальные дети"
          value="86"
          growth="+9%"
        />
      </div>

      {/* chart + side */}
      <div className="lk-voice-analytics__grid">
        {/* chart */}
        <div className="lk-analytics-chart">
          <div className="lk-analytics-chart__head">
            <div>
              <h3>Активность прослушиваний</h3>

              <p>
                Динамика использования голосовой модели за последние 7 дней.
              </p>
            </div>

            <div className="lk-analytics-chart__legend">
              <span />
              Прослушивания
            </div>
          </div>

          <div className="lk-analytics-chart__body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={listensData}>
                <defs>
                  <linearGradient
                    id="voiceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="rgba(93,143,114,0.55)"
                    />

                    <stop
                      offset="100%"
                      stopColor="rgba(93,143,114,0)"
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148,163,184,0.12)"
                />

                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#5d8f72"
                  strokeWidth={3}
                  fill="url(#voiceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* side */}
        <div className="lk-analytics-side">
          <div className="lk-analytics-side__card">
            <div className="lk-analytics-side__icon">
              <Sparkles size={18} />
            </div>

            <div>
              <h3>Эмоциональный профиль</h3>

              <p>
                Наиболее востребованные режимы использования голоса.
              </p>
            </div>

            <div className="lk-analytics-emotions">
              {emotionsData.map((item) => (
                <div
                  key={item.label}
                  className="lk-analytics-emotions__item"
                >
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.value}%</span>
                  </div>

                  <div className="lk-analytics-emotions__line">
                    <span
                      style={{
                        width: `${item.value}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lk-analytics-side__card">
            <div className="lk-analytics-side__icon">
              <TrendingUp size={18} />
            </div>

            <div>
              <h3>AI рекомендации</h3>

              <p>
                Система предлагает улучшения для повышения удержания.
              </p>
            </div>

            <ul className="lk-analytics-ai">
              <li>
                Увеличить мягкость голоса на 6%
              </li>

              <li>
                Замедлить скорость чтения перед сном
              </li>

              <li>
                Добавить больше пауз между фразами
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="lk-analytics-content">
        {/* stories */}
        <div className="lk-analytics-table">
          <div className="lk-analytics-table__head">
            <div>
              <h3>Популярные сценарии</h3>

              <p>
                Контент, в котором голос используется чаще всего.
              </p>
            </div>

            <AudioLines size={18} />
          </div>

          <div className="lk-analytics-table__list">
            {topStories.map((story) => (
              <div
                key={story.title}
                className="lk-analytics-table__row"
              >
                <div>
                  <strong>{story.title}</strong>

                  <span>
                    Среднее прослушивание {story.avg}
                  </span>
                </div>

                <div className="lk-analytics-table__value">
                  {story.listens}
                </div>
              </div>
            ))}
          </div>
        </div>

       {/* insights */}
<div className="lk-analytics-meta">
  <div className="lk-analytics-meta__head">
    <div>
      <h3>Состояние голосовой модели</h3>

      <p>
        Краткая сводка по качеству взаимодействия и активности пользователей.
      </p>
    </div>

    <div className="lk-analytics-meta__badge">
      Активно
    </div>
  </div>

  <div className="lk-analytics-meta__list">
    <div className="lk-analytics-meta__item">
      <strong>Высокое удержание</strong>

      <span>
        Пользователи дослушивают большинство сценариев до конца.
      </span>
    </div>

    <div className="lk-analytics-meta__item">
      <strong>Стабильная активность</strong>

      <span>
        Голос используется регулярно в вечернее время.
      </span>
    </div>

    <div className="lk-analytics-meta__item">
      <strong>Лучший эмоциональный режим</strong>

      <span>
        Наиболее высокий отклик показывает колыбельный пресет.
      </span>
    </div>

    <div className="lk-analytics-meta__item">
      <strong>Средняя глубина прослушивания</strong>

      <span>
        Пользователи проводят с голосом более 6 минут за сессию.
      </span>
    </div>

    <div className="lk-analytics-meta__item">
      <strong>AI оптимизация активна</strong>

      <span>
        Система анализирует поведение пользователей для улучшения сценариев.
      </span>
    </div>
  </div>
</div>
      </div>
    </section>
  );
}

function AnalyticsCard({
  icon,
  title,
  value,
  growth,
}) {
  return (
    <div className="lk-analytics-card">
      <div className="lk-analytics-card__icon">
        {icon}
      </div>

      <div className="lk-analytics-card__body">
        <span>{title}</span>

        <strong>{value}</strong>
      </div>

      <div className="lk-analytics-card__growth">
        {growth}
      </div>
    </div>
  );
}