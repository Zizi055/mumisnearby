import { isB2B } from '../../config/edition';

// ─────────────────────────────────────────────────────────────────────
// Переключатель входа: компания / сотрудник / частный клиент.
//
// Зачем он нужен. Входов на бэке физически два: POST /companies/auth/login
// для юрлица и POST /auth/login для человека. Сотрудник и частный клиент
// ходят в один и тот же, разница только в том, кто платит за доступ.
//
// Но человеку перед формой нужно понять, туда ли он попал, а не угадать.
// Поэтому вкладки три: третья не создаёт нового входа, она объясняет
// контекст и убирает регистрацию там, где её быть не должно.
//
// В B2C-редакции переключателя нет вовсе: на rodnyegolosa.ru приходят
// только частные клиенты, и выбор из одного пункта — это шум.
// ─────────────────────────────────────────────────────────────────────

export const ROLES = {
  company: 'company',
  staff: 'staff',
  person: 'person',
};

const ITEMS = [
  { id: ROLES.company, label: 'Компания' },
  { id: ROLES.staff, label: 'Сотрудник' },
  { id: ROLES.person, label: 'Частный клиент' },
];

const STORAGE_KEY = 'lk-login-role';

/** Роль из адреса, из прошлого визита или по умолчанию. */
export function resolveInitialRole(searchParams) {
  if (!isB2B) return ROLES.person;

  const fromUrl = searchParams?.get('role');
  if (fromUrl && ITEMS.some((i) => i.id === fromUrl)) return fromUrl;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ITEMS.some((i) => i.id === saved)) return saved;
  } catch {
    // Приватный режим Safari запрещает доступ к localStorage —
    // переключатель должен работать и без памяти.
  }

  return ROLES.company;
}

export function rememberRole(role) {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    // см. выше
  }
}

export default function RoleSwitch({ value, onChange }) {
  if (!isB2B) return null;

  return (
    <div className="auth__roles" role="tablist" aria-label="Кто вы">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`auth__role ${value === item.id ? 'is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
