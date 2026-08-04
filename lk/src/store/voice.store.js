import { create } from 'zustand';

import {
  getVoices,
  uploadVoice,
  deleteVoice as deleteVoiceRequest,
  renameVoice,
  uploadVoiceAvatar,
  updateVoiceSettings as updateVoiceSettingsRequest,
  waitForVoiceReady,
} from '../api/voice.service';

export const useVoiceStore = create((set, get) => ({


  voices: [],

  loading: false,

  error: null,

  initialized: false,



  loadVoices: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const data = await getVoices();

      set({
        voices: data || [],
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error(error);

      set({
        loading: false,
        error: error.message,
      });
    }
  },



  createVoice: async (file) => {
    try {
      set({ loading: true, error: null });

      const before = get().voices || [];
      const newVoice = await uploadVoice(file);

      // Перезагружаем список с сервера — чтобы получить актуальные данные
      const fresh = (await getVoices()) || [];
      set({ voices: fresh, loading: false });

      const byId = newVoice?.id != null
        ? fresh.find((v) => v.id === newVoice.id)
        : null;
      if (byId) return byId;

      // Подстраховка: /voices/add не отдал идентификатор. Берём голос,
      // которого не было в списке до загрузки, иначе — самый свежий по id.
      const knownIds = new Set(before.map((v) => v.id));
      const appeared = fresh.filter((v) => !knownIds.has(v.id));

      const guessed =
        appeared[appeared.length - 1] ||
        [...fresh].sort((a, b) => Number(b.id) - Number(a.id))[0];

      if (guessed) {
        console.warn(
          'POST /voices/add не вернул id — голос определён по списку:',
          guessed.id
        );
        return guessed;
      }

      return newVoice;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },



  updateVoice: (id, data) =>
    set((state) => ({
      voices: state.voices.map((voice) =>
        voice.id === id
          ? {
              ...voice,
              ...data,
            }
          : voice
      ),
    })),



  // Реальный поллинг статуса обучения через GET /voices/{id} — вместо
  // мгновенной локальной фейковой анимации. Обновляет голос в сторе
  // на каждый тик (в т.ч. audio/preview_url, как только бэк его отдаст).
  pollVoiceUntilReady: async (id, onUpdate) => {
    try {
      const finalVoice = await waitForVoiceReady(id, (voice) => {
        set((state) => ({
          voices: state.voices.map((v) =>
            v.id === id ? { ...v, ...voice } : v
          ),
        }));
        onUpdate?.(voice);
      });
      return finalVoice;
    } catch (error) {
      console.error(error);
      set((state) => ({
        voices: state.voices.map((v) =>
          v.id === id ? { ...v, status: 'error' } : v
        ),
        error: error.message,
      }));
      throw error;
    }
  },



  updateVoiceSettings: async (
    id,
    settings
  ) => {
    try {
      await updateVoiceSettingsRequest(
        id,
        settings
      );

      set((state) => ({
        voices: state.voices.map((voice) =>
          voice.id === id
            ? {
                ...voice,

                settings: {
                  ...voice.settings,
                  ...settings,
                },
              }
            : voice
        ),
      }));
    } catch (error) {
      console.error(error);

      set({
        error: error.message,
      });
    }
  },



  renameVoiceById: async (
    id,
    name
  ) => {
    try {
      await renameVoice(id, name);

      set((state) => ({
        voices: state.voices.map((voice) =>
          voice.id === id
            ? {
                ...voice,
                name,
              }
            : voice
        ),
      }));
    } catch (error) {
      console.error(error);

      set({
        error: error.message,
      });
    }
  },



  uploadAvatar: async (
    id,
    file
  ) => {
    try {
      const updatedVoice =
        await uploadVoiceAvatar(id, file);

      set((state) => ({
        voices: state.voices.map((voice) =>
          voice.id === id
            ? {
                ...voice,

                avatar:
                  updatedVoice.avatar ||
                  updatedVoice.avatar_url,
              }
            : voice
        ),
      }));
    } catch (error) {
      console.error(error);

      set({
        error: error.message,
      });
    }
  },



  removeVoice: async (id) => {
    try {
      await deleteVoiceRequest(id);

      set((state) => ({
        voices: state.voices.filter(
          (voice) => voice.id !== id
        ),
      }));
    } catch (error) {
      console.error(error);

      set({
        error: error.message,
      });
    }
  },
}));