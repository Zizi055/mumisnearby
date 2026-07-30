import { create } from 'zustand';
import { getSubscription as fetchSubscription } from '../api/subscription.service';
import { tariffs } from '../data/tariffs.data';

// Реальная форма ответа GET /subscription/status (подтверждено по Network):
// { plan: { id, name, access_lvl }, billing_period, status, auto_renew,
//   expires_at, limits: {...} }
// Раньше здесь искали плоские поля sub.plan_id/sub.planId/sub.is_active —
// их нет, из-за этого платный тариф нигде не подхватывался.
function hasPaidPlanFrom(sub) {
  if (!sub) return false;

  if (sub.is_active === true || sub.active === true) return true;
  if (sub.status === 'active') return true;
  if (sub.plan?.id != null) return true;
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

// Числовой уровень тарифа — для гейтинга контента по access_lvl.
// 0 = демо/нет подписки. Контент (сказки/колыбельные/терапия/...) отдаёт
// свой access_lvl напрямую с бэка (см. api/library.service.js), и бэк же
// кладёт access_lvl текущего плана в sub.plan.access_lvl — сравниваем их
// напрямую, без похода через локальную шкалу level в tariffs.data.js.
// Локальный tariffs.data.js оставляем как fallback на случай, если бэк
// когда-нибудь перестанет отдавать access_lvl и придётся выводить уровень
// из id плана.
function tariffLevelFrom(sub) {
  if (!sub) return 0;

  if (sub.plan?.access_lvl != null) return sub.plan.access_lvl;

  const planId = sub.plan?.id ?? sub.plan_id ?? sub.planId ?? null;
  if (!planId) return 0;

  const plan = tariffs.find((t) => t.id === planId);
  return plan?.level ?? 0;
}

export function useTariffLevel() {
  return useSubscriptionStore((s) => tariffLevelFrom(s.subscription));
}
