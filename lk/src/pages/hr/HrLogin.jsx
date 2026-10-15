import { Navigate, useSearchParams } from 'react-router-dom';

// Вход компании переехал на общий экран авторизации: там переключатель
// «Компания / Сотрудник / Частный клиент». Отдельная страница осталась
// редиректом — ссылка /company/login успела разойтись по письмам и
// закладкам, и ломать её нельзя.
export default function HrLogin() {
  const [params] = useSearchParams();

  const next = new URLSearchParams(params);
  next.set('role', 'company');

  return <Navigate to={`/auth?${next.toString()}`} replace />;
}
