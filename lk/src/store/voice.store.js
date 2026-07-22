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

      const newVoice = await uploadVoice(file);

      // Перезагружаем список с сервера — чтобы получить актуальные данные
      const fresh = await getVoices();
      set({ voices: fresh || [], loading: false });

      // Возвращаем голос из свежего списка или fallback на то что вернул API
      return fresh?.find((v) => v.id === newVoice?.id) || newVoice;
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