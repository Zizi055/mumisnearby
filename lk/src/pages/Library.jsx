import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
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

const libraryData = [
  {
    id: 1,
    category: 'stories',
    type: 'Сказка',
    title: 'Совушка и малыш',
    duration: '7 мин.',
    durationGroup: '7-14',
    age: '3-6 лет',
    ageGroup: '3-6',
    tags: ['Спокойствие', 'Сон', 'Семья', 'Дружба'],
    emotions: ['Спокойствие', 'Сон'],
    themes: ['Семья', 'Дружба'],
    image: '/library/owl.jpg',
    isFavorite: true,
    isNew: false,
  },
  {
    id: 2,
    category: 'stories',
    type: 'Сказка',
    title: 'В мире сказки',
    duration: '12 мин.',
    durationGroup: '7-14',
    age: '0-2 года',
    ageGroup: '0-2',
    tags: ['Тепло', 'Уют', 'Смелость', 'Животные'],
    emotions: ['Тепло', 'Уют', 'Смелость'],
    themes: ['Животные'],
    image: '/library/stars.jpg',
    isFavorite: false,
    isNew: true,
  },
  {
    id: 3,
    category: 'stories',
    type: 'Сказка',
    title: 'Совушка и малыш',
    duration: '7 мин.',
    durationGroup: '7-14',
    age: '3-6 лет',
    ageGroup: '3-6',
    tags: ['Спокойствие', 'Сон', 'Семья', 'Дружба'],
    emotions: ['Спокойствие', 'Сон'],
    themes: ['Семья', 'Дружба'],
    image: '/library/foxes.jpg',
    isFavorite: false,
    isNew: false,
  },
  {
    id: 4,
    category: 'stories',
    type: 'Сказка',
    title: 'Сказка про любовь',
    duration: '8 мин.',
    durationGroup: '7-14',
    age: '3-6 лет',
    ageGroup: '3-6',
    tags: ['Любовь', 'Семья', 'Тепло'],
    emotions: ['Любовь', 'Тепло'],
    themes: ['Семья'],
    image: '/library/family.jpg',
    isFavorite: true,
    isNew: false,
  },
  {
    id: 5,
    category: 'lullabies',
    type: 'Колыбельная',
    title: 'Спокойной ночи, малыш',
    duration: '7 мин.',
    durationGroup: '7-14',
    age: '0-2 года',
    ageGroup: '0-2',
    tags: ['Сон', 'Тепло', 'Уют'],
    emotions: ['Сон', 'Тепло', 'Уют'],
    themes: [],
    image: '/library/lullaby-moon.jpg',
    isFavorite: true,
    isNew: false,
  },
  {
    id: 6,
    category: 'lullabies',
    type: 'Колыбельная',
    title: 'Тихий вечер',
    duration: '9 мин.',
    durationGroup: '7-14',
    age: '0-3 года',
    ageGroup: '0-2',
    tags: ['Сон', 'Тишина', 'Спокойствие'],
    emotions: ['Сон', 'Спокойствие'],
    themes: [],
    image: '/library/lullaby-sleep.jpg',
    isFavorite: false,
    isNew: true,
  },
  {
    id: 7,
    category: 'therapy',
    type: 'Терапия',
    title: 'Как справиться со страхом',
    duration: '10 мин.',
    durationGroup: '7-14',
    age: '4-7 лет',
    ageGroup: '7-10',
    tags: ['Смелость', 'Безопасность', 'Поддержка'],
    emotions: ['Смелость'],
    themes: [],
    image: '/library/therapy-fear.jpg',
    isFavorite: false,
    isNew: true,
  },
  {
    id: 8,
    category: 'therapy',
    type: 'Терапия',
    title: 'Учимся успокаиваться',
    duration: '8 мин.',
    durationGroup: '7-14',
    age: '4-7 лет',
    ageGroup: '3-6',
    tags: ['Спокойствие', 'Дыхание', 'Саморегуляция'],
    emotions: ['Спокойствие'],
    themes: [],
    image: '/library/therapy-calm.jpg',
    isFavorite: true,
    isNew: false,
  },
  {
    id: 9,
    category: 'family',
    type: 'Семейная история',
    title: 'Вечер с мамой',
    duration: '7 мин.',
    durationGroup: '7-14',
    age: '3-7 лет',
    ageGroup: '3-6',
    tags: ['Семья', 'Тепло', 'Любовь'],
    emotions: ['Тепло', 'Любовь'],
    themes: ['Семья'],
    image: '/library/family-evening.jpg',
    isFavorite: true,
    isNew: false,
  },
  {
    id: 10,
    category: 'family',
    type: 'Семейная история',
    title: 'Наш уютный дом',
    duration: '6 мин.',
    durationGroup: '0-7',
    age: '3-6 лет',
    ageGroup: '3-6',
    tags: ['Семья', 'Дом', 'Уют'],
    emotions: ['Уют'],
    themes: ['Семья'],
    image: '/library/family-home.jpg',
    isFavorite: false,
    isNew: true,
  },
];

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
      setAppliedFilters({
        ageGroups: parsed.ageGroups || [],
        durationGroups: parsed.durationGroups || [],
        emotions: parsed.emotions || [],
        themes: parsed.themes || [],
      });
      setDraftFilters({
        ageGroups: parsed.ageGroups || [],
        durationGroups: parsed.durationGroups || [],
        emotions: parsed.emotions || [],
        themes: parsed.themes || [],
      });
    } catch (error) {
      console.error('Не удалось прочитать фильтры из localStorage', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(appliedFilters));
  }, [appliedFilters]);

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

  const toggleDraftAge = (value) => {
    setDraftFilters((prev) => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(value)
        ? prev.ageGroups.filter((item) => item !== value)
        : [...prev.ageGroups, value],
    }));
  };

  const toggleDraftDuration = (value) => {
    setDraftFilters((prev) => ({
      ...prev,
      durationGroups: prev.durationGroups.includes(value)
        ? prev.durationGroups.filter((item) => item !== value)
        : [...prev.durationGroups, value],
    }));
  };

  const toggleDraftEmotion = (value) => {
    setDraftFilters((prev) => ({
      ...prev,
      emotions: prev.emotions.includes(value)
        ? prev.emotions.filter((item) => item !== value)
        : [...prev.emotions, value],
    }));
  };

  const toggleDraftTheme = (value) => {
    setDraftFilters((prev) => ({
      ...prev,
      themes: prev.themes.includes(value)
        ? prev.themes.filter((item) => item !== value)
        : [...prev.themes, value],
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
    <Layout
      libraryMenu={{
        activeCategory,
        onChangeCategory: (category) => {
          setActiveCategory(category);
          setActiveMode('all');
          setSearchValue('');
        },
      }}
    >
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

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes('0-2')}
                    onChange={() => toggleDraftAge('0-2')}
                  />
                  0–2 года
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes('3-6')}
                    onChange={() => toggleDraftAge('3-6')}
                  />
                  3–6 лет
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes('7-10')}
                    onChange={() => toggleDraftAge('7-10')}
                  />
                  7–10 лет
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.ageGroups.includes('10+')}
                    onChange={() => toggleDraftAge('10+')}
                  />
                  10+
                </label>
              </div>

              <div className="lk-filters-panel__group">
                <h4 className="lk-filters-panel__group-title">Длительность</h4>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.durationGroups.includes('0-7')}
                    onChange={() => toggleDraftDuration('0-7')}
                  />
                  до 7 минут
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.durationGroups.includes('7-14')}
                    onChange={() => toggleDraftDuration('7-14')}
                  />
                  7–14 минут
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.durationGroups.includes('14-21')}
                    onChange={() => toggleDraftDuration('14-21')}
                  />
                  14–21 минут
                </label>

                <label className="lk-filters-panel__check">
                  <input
                    type="checkbox"
                    checked={draftFilters.durationGroups.includes('20+')}
                    onChange={() => toggleDraftDuration('20+')}
                  />
                  от 20 минут
                </label>
              </div>

              <div className="lk-filters-panel__group">
                <h4 className="lk-filters-panel__group-title">Эмоции</h4>

                <div className="lk-filters-panel__chips">
                  {['Счастье', 'Сон', 'Уют', 'Спокойствие', 'Тепло', 'Радость', 'Смелость', 'Любовь'].map((emotion) => (
                    <button
                      key={emotion}
                      type="button"
                      className={`lk-filters-panel__chip ${draftFilters.emotions.includes(emotion) ? 'is-active' : ''}`}
                      onClick={() => toggleDraftEmotion(emotion)}
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
                      onClick={() => toggleDraftTheme(theme)}
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
    </Layout>
  );
}