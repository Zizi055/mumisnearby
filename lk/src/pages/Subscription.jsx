import { Outlet } from 'react-router-dom';

export default function Subscription() {
  return (
    <section className="lk-page lk-page--subscription">
      <div className="lk-page__inner">
        <Outlet />
      </div>
    </section>
  );
}
