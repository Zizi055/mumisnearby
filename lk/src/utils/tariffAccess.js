import { tariffs } from '../data/tariffs.data';
import { getTariffSlug } from '../data/planIdMap';

// Названия тарифов на бэке грязные: "Хранитель " с хвостовым пробелом,
// "вошебник" вместо "Волшебник". Пока их не почистят в базе, показываем
// наше выверенное название, а к сырому имени с бэка откатываемся только
// если тариф в локальном справочнике не нашёлся (например, бэк завёл
// новый план, о котором фронт ещё не знает).
export function resolvePlanName(planId, backendName) {
  const slug = getTariffSlug(planId);
  const local = tariffs.find((t) => t.id === slug);

  if (local?.name) return local.name;
  if (typeof backendName === 'string' && backendName.trim()) {
    return backendName.trim();
  }
  return null;
}

// access_lvl → человекочитаемое название тарифа, который открывает доступ.
// 0 = демо-доступ (доступно всем без подписки).
//
// accessLvl приходит с бэка вместе с контентом (FairyTaleListResponse и
// прочие: access_lvl: integer|null) и сравнивается с access_lvl тарифа
// пользователя (plan.access_lvl из GET /subscription/status).
// Точного совпадения по level может не быть, если бэк заведёт уровень,
// которого нет в нашей локальной шкале — тогда берём ближайший тариф,
// который этот уровень покрывает, вместо уродливого «Тариф уровня 7».
export function getRequiredTariffLabel(accessLvl) {
  if (!accessLvl) return 'Демо-доступ';

  const exact = tariffs.find((t) => t.level === accessLvl);
  if (exact) return exact.name;

  const covering = [...tariffs]
    .filter((t) => t.level >= accessLvl)
    .sort((a, b) => a.level - b.level)[0];

  return covering ? covering.name : 'Расширенный тариф';
}
