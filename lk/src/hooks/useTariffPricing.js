import { useState, useEffect } from 'react';
import { tariffs as staticTariffs } from '../data/tariffs.data';
import { PLAN_ID_MAP } from '../data/planIdMap';
import { getPlanInfo } from '../api/subscription.service';

function pickPositiveNumber(...values) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// Подтягивает актуальные цены с бэка (GET /subscription/{plan_id}) и
// накладывает их поверх статичных данных из tariffs.data.js — чтобы
// цена на экране совпадала с тем, что бэк реально спишет через ЮKassa
// (см. баг: Хранитель/месяц показывал 8400₽, а списывалось 4000₽).
//
// В спеке у /subscription/{plan_id} response schema: {} — форма ответа
// не описана. Проверяем несколько вероятных имён полей защитно; если
// бэк отдаёт что-то другое или запрос падает — молча остаёмся на
// статичной цене из tariffs.data.js, ничего не ломаем и не показываем
// NaN/undefined. Как только увидим реальный ответ от бэка — здесь нужно
// будет поправить конкретные имена полей.
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

            const priceYear = pickPositiveNumber(
              info?.price_year,
              info?.priceYear,
              info?.year_price,
              info?.price?.year,
              info?.prices?.year
            );

            const priceMonth = pickPositiveNumber(
              info?.price_month,
              info?.priceMonth,
              info?.month_price,
              info?.price?.month,
              info?.prices?.month
            );

            if (priceYear == null && priceMonth == null) return tariff;

            return {
              ...tariff,
              priceYear: priceYear ?? tariff.priceYear,
              priceMonth: priceMonth ?? tariff.priceMonth,
            };
          } catch {
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
