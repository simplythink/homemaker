import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { DashboardView } from './components/Dashboard/DashboardView';
import { InventoryView } from './components/Inventory/InventoryView';
import { CleaningView } from './components/Cleaning/CleaningView';
import './App.css';

type Tab = 'dashboard' | 'inventory' | 'cleaning';

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="app">
      <nav className="app-nav">
        <h1 className="app-title">居家管理</h1>
        <div className="nav-tabs">
          <button
            className={tab === 'dashboard' ? 'active' : ''}
            onClick={() => setTab('dashboard')}
          >
            🏠 總覽
          </button>
          <button
            className={tab === 'inventory' ? 'active' : ''}
            onClick={() => setTab('inventory')}
          >
            📦 存貨
          </button>
          <button
            className={tab === 'cleaning' ? 'active' : ''}
            onClick={() => setTab('cleaning')}
          >
            🧹 清潔
          </button>
        </div>
      </nav>

      <main className="app-main">
        {tab === 'dashboard' && <DashboardView />}
        {tab === 'inventory' && <InventoryView />}
        {tab === 'cleaning' && <CleaningView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
