import { create } from 'zustand';

import {
  getVoices,
  uploadVoice,
  deleteVoice as deleteVoiceRequest,
  renameVoice,
  uploadVoiceAvatar,
  updateVoiceSettings as updateVoiceSettingsRequest,
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
      set({
        loading: true,
        error: null,
      });

      const newVoice = await uploadVoice(file);

      set((state) => ({
        voices: [
          {
            settings: {
              softness: 70,
              clarity: 82,
              speed: 58,
            },

            ...newVoice,
          },

          ...state.voices,
        ],

        loading: false,
      }));

      return newVoice;
    } catch (error) {
      console.error(error);

      set({
        loading: false,
        error: error.message,
      });

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