import { create } from 'zustand';
import { getSubscription as fetchSubscription } from '../api/subscription.service';
import { tariffs } from '../data/tariffs.data';

// Реальная подписка с бэка (GET /subscription/status), больше не localStorage-заглушка.
// Точная форма ответа backend'а ещё не подтверждена на практике — определяем
// hasPaidPlan по нескольким правдоподобным полям сразу, чтобы не потерять
// платных пользователей из-за расхождения в именовании. Если ни одно поле
// не распозналось — считаем, что платного плана нет (безопасный дефолт).
function hasPaidPlanFrom(sub) {
  if (!sub) return false;

  if (sub.is_active === true || sub.active === true) return true;
  if (sub.status === 'active') return true;
  if (sub.plan_id || sub.planId) return true;
  if (sub.currentPlanId) return true;

  return false;
}

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  loading: false,
  loaded: false,
  error: null,

  async load() {
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      const sub = await fetchSubscription();
      set({ subscription: sub, loading: false, loaded: true });
    } catch (error) {
      // Не залогинен / бэк недоступен — считаем, что платного плана нет,
      // но не даём ошибке сломать рендер остального ЛК.
      console.error('Не удалось загрузить статус подписки:', error);
      set({ subscription: null, loading: false, loaded: true, error: error.message });
    }
  },
}));

// Хелпер для компонентов, которым нужен только булев флаг, без ре-рендера
// на каждое изменение всего объекта подписки.
export function useHasPaidPlan() {
  return useSubscriptionStore((s) => hasPaidPlanFrom(s.subscription));
}

// Числовой уровень тарифа (0-4) — для гейтинга контента по access_lvl.
// 0 = демо/нет подписки, дальше соответствует полю level в tariffs.data.js
// (Сказочник=1, Хранитель=2, Волшебник=3, Собери сам=4).
function tariffLevelFrom(sub) {
  if (!sub) return 0;

  const planId = sub.plan_id ?? sub.planId ?? null;
  if (!planId) return 0;

  const plan = tariffs.find((t) => t.id === planId);
  return plan?.level ?? 0;
}

export function useTariffLevel() {
  return useSubscriptionStore((s) => tariffLevelFrom(s.subscription));
}
