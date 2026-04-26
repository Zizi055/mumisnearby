import { Outlet } from 'react-router-dom';

export default function Voice() {
  return (
    <section className="lk-page lk-page--voice">
      <div className="lk-page__inner">
        <Outlet />
      </div>
    </section>
  );
}