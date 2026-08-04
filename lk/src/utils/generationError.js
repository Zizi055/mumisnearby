// ─────────────────────────────────────────────────────────────────────
// Человеческий текст вместо сырого error_message с бэка.
//
// Бэк кладёт в GenerationResponse.error_message ответ провайдера как есть,
// например:
//   Ошибка ElevenLabs TTS: {"detail":{"type":"validation_error",
//   "code":"text_too_long","message":"Request text (11044) exceeds the
//   maximum text length of 10000 characters...","request_id":"5539d31..."}}
//
// Показывать это пользователю нельзя: непонятно, по-английски, с внутренними
// идентификаторами и названием подрядчика. Здесь распознаём известные случаи
// по коду/ключевым словам и отдаём короткую фразу на русском. Всё, что не
// распознали, схлопывается в одну общую формулировку — лучше скупо, чем
// вываливать JSON.
// ─────────────────────────────────────────────────────────────────────

const GENERIC = 'Не удалось озвучить. Попробуйте ещё раз или напишите в поддержку.';

// Порядок важен: сначала более узкие правила.
const RULES = [
  {
    match: /text_too_long|max_character_limit_exceeded|maximum text length/i,
    text: 'Текст слишком длинный для озвучки. Попробуйте вариант покороче.',
  },
  {
    match: /quota|credit|insufficient|limit_exceeded|too_many_requests|rate.?limit/i,
    text: 'Закончился доступный объём озвучки. Проверьте лимиты тарифа.',
  },
  {
    match: /voice_not_found|invalid.?voice|voice.?id/i,
    text: 'Проблема с выбранным голосом. Выберите другой голос и повторите.',
  },
  {
    match: /unauthorized|forbidden|invalid.?api.?key|401|403/i,
    text: 'Сервис озвучки отклонил запрос. Мы уже разбираемся.',
  },
  {
    match: /timeout|timed out|504|502|503|unavailable/i,
    text: 'Сервис озвучки не ответил вовремя. Попробуйте ещё раз.',
  },
];

export function describeGenerationError(raw) {
  if (!raw || typeof raw !== 'string') return GENERIC;

  const rule = RULES.find((r) => r.match.test(raw));
  return rule ? rule.text : GENERIC;
}
