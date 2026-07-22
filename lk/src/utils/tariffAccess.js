import { tariffs } from '../data/tariffs.data';

// access_lvl → человекочитаемое название тарифа, который открывает доступ.
// 0 = демо-доступ (доступно всем без подписки).
export function getRequiredTariffLabel(accessLvl) {
  if (!accessLvl) return 'Демо-доступ';

  const tariff = tariffs.find((t) => t.level === accessLvl);
  return tariff ? tariff.name : `Тариф уровня ${accessLvl}`;
}
