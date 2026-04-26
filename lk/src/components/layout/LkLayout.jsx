import Sidebar from "./Sidebar";
import Header from "./Header";
import Submenu from "./Submenu";
import { Outlet } from "react-router-dom";

export default function LkLayout() {
  return (
    <div className="lk">
      <Sidebar />

      <div className="lk-shell">
        <Header />
        <Submenu />

        <main className="lk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}