import {
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import {
  LIBRARY_FILTERS,
} from '../../data/libraryCatalog.data';

import {
  useLibraryStore,
} from '../../store/library.store';

export default function LibraryFilters({
  isOpen,
  onClose,
}) {
  const {
    filters,
    setSearch,
    toggleFilter,
    resetFilters,
  } = useLibraryStore();

  return (
    <aside
      className={`lk-library-filters ${
        isOpen ? 'is-open' : ''
      }`}
    >
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
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* search */}
      <div className="lk-library-search">
        <Search size={16} />

        <input
          type="text"
          placeholder="Поиск сказок"
          value={filters.search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* age */}
      <FilterGroup title="Возраст">
        {LIBRARY_FILTERS.age.map((item) => (
          <CheckboxItem
            key={item.id}
            label={item.label}
            checked={filters.age.includes(item.id)}
            onClick={() =>
              toggleFilter('age', item.id)
            }
          />
        ))}
      </FilterGroup>

      {/* duration */}
      <FilterGroup title="Длительность">
        {LIBRARY_FILTERS.duration.map((item) => (
          <CheckboxItem
            key={item.id}
            label={item.label}
            checked={filters.duration.includes(
              item.id
            )}
            onClick={() =>
              toggleFilter(
                'duration',
                item.id
              )
            }
          />
        ))}
      </FilterGroup>

      {/* emotions */}
      <FilterGroup title="Эмоции">
        <div className="lk-library-tags">
          {LIBRARY_FILTERS.emotions.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={`lk-library-tag ${
                  filters.emotions.includes(
                    item.id
                  )
                    ? 'is-active'
                    : ''
                }`}
                onClick={() =>
                  toggleFilter(
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
      </FilterGroup>

      {/* themes */}
      <FilterGroup title="Тема">
        <div className="lk-library-tags">
          {LIBRARY_FILTERS.themes.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={`lk-library-tag ${
                  filters.themes.includes(
                    item.id
                  )
                    ? 'is-active'
                    : ''
                }`}
                onClick={() =>
                  toggleFilter(
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
      </FilterGroup>

      <div className="lk-library-filters__footer">
        <button
          type="button"
          className="lk-library-apply"
          onClick={onClose}
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
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}) {
  return (
    <div className="lk-library-group">
      <div className="lk-library-group__head">
        <h3>{title}</h3>
      </div>

      {children}
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`lk-library-checkbox ${
        checked ? 'is-active' : ''
      }`}
      onClick={onClick}
    >
      <span />

      {label}
    </button>
  );
}