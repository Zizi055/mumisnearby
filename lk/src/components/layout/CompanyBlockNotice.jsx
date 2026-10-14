import { useEffect, useState } from 'react';
import { Building2, LogOut } from 'lucide-react';
import {
  COMPANY_BLOCK_EVENT,
  getCompanyBlock,
  clearCompanyBlock,
} from '../../utils/companyBlock';

// ─────────────────────────────────────────────────────────────────────
// Экран для сотрудника, чья компания выключена или у которой истёк
// договор.
//
// Показывается вместо содержимого кабинета, а НЕ вместо пейволла:
// платить сотруднику нечего и незачем — тариф оплачивает работодатель.
// Предлагать ему здесь оплату значит просить деньги за то, что ему уже
// должны по соцпакету.
//
// Выход оставлен: человек мог войти под корпоративной учёткой на чужом
// компьютере и должен иметь возможность выйти.
// ─────────────────────────────────────────────────────────────────────

export default function CompanyBlockNotice() {
  const [block, setBlock] = useState(getCompanyBlock);

  useEffect(() => {
    const onBlock = (e) => setBlock(e.detail);

    window.addEventListener(COMPANY_BLOCK_EVENT, onBlock);
    return () => window.removeEventListener(COMPANY_BLOCK_EVENT, onBlock);
  }, []);

  if (!block) return null;

  function handleLogout() {
    clearCompanyBlock();
    localStorage.removeItem('token');
    window.location.hash = '/auth';
  }

  return (
    <div className="lk-company-block">
      <div className="lk-company-block__card">
        <Building2 size={28} />

        <h1>{block.title}</h1>
        <p>{block.text}</p>

        <p className="lk-company-block__action">
          Что делать: напишите администратору вашей компании — тому, кто
          выдавал вам доступ. Восстановить его можем только мы вместе с ним.
        </p>

        <button
          type="button"
          className="lk-btn lk-btn--secondary lk-btn--md"
          onClick={handleLogout}
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>
    </div>
  );
}
