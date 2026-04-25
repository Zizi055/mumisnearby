import Sidebar from '../components/layout/Sidebar';
import Submenu from '../components/layout/Submenu';

export default function LkLayout({ children }) {
  return (
    <div className="lk-layout">
      <Sidebar />
      <Submenu />

      <main className="lk-content">
        {children}
      </main>
    </div>
  );
}