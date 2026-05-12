import { useEffect, useState } from 'react';

import {
  Clock3,
  CheckCircle2,
  AudioLines,
  ChevronRight,
} from 'lucide-react';

import {
  getActivityOverview,
} from '../api/activity.api.js';

export default function Activity() {
  const [data, setData] =
    useState(null);
    const [isFiltersOpen, setIsFiltersOpen] =
  useState(false);



  useEffect(() => {
    async function load() {
      const response =
        await getActivityOverview();

      setData(response);
    }

    load();
  }, []);

  if (!data) {
    return (
      <section className="lk-activity">
        loading...
      </section>
    );
  }

  return (
    <section className="lk-activity">

      {/* Активность */}

      <div className="lk-activity-summary">
        <article className="lk-activity-summary-card">
          <div className="lk-activity-summary-card__icon">
            <AudioLines size={18} />
          </div>

          <span>
            Всего действий
          </span>

          <strong>
            {data.summary.totalEvents}
          </strong>

          <p>
            Активность внутри платформы
          </p>
        </article>

        <article className="lk-activity-summary-card">
          <div className="lk-activity-summary-card__icon">
            <CheckCircle2 size={18} />
          </div>

          <span>
            Завершено сценариев
          </span>

          <strong>
            {data.summary.completedStories}
          </strong>

          <p>
            Полностью прослушано
          </p>
        </article>

        <article className="lk-activity-summary-card">
          <div className="lk-activity-summary-card__icon">
            <Clock3 size={18} />
          </div>

          <span>
            Время прослушивания
          </span>

          <strong>
            {data.summary.listeningTime}
          </strong>

          <p>
            За последние 7 дней
          </p>
        </article>
      </div>

      {/* История */}

      <section className="lk-activity-feed">
        <header className="lk-activity-feed__head">
          <div>
            <h2>
              Последняя активность
            </h2>

            <p>
              История действий внутри платформы.
            </p>
          </div>


        </header>

        <div className="lk-activity-list">
          {data.events.map((item) => {
            const Icon =
              item.icon;

            return (
              <article
                key={item.id}
                className="lk-activity-item"
              >
                <div className="lk-activity-item__icon">
                  <Icon size={18} />
                </div>

                <div className="lk-activity-item__content">
                  <div className="lk-activity-item__top">
                    <div className="lk-activity-item__info">
                      <strong>
                        {item.title}
                      </strong>

                      <time>
                        {item.time}
                      </time>
                    </div>

                    <div
                      className={`
                        lk-activity-item__status
                        ${
                          item.status === 'success'
                            ? 'is-success'
                            : ''
                        }
                        ${
                          item.status === 'paused'
                            ? 'is-paused'
                            : ''
                        }
                      `}
                    >
                      {item.category}
                    </div>
                  </div>

                  <p>
                    {item.description}
                  </p>

                  <div className="lk-activity-item__meta">
                    <span>
                      Голос:
                    </span>

                    <strong>
                      {item.voice}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </section>
    </section>
  );
}