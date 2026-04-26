import { useEffect, useState } from 'react';

const DASHBOARD_TAB_KEY = 'lk-dashboard-tab-v1';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(DASHBOARD_TAB_KEY) || 'progress';
  });

  useEffect(() => {
    localStorage.setItem(DASHBOARD_TAB_KEY, activeTab);
  }, [activeTab]);

  return (
    <section className="lk-page lk-page--dashboard">
      <div className="lk-page__inner">

        {/* переключатель вкладок */}
        <div className="lk-tabs">
          <button
            className={activeTab === 'progress' ? 'is-active' : ''}
            onClick={() => setActiveTab('progress')}
          >
            Прогресс
          </button>

          <button
            className={activeTab === 'activity' ? 'is-active' : ''}
            onClick={() => setActiveTab('activity')}
          >
            Активность
          </button>

          <button
            className={activeTab === 'support' ? 'is-active' : ''}
            onClick={() => setActiveTab('support')}
          >
            Поддержка
          </button>
        </div>

        {/* контент */}
        {activeTab === 'progress' && <DashboardProgress />}
        {activeTab === 'activity' && <DashboardActivity />}
        {activeTab === 'support' && <DashboardSupport />}

      </div>
    </section>
  );
}