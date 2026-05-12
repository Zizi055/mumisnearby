import { create } from 'zustand';

export const useVoiceStore = create((set) => ({
  voices: [
    {
      id: 1,
      name: 'Мамин голос',
      description: 'Голосовая модель готова',
      status: 'ready',
      createdAt: '04.05.2026',
      audio: `${import.meta.env.BASE_URL}library/audio/mom.mp3`,
      avatar: '',

      settings: {
        softness: 70,
        clarity: 82,
        speed: 58,
      },
    },

    {
      id: 2,
      name: 'Папин голос',
      description: 'Голосовая модель готова',
      status: 'ready',
      createdAt: '04.05.2026',
      audio: `${import.meta.env.BASE_URL}library/audio/dad.mp3`,
      avatar: '',

      settings: {
        softness: 74,
        clarity: 76,
        speed: 61,
      },
    },
  ],

  addVoice: (voice) =>
    set((state) => ({
      voices: [
        {
          ...voice,

          settings: {
            softness: 70,
            clarity: 82,
            speed: 58,
          },
        },

        ...state.voices,
      ],
    })),

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

  updateVoiceSettings: (id, settings) =>
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
    })),

  removeVoice: (id) =>
    set((state) => ({
      voices: state.voices.filter((voice) => voice.id !== id),
    })),
}));