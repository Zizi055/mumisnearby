import { create } from 'zustand';

import {
  LIBRARY_ITEMS,
} from '../data/libraryCatalog.data';

import {
  filterLibraryItems,
} from '../utils/libraryFilters';

export const useLibraryStore = create((set, get) => ({
  items: LIBRARY_ITEMS,

  filters: {
    search: '',
    type: 'fairy_tale',

    age: [],
    duration: [],
    emotions: [],
    themes: [],
  },

  filteredItems: LIBRARY_ITEMS,

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

    get().applyFilters();
  },

  toggleFilter(group, value) {
    set((state) => {
      const current = state.filters[group];

      const exists = current.includes(value);

      return {
        filters: {
          ...state.filters,
          [group]: exists
            ? current.filter((item) => item !== value)
            : [...current, value],
        },
      };
    });

    get().applyFilters();
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

    get().applyFilters();
  },

  applyFilters() {
    const { items, filters } = get();

    const filteredItems =
      filterLibraryItems(items, filters);

    set({
      filteredItems,
    });
  },
}));