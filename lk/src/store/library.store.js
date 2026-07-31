import { create } from 'zustand';

import {
  getLibraryItems,
} from '../api/library.service';

const FAVORITES_KEY = 'lk-library-favorites';

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveFavorites(set) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
}

function injectFavorites(items, favorites) {
  return items.map((item) => ({
    ...item,
    isFavorite: favorites.has(item.id),
  }));
}

// Возраст на бэке — произвольная строка-диапазон: «3-6», «6-11», «4-7»,
// иногда «10+» или просто число. Наши фильтры — фиксированные корзины
// (0-2, 3-6, 7-10, 10+). Сравнивать строки напрямую нельзя: «6-11» не
// равно ни одной корзине, хотя явно попадает и в «3–6», и в «7–10».
// Поэтому разбираем обе стороны в числовой диапазон и проверяем пересечение.
function parseAgeRange(value) {
  if (value == null) return null;

  const str = String(value).trim();
  if (!str) return null;

  const plus = str.match(/^(\d+)\s*\+$/);
  if (plus) return [Number(plus[1]), Infinity];

  const range = str.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (range) return [Number(range[1]), Number(range[2])];

  const single = str.match(/^(\d+)$/);
  if (single) return [Number(single[1]), Number(single[1])];

  return null;
}

function rangesOverlap(a, b) {
  if (!a || !b) return false;
  return a[0] <= b[1] && b[0] <= a[1];
}

function matchesAge(item, selected) {
  if (selected.length === 0) return true;

  const itemRange = parseAgeRange(item.age);
  // Если у элемента возраст не распознан — не прячем его, иначе
  // фильтр молча съедает контент из-за формата данных.
  if (!itemRange) return true;

  return selected.some((bucketId) =>
    rangesOverlap(itemRange, parseAgeRange(bucketId))
  );
}

function matchesDuration(item, selected) {
  if (selected.length === 0) return true;

  const minutes = Number(item.duration);
  // Бэк пока не отдаёт длительность (везде 0) — в этом случае фильтр
  // не применяем, чтобы он не обнулял выдачу.
  if (!Number.isFinite(minutes) || minutes <= 0) return true;

  return selected.some((id) => {
    const bucket = DURATION_BUCKETS[id];
    if (!bucket) return false;
    return minutes >= bucket.min && (bucket.max == null || minutes < bucket.max);
  });
}

const DURATION_BUCKETS = {
  'under-7': { min: 0, max: 7 },
  '7-14': { min: 7, max: 14 },
  '14-21': { min: 14, max: 21 },
  'over-20': { min: 20, max: null },
};

function matchesTags(itemTags, selected) {
  if (selected.length === 0) return true;
  if (!Array.isArray(itemTags) || itemTags.length === 0) return true;
  return selected.some((tag) => itemTags.includes(tag));
}

export const useLibraryStore = create(
  (set, get) => ({

    items: [],

    filteredItems: [],

    loading: false,

    error: null,

    favorites: loadFavorites(),

    filters: {
      search: '',
      type: 'fairy_tale',

      age: [],
      duration: [],
      emotions: [],
      themes: [],
    },

    async loadLibrary() {

      try {

        set({ loading: true, error: null });

        const data = await getLibraryItems(get().filters.type);

        const favorites = get().favorites;
        const withFavs = injectFavorites(data, favorites);

        set({ items: withFavs, filteredItems: withFavs });

        // При смене категории фильтры остаются выбранными — применяем их
        // к новой выдаче, иначе после переключения вкладки список
        // показывался бы нефильтрованным.
        get().applyFilters();

      } catch (error) {

        console.error(error);

        // 401 обрабатывается в client.js (редирект на /auth)
        // Здесь показываем понятную ошибку
        const is401 = error.message?.includes('401') || error.message?.includes('истекла');
        set({
          error: is401
            ? 'session_expired'
            : 'load_failed',
        });

      } finally {

        set({ loading: false });

      }
    },

    toggleFavorite(id) {
      const favorites = new Set(get().favorites);

      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }

      saveFavorites(favorites);

      const items = injectFavorites(get().items, favorites);
      const filteredItems = injectFavorites(get().filteredItems, favorites);

      set({ favorites, items, filteredItems });
    },

    setSearch(value) {

      set((state) => ({
        filters: {
          ...state.filters,
          search: value,
        },
      }));

      get().applyFilters();
    },

    setType(value) {

      set((state) => ({
        filters: {
          ...state.filters,
          type: value,
        },
      }));

      get().loadLibrary();
    },

    toggleFilter(group, value) {

      set((state) => {

        const current =
          state.filters[group];

        const exists =
          current.includes(value);

        return {
          filters: {
            ...state.filters,

            [group]: exists
              ? current.filter(
                  (item) =>
                    item !== value
                )
              : [...current, value],
          },
        };
      });
    },

    resetFilters() {

      set((state) => ({
        filters: {
          ...state.filters,

          age: [],
          duration: [],
          emotions: [],
          themes: [],
        },
      }));
    },

    applyFilters() {

      const {
        items,
        filters,
      } = get();

      let filtered = [...items];

      if (filters.search.trim()) {

        const query =
          filters.search.toLowerCase();

        filtered = filtered.filter(
          (item) =>
            item.title
              .toLowerCase()
              .includes(query)
        );
      }

      // Раньше здесь стоял только поиск: возраст, длительность, эмоции и
      // темы собирались в стор, но никогда не применялись — кнопка
      // «Применить» визуально срабатывала и не меняла выдачу.
      filtered = filtered.filter(
        (item) =>
          matchesAge(item, filters.age) &&
          matchesDuration(item, filters.duration) &&
          matchesTags(item.emotions, filters.emotions) &&
          matchesTags(item.themes, filters.themes)
      );

      set({
        filteredItems: filtered,
      });
    },
  })
);
