import { create } from 'zustand';

import { getFairyTales } from '../api/content.service';

import {
  filterLibraryItems,
} from '../utils/libraryFilters';

export const useLibraryStore = create((set, get) => ({

  items: [],

  filteredItems: [],

  loading: false,

  error: null,

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
        error: null,
      });

      const data = await getFairyTales();

      const normalized = data.map((item) => ({
        id: item.id,

        title: item.title,

        description: item.description,

        category: item.category,

        age: item.age,

        preview: item.preview_url,

        type: 'fairy_tale',

        duration: item.duration || 10,

        emotions: item.emotions || [],

        themes: item.themes || [],
      }));

      set({
        items: normalized,
        filteredItems: normalized,
      });

    } catch (error) {

      console.error(error);

      set({
        error: error.message,
      });

    } finally {

      set({
        loading: false,
      });

    }
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

    const {
      items,
      filters,
    } = get();

    const filteredItems =
      filterLibraryItems(items, filters);

    set({
      filteredItems,
    });
  },

}));