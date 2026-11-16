import { useEffect, useState } from 'react';
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
  AudioLines,
} from 'lucide-react';
import { getVoiceAnalytics } from '../../api/generations.service';

const PERIODS = [7, 30, 90];

function formatCount(value) {
  return Number(value || 0).toLocaleString('ru-RU');
}

function formatRetention(value) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const total = Math.round(seconds);
  if (total < 60) return `${total} сек`;
  return `${Math.round(total / 60)} мин`;
}

function formatDay(iso) {
  const date = new Date(`${iso}T12:00:00+03:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function VoiceAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    getVoiceAnalytics({ days, topLimit: 5 })
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Не удалось загрузить аналитику');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [days]);

  const summary = data?.summary ?? {};
  const series = (data?.series ?? []).map((point) => ({
    day: formatDay(point.date),
    listens: point.listens ?? 0,
  }));
  const top = data?.top_scenarios ?? [];

  return (
    <section className="lk-voice-analytics">
      {/* hero */}
      <div className="lk-voice-analytics__hero">
        <div>
          <span className="lk-voice-analytics__eyebrow">
            Аналитика голоса
          </span>

          {/* Заголовок был написан языком корпоративной веб-аналитики
              («поведение пользователей», «вовлечённость») — для
              родителя, который смотрит статистику своего голоса, это
              чужая лексика. */}
          <h2>
            Как слушают ваш голос
          </h2>

          <p>
            Сколько раз включали записи, дослушивают ли до конца
            и какие сценарии выбирают чаще.
          </p>
        </div>

        <div className="lk-voice-analytics__badge" style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={`lk-btn lk-btn--sm ${days === period ? 'lk-btn--primary' : 'lk-btn--secondary'}`}
              onClick={() => setDays(period)}
            >
              {period} дн.
            </button>
          ))}
        </div>
      </div>

      {/* stats */}
      <div className="lk-voice-analytics__stats">
        <AnalyticsCard
          icon={<Headphones size={18} />}
          title="Прослушивания"
          value={loading ? '…' : formatCount(summary.listens)}
        />

        <AnalyticsCard
          icon={<Activity size={18} />}
          title="Удержание"
          value={loading ? '…' : formatRetention(summary.retention)}
        />

        <AnalyticsCard
          icon={<Clock3 size={18} />}
          title="Среднее время"
          value={loading ? '…' : formatDuration(summary.avg_duration_sec)}
        />

        <AnalyticsCard
          icon={<AudioLines size={18} />}
          title="Разных сценариев"
          value={loading ? '…' : formatCount(summary.generated_audios)}
        />
      </div>

      {error && <p className="lk-text">{error}</p>}

      {/* chart + side */}
      <div className="lk-voice-analytics__grid">
        {/* chart */}
        <div className="lk-analytics-chart">
          <div className="lk-analytics-chart__head">
            <div>
              <h3>Активность прослушиваний</h3>

              <p>
                Сколько раз включали записи за последние {days} дней.
              </p>
            </div>

            <div className="lk-analytics-chart__legend">
              <span />
              Прослушивания
            </div>
          </div>

          <div className="lk-analytics-chart__body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={series}>
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
                  dataKey="listens"
                  stroke="#5d8f72"
                  strokeWidth={3}
                  fill="url(#voiceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lk-analytics-table">
          <div className="lk-analytics-table__head">
            <div>
              <h3>Популярные сценарии</h3>
              <p>Что включали чаще всего за выбранные дни.</p>
            </div>
            <AudioLines size={18} />
          </div>

          <div className="lk-analytics-table__list">
            {top.length === 0 && (
              <p className="lk-text">Прослушиваний за этот период ещё не было.</p>
            )}
            {top.map((story) => (
              <div
                key={`${story.content_type}-${story.content_id}`}
                className="lk-analytics-table__row"
              >
                <div>
                  <strong>{story.title || 'Без названия'}</strong>
                </div>
                <div className="lk-analytics-table__value">
                  {formatCount(story.listens)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsCard({ icon, title, value }) {
  return (
    <div className="lk-analytics-card">
      <div className="lk-analytics-card__icon">
        {icon}
      </div>
      <div className="lk-analytics-card__body">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}