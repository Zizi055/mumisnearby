import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Subscription from './pages/Subscription';
import Voice from './pages/Voice';
import LkLayout from "./components/layout/LkLayout";

function App() {
  return (
    <Routes>

      {/* редирект */}
      <Route path="/" element={<Navigate to="/dashboard/progress" replace />} />

      {/* layout */}
      <Route element={<LkLayout />}>

        {/* dashboard */}
        <Route path="/dashboard/progress" element={<Dashboard />} />
        <Route path="/dashboard/activity" element={<Dashboard />} />
        <Route path="/dashboard/support" element={<Dashboard />} />

        {/* library */}
        <Route path="/library/stories" element={<Library />} />
        <Route path="/library/lullabies" element={<Library />} />
        <Route path="/library/therapy" element={<Library />} />
        <Route path="/library/family" element={<Library />} />

        {/* voice */}
        <Route path="/voice/my" element={<Voice />} />
        <Route path="/voice/manage" element={<Voice />} />
        <Route path="/voice/analytics" element={<Voice />} />

        {/* subscription */}
        <Route path="/subscription/tariff" element={<Subscription />} />
        <Route path="/subscription/payments" element={<Subscription />} />
        <Route path="/subscription/manage" element={<Subscription />} />
        <Route path="/subscription/bonus" element={<Subscription />} />

      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard/progress" replace />} />

    </Routes>
  );
}

export default App;