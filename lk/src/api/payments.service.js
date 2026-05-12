const USE_MOCK = true;

const paymentsMock = [
  {
    id: 1,
    title: 'Хранитель',
    type: 'Подписка',
    date: '12.01.2026',
    amount: '14 400 ₽',
    status: 'paid',
    method: 'VISA •••• 4242',
    receiptUrl: '#',
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
  {
    id: 2,
    title: 'Хранитель',
    type: 'Автосписание',
    date: '12.02.2026',
    amount: '14 400 ₽',
    status: 'pending',
    method: 'VISA •••• 4242',
    receiptUrl: null,
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
  {
    id: 3,
    title: 'Хранитель',
    type: 'Ошибка оплаты',
    date: '12.03.2026',
    amount: '14 400 ₽',
    status: 'failed',
    method: 'VISA •••• 4242',
    receiptUrl: null,
    items: [
      { label: 'Подписка', value: '12 000 ₽' },
      { label: 'НДС', value: '2 400 ₽' },
    ],
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPayments() {
  if (USE_MOCK) {
    await delay(300);
    return paymentsMock;
  }

  const res = await fetch('/api/subscription/payments');

  if (!res.ok) {
    throw new Error('Не удалось загрузить платежи');
  }

  return res.json();
}