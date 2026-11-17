import { create } from 'zustand';
import { getGenerations } from '../api/generations.service';

// ─────────────────────────────────────────────────────────────────────
// Какие озвучки уже готовы.
//
// Список нужен, чтобы на странице сказки показать «Озвучить ещё раз»
// и ссылку в «Мои сказки». Повтор тем же голосом не запрещён: бэкенд
// каждый раз создаёт новую запись и списывает квоту. Ключ —
// content_type + content_id + voice_id, потому что мама и папа
// читают одну сказку отдельно.
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
