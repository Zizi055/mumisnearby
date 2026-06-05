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

export const useLibraryStore = create(
  (set, get) => ({

    items: [],

    filteredItems: [],

    loading: false,

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

        set({
          loading: true,
        });

        const data =
          await getLibraryItems(
            get().filters.type
          );

        const favorites = get().favorites;
        const withFavs = injectFavorites(data, favorites);

        set({
          items: withFavs,
          filteredItems: withFavs,
        });

      } catch (error) {

        console.error(error);

      } finally {

        set({
          loading: false,
        });

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

      set({
        filteredItems: filtered,
      });
    },
  })
);
