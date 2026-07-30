import { useState, useEffect } from 'react';
import { tariffs as staticTariffs } from '../data/tariffs.data';
import { PLAN_ID_MAP } from '../data/planIdMap';
import { getPlanInfo } from '../api/subscription.service';

// Подтверждённая форма ответа GET /subscription/{plan_id} (снято с Network):
// {
//   id: 3,
//   name: "Сказочник",
//   access_lvl: 1,
//   price_month: 2400,
//   price_year: 16800,
//   voice_clones_limit: 1,
//   audio_format: "mp3",
//   has_time_capsule: false,
//   fairy_tale_generation_limit: 30,
//   lullaby_generation_limit: 10,
//   therapic_generation_limit: 10,
//   poems_generation_limit: 20,
//   family_stories_generation_limit: 30,
//   stories_generation_limit: 50
// }
//
// Бэк — единственный источник правды по ценам и лимитам: именно эти цифры
// уйдут в ЮKassa и по ним будет считаться доступ. Статика в tariffs.data.js
// нужна только для текстов (описание, features, акценты) и как запасной
// вариант, пока запрос не долетел.

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Имена тарифов на бэке приходят с мусором ("Хранитель " с хвостовым
// пробелом, "вошебник" с опечаткой). Пробелы срезаем сами; опечатки в
// названиях лечатся только на стороне бэка, поэтому если локальное имя
// есть — оно приоритетнее для отображения в списке тарифов.
export function cleanPlanName(name) {
  return typeof name === 'string' ? name.trim() : name;
}

function mapLimits(info) {
  return {
    fairyTales: info?.fairy_tale_generation_limit ?? null,
    lullabies: info?.lullaby_generation_limit ?? null,
    therapic: info?.therapic_generation_limit ?? null,
    poems: info?.poems_generation_limit ?? null,
    familyStories: info?.family_stories_generation_limit ?? null,
    stories: info?.stories_generation_limit ?? null,
    voiceClones: info?.voice_clones_limit ?? null,
  };
}

export function useTariffPricing() {
  const [tariffs, setTariffs] = useState(staticTariffs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const merged = await Promise.all(
        staticTariffs.map(async (tariff) => {
          const planId = PLAN_ID_MAP[tariff.id];
          if (planId == null) return tariff; // builder — ID на бэке ещё нет

          try {
            const info = await getPlanInfo(planId);

            const priceYear = toPositiveNumber(info?.price_year);
            const priceMonth = toPositiveNumber(info?.price_month);

            return {
              ...tariff,
              // Цены и уровень доступа — только с бэка, статика запасная.
              priceYear: priceYear ?? tariff.priceYear,
              priceMonth: priceMonth ?? tariff.priceMonth,
              accessLvl: info?.access_lvl ?? tariff.level,
              backendName: cleanPlanName(info?.name),
              audioFormat: info?.audio_format ?? null,
              hasTimeCapsule: info?.has_time_capsule ?? null,
              limits: mapLimits(info),
            };
          } catch (error) {
            // Не роняем страницу тарифов из-за одного упавшего запроса,
            // но и не прячем проблему — иначе «цена не подтянулась»
            // выглядит как будто ничего не произошло.
            console.warn(
              `Не удалось получить данные тарифа ${tariff.id} (plan_id=${planId}):`,
              error.message
            );
            return tariff;
          }
        })
      );

      if (!cancelled) {
        setTariffs(merged);
        setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, []);

  return { tariffs, loading };
}
