import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LibraryCard from '../components/library/LibraryCard';
import { libraryData } from '../data/libraryData'; // ❗ ОБЯЗАТЕЛЬНО

const categoryMeta = {
  stories: { title: 'Сказки', count: '100+ доступных сказок' },
  lullabies: { title: 'Колыбельные', count: '50+ доступных колыбельных' },
  therapy: { title: 'Терапия', count: '10+ доступных упражнений' },
  family: { title: 'Семейные истории', count: '70+ доступных историй' },
};

const FILTER_STORAGE_KEY = 'lk-library-filters-v1';

const initialFilters = {
  ageGroups: [],
  durationGroups: [],
  emotions: [],
  themes: [],
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
    if (saved) {
      const parsed = JSON.parse(saved);
      setAppliedFilters(parsed);
      setDraftFilters(parsed);
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

  const filteredItems = useMemo(() => {
    let items = libraryData.filter(
      (item) => item.category === activeCategory
    );

    if (activeMode === 'favorites') {
      items = items.filter((item) => item.isFavorite);
    }

    if (activeMode === 'new') {
      items = items.filter((item) => item.isNew);
    }

    if (searchValue.trim()) {
      const query = searchValue.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
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

    return items;
  }, [activeCategory, activeMode, searchValue, appliedFilters]);

  const toggleDraftFilter = (group, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((i) => i !== value)
        : [...prev[group], value],
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <section className="lk-page lk-page--library">
      {/* ✅ overlay */}
      {isFiltersOpen && (
        <div
          className="lk-overlay"
          onClick={() => setIsFiltersOpen(false)}
        />
      )}

      <div className="lk-page__inner">
        <div className="lk-library-content">

          <div className="lk-library-head">
            <h2>{currentMeta.title}</h2>
            <div>{currentMeta.count}</div>
          </div>

          <div className="lk-library-search">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Поиск"
            />
          </div>

          <button onClick={() => setIsFiltersOpen(true)}>
            Фильтры
          </button>

          <div className="lk-library-grid">
            {filteredItems.map((item) => (
              <LibraryCard key={item.id} item={item} />
            ))}
          </div>

        </div>
      </div>

      {/* ✅ sidebar ВСЕГДА в DOM */}
      <aside className={`lk-library-sidebar ${isFiltersOpen ? 'is-open' : ''}`}>
        <div className="lk-filters-panel">

          <button onClick={() => setIsFiltersOpen(false)}>×</button>

          <h3>Фильтры</h3>

          <div>
            <h4>Возраст</h4>
            {['0-2', '3-6', '7-10'].map((v) => (
              <label key={v}>
                <input
                  type="checkbox"
                  checked={draftFilters.ageGroups.includes(v)}
                  onChange={() => toggleDraftFilter('ageGroups', v)}
                />
                {v}
              </label>
            ))}
          </div>

          <div className="lk-filters-panel__footer">
            <button onClick={applyFilters}>Применить</button>
            <button onClick={resetFilters}>Сбросить</button>
          </div>

        </div>
      </aside>
    </section>
  );
}