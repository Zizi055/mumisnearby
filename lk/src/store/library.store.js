import { create } from 'zustand';

import {
  getLibraryItems,
} from '../api/library.service';

export const useLibraryStore = create(
  (set, get) => ({

    items: [],

    filteredItems: [],

    loading: false,

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

        set({
          items: data,
          filteredItems: data,
        });

      } catch (error) {

        console.error(error);

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