import Sidebar from "./Sidebar";

import Submenu from "./Submenu";

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