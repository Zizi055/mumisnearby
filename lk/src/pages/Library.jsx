import { useEffect, useMemo, useState } from 'react';
import LibraryCard from '../components/library/LibraryCard';

const categoryMeta = {
  stories: {
    title: 'Сказки',
    count: '100+ доступных сказок',
  },
  lullabies: {
    title: 'Колыбельная',
    count: '50+ доступных колыбельных',
  },
  therapy: {
    title: 'Терапия',
    count: '10+ доступных упражнений',
  },
  family: {
    title: 'Семейные истории',
    count: '70+ доступных историй',
  },
};

const FILTER_STORAGE_KEY = 'lk-library-filters-v1';

const initialFilters = {
  ageGroups: [],
  durationGroups: [],
  emotions: [],
  themes: [],
};

const filterLabels = {
  ageGroups: {
    '0-2': '0–2 года',
    '3-6': '3–6 лет',
    '7-10': '7–10 лет',
    '10+': '10+',
  },
  durationGroups: {
    '0-7': 'до 7 минут',
    '7-14': '7–14 минут',
    '14-21': '14–21 минут',
    '20+': 'от 20 минут',
  },
};

export default function Library() {
  const [activeCategory, setActiveCategory] = useState('stories');
  const [activeMode, setActiveMode] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);

  useEffect(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setAppliedFilters(parsed);
      setDraftFilters(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(appliedFilters));
  }, [appliedFilters]);

  const currentMeta = categoryMeta[activeCategory];

  const filteredItems = useMemo(() => {
    return [];
  }, [activeCategory, activeMode, searchValue, appliedFilters]);

  return (
    <section className="lk-page lk-page--library">
      <div className="lk-page__inner">

        <div className="lk-library-content">

          <div className="lk-library-head">
            <h2 className="lk-library-head__title">{currentMeta.title}</h2>
            <div className="lk-library-head__count">{currentMeta.count}</div>
          </div>

          <div className="lk-library-search-row">
            <div className="lk-library-search">
              <span className="lk-library-search__icon">⌕</span>
              <input
                className="lk-library-search__input"
                type="text"
                placeholder="Поиск по названию"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <div className="lk-library-quick-filters">
            <button
              type="button"
              className="lk-library-quick-filters__item"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
            >
              Фильтры ↓
            </button>
          </div>

          <div className="lk-library-modes">
            <button
              type="button"
              className={`lk-library-modes__item ${activeMode === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('all')}
            >
              Все
            </button>

            <button
              type="button"
              className={`lk-library-modes__item ${activeMode === 'favorites' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('favorites')}
            >
              Избранные
            </button>

            <button
              type="button"
              className={`lk-library-modes__item ${activeMode === 'new' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('new')}
            >
              Новые
            </button>
          </div>

          <div className="lk-library-grid">
            {filteredItems.map((item) => (
              <LibraryCard key={item.id} item={item} />
            ))}
          </div>

        </div>
      </div>

      <aside className={`lk-library-sidebar ${isFiltersOpen ? 'is-open' : ''}`}>
        {isFiltersOpen && (
          <div className="lk-filters-panel">

            <button
              type="button"
              className="lk-filters-panel__close"
              onClick={() => setIsFiltersOpen(false)}
            >
              ×
            </button>

            <div className="lk-filters-panel__group">
              <h4>Возраст</h4>
              {Object.entries(filterLabels.ageGroups).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes(key)}
                    onChange={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        ageGroups: prev.ageGroups.includes(key)
                          ? prev.ageGroups.filter((i) => i !== key)
                          : [...prev.ageGroups, key],
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="lk-filters-panel__footer">
              <button onClick={() => setAppliedFilters(draftFilters)}>
                Применить
              </button>

              <button
                onClick={() => {
                  setDraftFilters(initialFilters);
                  setAppliedFilters(initialFilters);
                }}
              >
                Сбросить
              </button>
            </div>

          </div>
        )}
      </aside>
    </section>
  );
}