import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import LibraryCard from '../components/library/LibraryCard';

import {
  LIBRARY_ITEMS,
  LIBRARY_FILTERS,
} from '../data/libraryCatalog.data';

const categoryMeta = {
  stories: {
    type: 'fairy_tale',
    title: 'Сказки',
    count: '100+ доступных сказок',
    description:
      'Добрые истории для сна, спокойствия и воображения.',
  },

  lullabies: {
    type: 'lullaby',
    title: 'Колыбельные',
    count: '50+ колыбельных',
    description:
      'Мягкие голосовые сценарии для вечернего ритуала.',
  },

  therapy: {
    type: 'therapy',
    title: '10+ терапевтических сценариев',
    count: '10+ терапевтических сценариев',
    description:
      'Поддерживающие аудиосценарии и эмоциональная адаптация.',
  },

  family: {
    type: 'family_story',
    title: 'Семейные истории',
    count: '70+ семейных историй',
    description:
      'Личные воспоминания и родные голосовые послания.',
  },
};

const FILTER_STORAGE_KEY =
  'lk-library-filters-v2';

const initialFilters = {
  ageGroups: [],
  durationGroups: [],
  emotions: [],
  themes: [],
};

export default function Library() {
  const location = useLocation();

  const categoryFromUrl =
    location.pathname.split('/').pop();

  const activeCategory =
    categoryMeta[categoryFromUrl]
      ? categoryFromUrl
      : 'stories';

  const [activeMode, setActiveMode] =
    useState('all');

  const [searchValue, setSearchValue] =
    useState('');

  const [isFiltersOpen, setIsFiltersOpen] =
    useState(false);

  const [appliedFilters, setAppliedFilters] =
    useState(initialFilters);

  const [draftFilters, setDraftFilters] =
    useState(initialFilters);

  useEffect(() => {
    const saved = localStorage.getItem(
      FILTER_STORAGE_KEY
    );

    if (saved) {
      const parsed = JSON.parse(saved);

      setAppliedFilters(parsed);
      setDraftFilters(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify(appliedFilters)
    );
  }, [appliedFilters]);

  useEffect(() => {
    setActiveMode('all');
    setSearchValue('');
  }, [activeCategory]);

  const currentMeta =
    categoryMeta[activeCategory];

  const filteredItems = useMemo(() => {
    let items = LIBRARY_ITEMS.filter(
      (item) =>
        item.type === currentMeta.type
    );

    if (activeMode === 'favorites') {
      items = items.filter(
        (item) => item.isFavorite
      );
    }

    if (activeMode === 'new') {
      items = items.filter(
        (item) => item.isNew
      );
    }

    if (searchValue.trim()) {
      const query =
        searchValue.toLowerCase();

      items = items.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(query) ||
          item.description
            .toLowerCase()
            .includes(query)
      );
    }

    if (
      appliedFilters.ageGroups.length
    ) {
      items = items.filter((item) =>
        appliedFilters.ageGroups.includes(
          item.age
        )
      );
    }

    if (
      appliedFilters.durationGroups.length
    ) {
      items = items.filter((item) =>
        appliedFilters.durationGroups.some(
          (group) =>
            checkDuration(
              item.duration,
              group
            )
        )
      );
    }

    if (
      appliedFilters.emotions.length
    ) {
      items = items.filter((item) =>
        appliedFilters.emotions.some(
          (emotion) =>
            item.emotions.includes(
              emotion
            )
        )
      );
    }

    if (appliedFilters.themes.length) {
      items = items.filter((item) =>
        appliedFilters.themes.some(
          (theme) =>
            item.themes.includes(theme)
        )
      );
    }

    return items;
  }, [
    activeCategory,
    activeMode,
    searchValue,
    appliedFilters,
    currentMeta.type,
  ]);

  const toggleDraftFilter = (
    group,
    value
  ) => {
    setDraftFilters((prev) => ({
      ...prev,

      [group]: prev[group].includes(
        value
      )
        ? prev[group].filter(
            (i) => i !== value
          )
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
    <section className="lk-library-page">

      {isFiltersOpen && (
        <div
          className="lk-library-overlay"
          onClick={() =>
            setIsFiltersOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`lk-library-sidebar ${
          isFiltersOpen
            ? 'is-open'
            : ''
        }`}
      >
        <div className="lk-library-filters">

          <div className="lk-library-filters__head">

            <button
              type="button"
              className="lk-library-filters__title"
            >
              <SlidersHorizontal
                size={18}
              />
              Фильтры
            </button>

            <button
              type="button"
              className="lk-library-filters__close"
              onClick={() =>
                setIsFiltersOpen(false)
              }
            >
              <X size={18} />
            </button>

          </div>

          {/* AGE */}
          <div className="lk-library-group">

            <div className="lk-library-group__head">
              <h3>Возраст</h3>
            </div>

            <div className="lk-library-checkboxes">

              {LIBRARY_FILTERS.age.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`lk-library-checkbox ${
                      draftFilters.ageGroups.includes(
                        item.id
                      )
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleDraftFilter(
                        'ageGroups',
                        item.id
                      )
                    }
                  >
                    <span />

                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>

          {/* DURATION */}
          <div className="lk-library-group">

            <div className="lk-library-group__head">
              <h3>Длительность</h3>
            </div>

            <div className="lk-library-checkboxes">

              {LIBRARY_FILTERS.duration.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`lk-library-checkbox ${
                      draftFilters.durationGroups.includes(
                        item.id
                      )
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleDraftFilter(
                        'durationGroups',
                        item.id
                      )
                    }
                  >
                    <span />

                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>

          {/* EMOTIONS */}
          <div className="lk-library-group">

            <div className="lk-library-group__head">
              <h3>Эмоции</h3>
            </div>

            <div className="lk-library-tags">

              {LIBRARY_FILTERS.emotions.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`lk-library-tag ${
                      draftFilters.emotions.includes(
                        item.id
                      )
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleDraftFilter(
                        'emotions',
                        item.id
                      )
                    }
                  >
                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>

          {/* THEMES */}
          <div className="lk-library-group">

            <div className="lk-library-group__head">
              <h3>Темы</h3>
            </div>

            <div className="lk-library-tags">

              {LIBRARY_FILTERS.themes.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`lk-library-tag ${
                      draftFilters.themes.includes(
                        item.id
                      )
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleDraftFilter(
                        'themes',
                        item.id
                      )
                    }
                  >
                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>

          <div className="lk-library-filters__footer">

            <button
              type="button"
              className="lk-library-apply"
              onClick={applyFilters}
            >
              Применить
            </button>

            <button
              type="button"
              className="lk-library-reset"
              onClick={resetFilters}
            >
              Сбросить
            </button>

          </div>

        </div>
      </aside>

      {/* CONTENT */}
      <div className="lk-library-content">

        {/* HERO */}
        <div className="lk-library-hero">

          <div>

            <span className="lk-library-hero__eyebrow">
              Библиотека
            </span>

            <h2>
              {currentMeta.title}
            </h2>

            <p>
              {
                currentMeta.description
              }
            </p>

          </div>

          <div className="lk-library-hero__count">
            {currentMeta.count}
          </div>

        </div>

        {/* TOPBAR */}
        <div className="lk-library-topbar">

          <div className="lk-library-search">

            <Search size={16} />

            <input
              value={searchValue}
              onChange={(e) =>
                setSearchValue(
                  e.target.value
                )
              }
              placeholder="Поиск по библиотеке"
            />

          </div>

          <div className="lk-library-modes">

            <button
              type="button"
              className={
                activeMode === 'all'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setActiveMode('all')
              }
            >
              Все
            </button>

            <button
              type="button"
              className={
                activeMode ===
                'favorites'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setActiveMode(
                  'favorites'
                )
              }
            >
              Избранное
            </button>

            <button
              type="button"
              className={
                activeMode === 'new'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setActiveMode('new')
              }
            >
              Новое
            </button>

          </div>

          <button
            type="button"
            className="lk-library-mobile-filter"
            onClick={() =>
              setIsFiltersOpen(true)
            }
          >
            <SlidersHorizontal
              size={16}
            />
            Фильтры
          </button>

        </div>

        {/* GRID */}
        <div className="lk-library-grid">

          {filteredItems.map(
            (item) => (
              <LibraryCard
                key={item.id}
                item={item}
              />
            )
          )}

        </div>

      </div>

    </section>
  );
}

function checkDuration(
  duration,
  durationId
) {
  switch (durationId) {

    case 'under-7':
      return duration < 7;

    case '7-14':
      return (
        duration >= 7 &&
        duration <= 14
      );

    case '14-21':
      return (
        duration >= 14 &&
        duration <= 21
      );

    case 'over-20':
      return duration >= 20;

    default:
      return true;
  }
}