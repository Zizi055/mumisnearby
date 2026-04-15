export default function Header() {
  return (
    <header className="lk-header">
      <div className="lk-header__left">
        <h1 className="lk-header__title">ГЛАВНАЯ</h1>
      </div>

      <div className="lk-header__right">
        <button className="lk-header__action" type="button">
          Уведомления
        </button>

        <button className="lk-header__profile" type="button">
          Профиль
        </button>
      </div>
    </header>
  );
}