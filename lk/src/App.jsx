import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Library from './pages/Library';
import Subscription from './pages/Subscription';
import Voice from './pages/Voice';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/dashboard/progress" element={<Dashboard />} />
      <Route path="/dashboard/activity" element={<Dashboard />} />
      <Route path="/dashboard/support" element={<Dashboard />} />

      <Route path="/library/stories" element={<Library />} />
      <Route path="/library/lullabies" element={<Library />} />
      <Route path="/library/therapy" element={<Library />} />
      <Route path="/library/family" element={<Library />} />

      <Route path="/voice/my" element={<Voice />} />
      <Route path="/voice/manage" element={<Voice />} />
      <Route path="/voice/analytics" element={<Voice />} />

      <Route path="/subscription/tariff" element={<Subscription />} />
      <Route path="/subscription/payments" element={<Subscription />} />
      <Route path="/subscription/manage" element={<Subscription />} />
      <Route path="/subscription/bonus" element={<Subscription />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;