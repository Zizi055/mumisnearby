import { create } from 'zustand';
import { getGenerations } from '../api/generations.service';

// ─────────────────────────────────────────────────────────────────────
// Что пользователь уже озвучил.
//
// Нужно, чтобы не тратить токены ElevenLabs на повторную генерацию того
// же самого. Раньше человек мог заходить в библиотеку и нажимать
// «Создать аудио» на одной и той же сказке сколько угодно раз — каждый
// клик уходил в оплачиваемый синтез, а результат был идентичным.
//
// Ключ — content_type + content_id + voice_id. Именно с голосом, а не
// без него: весь смысл сервиса в том, что одну сказку читают и мама, и
// папа. Блокировать «Зимнюю сказку» навсегда после первой озвучки
// маминым голосом было бы неправильно — папин голос это другой продукт
// для ребёнка. А вот второй раз тем же голосом смысла нет.
// ─────────────────────────────────────────────────────────────────────

function key(contentType, contentId, voiceId) {
  return `${contentType}:${contentId}:${voiceId}`;
}

export const useGenerationsStore = create((set, get) => ({
  // Map<ключ, generationId> по готовым озвучкам
  ready: {},

  loaded: false,
  loading: false,

  load: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;

    set({ loading: true });

    try {
      const list = await getGenerations();

      const ready = {};
      for (const g of list ?? []) {
        if (g.status !== 'ready' || g.voice_id == null) continue;
        ready[key(g.content_type, g.content_id, g.voice_id)] = g.id;
      }

      set({ ready, loaded: true, loading: false });
    } catch (e) {
      // Не смогли получить список — не мешаем генерировать. Лучше
      // изредка потратить лишний токен, чем заблокировать работу.
      console.warn('Не удалось загрузить список озвучек:', e.message);
      set({ loading: false });
    }
  },

  /** id готовой озвучки этого контента этим голосом, иначе null */
  findReady: (contentType, contentId, voiceId) => {
    if (voiceId == null) return null;
    return get().ready[key(contentType, contentId, voiceId)] ?? null;
  },

  /** Запомнить свежесозданную озвучку, не перезапрашивая весь список. */
  remember: (contentType, contentId, voiceId, generationId) => {
    if (voiceId == null) return;
    set((state) => ({
      ready: { ...state.ready, [key(contentType, contentId, voiceId)]: generationId },
    }));
  },
}));
