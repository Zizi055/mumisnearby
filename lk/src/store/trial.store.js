import { create } from 'zustand';

const STORAGE_KEY = 'lk_trial';
const TRIAL_DAYS = 3;
const TRIAL_STORIES_LIMIT = 5;
const TRIAL_VOICES_LIMIT = 1;

function readTrial() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function writeTrial(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function initTrial() {
  const existing = readTrial();
  if (existing) return existing;
  const trial = {
    startedAt: Date.now(),
    storiesGenerated: 0,
  };
  writeTrial(trial);
  return trial;
}

export function getTrialInfo() {
  const trial = readTrial();
  if (!trial) return null;

  const elapsed = Date.now() - trial.startedAt;
  const msInDay = 1000 * 60 * 60 * 24;
  const daysElapsed = elapsed / msInDay;
  const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed);
  const isExpired = daysLeft <= 0;
  const storiesLeft = Math.max(0, TRIAL_STORIES_LIMIT - (trial.storiesGenerated || 0));
  const storiesLimitReached = storiesLeft <= 0;

  return {
    startedAt: trial.startedAt,
    storiesGenerated: trial.storiesGenerated || 0,
    storiesLeft,
    storiesLimitReached,
    daysLeft: Math.ceil(daysLeft),
    hoursLeft: Math.ceil(daysLeft * 24),
    isExpired,
    isActive: !isExpired && !storiesLimitReached,
    canGenerate: !isExpired && !storiesLimitReached,
  };
}

export function incrementTrialStories() {
  const trial = readTrial();
  if (!trial) return;
  const next = { ...trial, storiesGenerated: (trial.storiesGenerated || 0) + 1 };
  writeTrial(next);
  window.dispatchEvent(new Event('trial:updated'));
  return next;
}

export function clearTrial() {
  localStorage.removeItem(STORAGE_KEY);
}

export const TRIAL_VOICES_LIMIT_EXPORT = TRIAL_VOICES_LIMIT;

// Zustand store для реактивного обновления
export const useTrialStore = create((set) => ({
  trial: getTrialInfo(),

  refresh() {
    set({ trial: getTrialInfo() });
  },

  incrementStory() {
    incrementTrialStories();
    set({ trial: getTrialInfo() });
  },

  init() {
    initTrial();
    set({ trial: getTrialInfo() });
  },
}));

// Слушаем внешние изменения
if (typeof window !== 'undefined') {
  window.addEventListener('trial:updated', () => {
    useTrialStore.getState().refresh();
  });
}
