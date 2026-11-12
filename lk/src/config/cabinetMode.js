import { isB2B } from './edition';

// На корпоративном сайте три входа: компания, сотрудник, частный клиент.
// Сборка одна и та же (цвета «Родного голоса»). Отличает их выбранная
// вкладка: сотрудник не видит тарифы и оплату, частный клиент получает
// тот же кабинет, что на «Родных голосах», включая оплату.
const KEY = 'lk-cabinet-mode';

export function getCabinetMode() {
  if (!isB2B) return 'person';

  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'person' || saved === 'staff' || saved === 'company') return saved;
  } catch {
    // Приватный режим Safari не отдаёт localStorage — ведём себя как сотрудник.
  }

  return 'staff';
}

export function setCabinetMode(mode) {
  if (!isB2B) return;
  if (mode !== 'person' && mode !== 'staff' && mode !== 'company') return;

  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // см. выше
  }
}

// Прячем тарифы и оплату только у сотрудника и кабинета компании.
// У частного клиента на этом же домене оплата есть.
export function isStaffCabinet() {
  return isB2B && getCabinetMode() !== 'person';
}
