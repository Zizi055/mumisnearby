import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const categoryFromUrl = location.pathname.split('/').pop();

  const activeCategory = categoryMeta[categoryFromUrl]
    ? categoryFromUrl
    : 'stories';

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

      const nextFilters = {
        ageGroups: parsed.ageGroups || [],
        durationGroups: parsed.durationGroups || [],
        emotions: parsed.emotions || [],
        themes: parsed.themes || [],
      };

      setAppliedFilters(nextFilters);
      setDraftFilters(nextFilters);
    } catch (error) {
      console.error('Не удалось прочитать фильтры из localStorage', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(appliedFilters));
  }, [appliedFilters]);

  useEffect(() => {
    setActiveMode('all');
    setSearchValue('');
  }, [activeCategory]);

  const currentMeta = categoryMeta[activeCategory];

  const activeFilterChips = useMemo(() => {
    return [
      ...appliedFilters.ageGroups.map((value) => ({
        group: 'ageGroups',
        value,
        label: filterLabels.ageGroups[value],
      })),
      ...appliedFilters.durationGroups.map((value) => ({
        group: 'durationGroups',
        value,
        label: filterLabels.durationGroups[value],
      })),
      ...appliedFilters.emotions.map((value) => ({
        group: 'emotions',
        value,
        label: value,
      })),
      ...appliedFilters.themes.map((value) => ({
        group: 'themes',
        value,
        label: value,
      })),
    ];
  }, [appliedFilters]);

  const filteredItems = useMemo(() => {
    let items = libraryData.filter((item) => item.category === activeCategory);

    if (activeMode === 'favorites') {
      items = items.filter((item) => item.isFavorite);
    }

    if (activeMode === 'new') {
      items = items.filter((item) => item.isNew);
    }

    if (searchValue.trim()) {
      const query = searchValue.trim().toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(query));
    }

    if (appliedFilters.ageGroups.length) {
      items = items.filter((item) =>
        appliedFilters.ageGroups.includes(item.ageGroup)
      );
    }

    if (appliedFilters.durationGroups.length) {
      items = items.filter((item) =>
        appliedFilters.durationGroups.includes(item.durationGroup)
      );
    }

    if (appliedFilters.emotions.length) {
      items = items.filter((item) =>
        appliedFilters.emotions.every((emotion) =>
          item.emotions.includes(emotion)
        )
      );
    }

    if (appliedFilters.themes.length) {
      items = items.filter((item) =>
        appliedFilters.themes.every((theme) =>
          item.themes.includes(theme)
        )
      );
    }

    return items;
  }, [activeCategory, activeMode, searchValue, appliedFilters]);

  const toggleDraftFilter = (group, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((item) => item !== value)
        : [...prev[group], value],
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const removeAppliedFilter = (group, value) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [group]: prev[group].filter((item) => item !== value),
    }));

    setDraftFilters((prev) => ({
      ...prev,
      [group]: prev[group].filter((item) => item !== value),
    }));
  };

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

            <button
              type="button"
              className="lk-library-quick-filters__item"
              onClick={() => setIsFiltersOpen(true)}
            >
              Длительность
            </button>

            <button
              type="button"
              className="lk-library-quick-filters__item"
              onClick={() => setIsFiltersOpen(true)}
            >
              Возраст
            </button>

            <button
              type="button"
              className="lk-library-quick-filters__item"
              onClick={() => setIsFiltersOpen(true)}
            >
              Эмоции
            </button>

            <button
              type="button"
              className="lk-library-quick-filters__item"
              onClick={() => setIsFiltersOpen(true)}
            >
              Тема
            </button>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="lk-library-active-filters">
              {activeFilterChips.map((chip) => (
                <button
                  key={`${chip.group}-${chip.value}`}
                  type="button"
                  className="lk-library-active-filters__chip"
                  onClick={() => removeAppliedFilter(chip.group, chip.value)}
                >
                  {chip.label} ×
                </button>
              ))}

              <button
                type="button"
                className="lk-library-active-filters__reset"
                onClick={resetFilters}
              >
                Очистить все
              </button>
            </div>
          )}

          <div className="lk-library-modes">
            <button
              type="button"
              className={`lk-library-modes__item ${activeMode === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('all')}
            >
              Все {currentMeta.title.toLowerCase()}
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
            <div className="lk-filters-panel__close-row">
              <button
                type="button"
                className="lk-filters-panel__close"
                onClick={() => setIsFiltersOpen(false)}
              >
                ×
              </button>
            </div>

            <button type="button" className="lk-filters-panel__title-btn">
              + Фильтры
            </button>

            <div className="lk-filters-panel__group">
              <h4 className="lk-filters-panel__group-title">Возраст</h4>

              {Object.entries(filterLabels.ageGroups).map(([value, label]) => (
                <label key={value} className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes(value)}
                    onChange={() => toggleDraftFilter('ageGroups', value)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="lk-filters-panel__group">
              <h4 className="lk-filters-panel__group-title">Длительность</h4>

              {Object.entries(filterLabels.durationGroups).map(([value, label]) => (
                <label key={value} className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.durationGroups.includes(value)}
                    onChange={() => toggleDraftFilter('durationGroups', value)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="lk-filters-panel__group">
              <h4 className="lk-filters-panel__group-title">Эмоции</h4>

              <div className="lk-filters-panel__chips">
                {['Счастье', 'Сон', 'Уют', 'Спокойствие', 'Тепло', 'Радость', 'Смелость', 'Любовь'].map((emotion) => (
                  <button
                    key={emotion}
                    type="button"
                    className={`lk-filters-panel__chip ${draftFilters.emotions.includes(emotion) ? 'is-active' : ''}`}
                    onClick={() => toggleDraftFilter('emotions', emotion)}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div className="lk-filters-panel__group">
              <h4 className="lk-filters-panel__group-title">Тема</h4>

              <div className="lk-filters-panel__chips">
                {['Дружба', 'Космос', 'Животные', 'Семья'].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={`lk-filters-panel__chip ${draftFilters.themes.includes(theme) ? 'is-active' : ''}`}
                    onClick={() => toggleDraftFilter('themes', theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="lk-filters-panel__footer">
              <button
                type="button"
                className="lk-filters-panel__apply"
                onClick={applyFilters}
              >
                Применить
              </button>

              <button
                type="button"
                className="lk-filters-panel__reset"
                onClick={resetFilters}
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