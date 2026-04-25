import { useLocation } from 'react-router-dom';
import { navigation } from "../../config/navigation";
import { Bell, User } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  const current = navigation.find((item) =>
    location.pathname.startsWith(item.path)
  );

  const currentChild = current?.children.find((child) =>
    location.pathname === child.path
  );

  return (
    <header className="lk-header">
      <div className="lk-header__left">
        <div className="lk-header__breadcrumb">
          {current?.label} / {currentChild?.label}
        </div>

        <h1 className="lk-header__title">
          {currentChild?.label}
        </h1>
      </div>

      <div className="lk-header__right">
        <button className="lk-header__icon-btn" type="button">
          <Bell size={20} strokeWidth={1.7} />
        </button>

        <button className="lk-header__icon-btn" type="button">
          <User size={20} strokeWidth={1.7} />
        </button>
      </div>
    </header>
  );
}