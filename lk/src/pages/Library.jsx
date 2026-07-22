import { useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import {
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import LibraryCard from '../components/library/LibraryCard';

import {
  LIBRARY_FILTERS,
} from '../data/libraryCatalog.data';

import { useLibraryStore } from '../store/library.store';
import { getTrialInfo } from '../store/trial.store';
import { useHasPaidPlan, useTariffLevel } from '../store/subscription.store';

// В пробном периоде: только категория сказок, первые 5 открыты
const TRIAL_FREE_COUNT = 5;
const TRIAL_FREE_CATEGORY = 'stories';

const categoryMeta = {
  stories: {
    type: 'fairy_tale',
    title: 'Сказки',
    count: '100+ доступных сказок',
    description: 'Добрые истории для сна, спокойствия и воображения.',
  },
  lullabies: {
    type: 'lullaby',
    title: 'Колыбельные',
    count: '50+ колыбельных',
    description: 'Мягкие голосовые сценарии для вечернего ритуала.',
  },
  therapy: {
    type: 'therapy',
    title: 'Терапевтические сценарии',
    count: '10+ терапевтических сценариев',
    description: 'Поддерживающие аудиосценарии и эмоциональная адаптация.',
  },
  family: {
    type: 'family_story',
    title: 'Семейные истории',
    count: '70+ семейных историй',
    description: 'Личные воспоминания и родные голосовые послания.',
  },

  poems: {
    type: 'poem',
    title: 'Рассказы и стихи',
    count: '80+ рассказов и стихотворений',
    description: 'Короткие рассказы и добрые стихи для ежедневного чтения.',
  },
};

const FILTER_STORAGE_KEY = 'lk-library-filters-v3';

const initialFilters = {
  age: [],
  duration: [],
  emotions: [],
  themes: [],
};

export default function Library() {
  const location = useLocation();

  const categoryFromUrl = location.pathname.split('/').pop();

  const activeCategory =
    categoryMeta[categoryFromUrl] ? categoryFromUrl : 'stories';

  const currentMeta = categoryMeta[activeCategory];

  const PAGE_SIZE = 8; // 2 ряда по 4 карточки

  const hasPaidPlan = useHasPaidPlan();
  const trial = !hasPaidPlan ? getTrialInfo() : null;
  const isTrialMode = !!trial;
  // Триал истёк — блокируем всё. Иначе: только сказки первые 5 открыты
  const trialExpired = isTrialMode && trial?.isExpired;
  const isLockedCategory = isTrialMode && (trialExpired || activeCategory !== TRIAL_FREE_CATEGORY);

  // Гейтинг по тарифу: access_lvl контента (0-4) сравнивается с уровнем
  // текущего тарифа пользователя. 0 = демо, доступно всем.
  const tariffLevel = useTariffLevel();

  const [activeMode, setActiveMode] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const {
    filteredItems,
    loading,
    error,
    filters,
    loadLibrary,
    setSearch,
    setType,
    toggleFilter,
    resetFilters,
    applyFilters,
  } = useLibraryStore();

  // Сбрасываем пагинацию при смене категории, режима или поиска
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [currentMeta.type, activeMode, filters.search]);

  // Загружаем при первом монтировании и при смене категории
  useEffect(() => {
    setType(currentMeta.type);
  }, [currentMeta.type]);

  // Запасная загрузка — если store пустой после mount
  useEffect(() => {
    if (filteredItems.length === 0 && !loading) {
      loadLibrary();
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      setDraftFilters(parsed);

      Object.entries(parsed).forEach(([group, values]) => {
        values.forEach((value) => {
          toggleFilter(group, value);
        });
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify(draftFilters)
    );
  }, [draftFilters]);

  const toggleDraftFilter = (group, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((i) => i !== value)
        : [...prev[group], value],
    }));
  };

  const handleApplyFilters = () => {
    resetFilters();

    Object.entries(draftFilters).forEach(([group, values]) => {
      values.forEach((value) => {
        toggleFilter(group, value);
      });
    });

    applyFilters();
    setIsFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(initialFilters);
    resetFilters();
    applyFilters();
  };

  const allMatchingItems = filteredItems.filter((item) => {
    if (activeMode === 'favorites') return item.isFavorite;
    if (activeMode === 'new') return item.isNew;
    if (activeMode === 'folk') return item.isRussianFolk;
    return true;
  });

  const visibleItems = allMatchingItems.slice(0, visibleCount);
  const hasMore = visibleCount < allMatchingItems.length;

  const favoritesCount = filteredItems.filter((i) => i.isFavorite).length;

  return (
    <section className="lk-library-page">

      {isFiltersOpen && (
        <div
          className="lk-library-overlay"
          onClick={() => setIsFiltersOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`lk-library-sidebar ${isFiltersOpen ? 'is-open' : ''}`}
      >
        <div className="lk-library-filters">

          <div className="lk-library-filters__head">
            <button
              type="button"
              className="lk-library-filters__title"
            >
              <SlidersHorizontal size={18} />
              Фильтры
            </button>

            <button
              type="button"
              className="lk-library-filters__close"
              onClick={() => setIsFiltersOpen(false)}
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
              {LIBRARY_FILTERS.age.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lk-library-checkbox ${
                    draftFilters.age.includes(item.id) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleDraftFilter('age', item.id)}
                >
                  <span />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* DURATION */}
          <div className="lk-library-group">
            <div className="lk-library-group__head">
              <h3>Длительность</h3>
            </div>

            <div className="lk-library-checkboxes">
              {LIBRARY_FILTERS.duration.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lk-library-checkbox ${
                    draftFilters.duration.includes(item.id) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleDraftFilter('duration', item.id)}
                >
                  <span />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* EMOTIONS */}
          <div className="lk-library-group">
            <div className="lk-library-group__head">
              <h3>Эмоции</h3>
            </div>

            <div className="lk-library-tags">
              {LIBRARY_FILTERS.emotions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lk-library-tag ${
                    draftFilters.emotions.includes(item.id) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleDraftFilter('emotions', item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* THEMES */}
          <div className="lk-library-group">
            <div className="lk-library-group__head">
              <h3>Темы</h3>
            </div>

            <div className="lk-library-tags">
              {LIBRARY_FILTERS.themes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lk-library-tag ${
                    draftFilters.themes.includes(item.id) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleDraftFilter('themes', item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lk-library-filters__footer">
            <button
              type="button"
              className="lk-library-apply"
              onClick={handleApplyFilters}
            >
              Применить
            </button>

            <button
              type="button"
              className="lk-library-reset"
              onClick={handleResetFilters}
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
            <span className="lk-library-hero__eyebrow">Библиотека</span>
            <h2>{currentMeta.title}</h2>
            <p>{currentMeta.description}</p>
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
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по библиотеке"
            />
          </div>

          <div className="lk-library-modes">
            <button
              type="button"
              className={activeMode === 'all' ? 'is-active' : ''}
              onClick={() => setActiveMode('all')}
            >
              Все
            </button>

            <button
              type="button"
              className={`lk-library-mode-favorites ${activeMode === 'favorites' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('favorites')}
            >
              ♥ Избранное
              {favoritesCount > 0 && (
                <span className="lk-library-mode-badge">{favoritesCount}</span>
              )}
            </button>

            <button
              type="button"
              className={activeMode === 'folk' ? 'is-active' : ''}
              onClick={() => setActiveMode('folk')}
            >
              Русские народные
            </button>

            <button
              type="button"
              className={activeMode === 'new' ? 'is-active' : ''}
              onClick={() => setActiveMode('new')}
            >
              Новое
            </button>
          </div>

          <button
            type="button"
            className="lk-library-mobile-filter"
            onClick={() => setIsFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Фильтры
          </button>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="lk-library-loading">
            Загрузка библиотеки...
          </div>
        )}

        {/* ОШИБКА */}
        {!loading && error && (
          <div className="lk-library-empty">
            {error === 'session_expired' ? (
              <>
                Сессия истекла.{' '}
                <span
                  style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { window.location.hash = '/auth'; }}
                >
                  Войдите снова
                </span>
                , чтобы видеть библиотеку.
              </>
            ) : (
              <>
                Не удалось загрузить контент.{' '}
                <span
                  style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={loadLibrary}
                >
                  Попробовать ещё раз
                </span>
              </>
            )}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && visibleItems.length === 0 && (
          <div className="lk-library-empty">
            {activeMode === 'favorites'
              ? 'Вы ещё не добавили ничего в избранное. Нажмите ♥ на карточке.'
              : activeMode === 'folk'
              ? 'Русские народные сказки не найдены.'
              : 'Ничего не найдено по вашему запросу.'}
          </div>
        )}

        {/* GRID */}
        {!loading && !error && visibleItems.length > 0 && (
          <>
            <div className="lk-library-grid">
              {visibleItems.map((item, index) => {
                const isTrialLocked =
                  isLockedCategory || (isTrialMode && index >= TRIAL_FREE_COUNT);
                const isTariffLocked = !isTrialLocked && (item.accessLvl || 0) > tariffLevel;

                return (
                  <LibraryCard
                    key={item.id}
                    item={item}
                    isTrialLocked={isTrialLocked}
                    isTariffLocked={isTariffLocked}
                  />
                );
              })}
            </div>

            {/* LOAD MORE */}
            {hasMore && (
              <div className="lk-library-more">
                <button
                  type="button"
                  className="lk-library-more__btn"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Ещё
                  <span className="lk-library-more__count">
                    +{Math.min(PAGE_SIZE, allMatchingItems.length - visibleCount)}
                  </span>
                </button>
                <span className="lk-library-more__total">
                  Показано {visibleCount} из {allMatchingItems.length}
                </span>
              </div>
            )}
          </>
        )}

      </div>

    </section>
  );
}
