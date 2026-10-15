import { Building2, Lock } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Плашка «доступ оплачен компанией» в кабинете сотрудника.
//
// Зачем. Сотрудник открывает раздел тарифов и видит карточки с ценами,
// но купить ничего не может: бэк отвечает 403 «Тариф сотрудника
// оплачивает компания». Без объяснения это читается как поломка —
// человек жмёт кнопку, получает ошибку и идёт в поддержку.
//
// Плашка закрывает три вопроса сразу: кто платит, до какого числа
// действует доступ и к кому идти с вопросами. Отдельно сказано, что
// работодателю не видно содержимое записей: это первое, о чём
// спрашивают, когда узнают, что тариф оплачен компанией.
// ─────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CompanyPaidNotice({ planName, expiresAt }) {
  const until = formatDate(expiresAt);

  return (
    <div className="lk-company-paid">
      <span className="lk-company-paid__icon">
        <Building2 size={18} />
      </span>

      <div className="lk-company-paid__body">
        <p className="lk-company-paid__title">
          Доступ оплачен вашей компанией
        </p>

        <p className="lk-company-paid__text">
          {planName ? <>Тариф «{planName}»</> : 'Корпоративный доступ'}
          {until ? <> действует до {until}.</> : '.'} Сменить тариф или продлить
          доступ может администратор компании — вопросы к нему.
        </p>

        <p className="lk-company-paid__privacy">
          <Lock size={13} />
          Работодателю видно, что вы пользуетесь сервисом, но не слышно, что
          вы записали. Содержимое ваших сказок ему недоступно.
        </p>
      </div>
    </div>
  );
}
