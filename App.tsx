

import React, { useState } from 'react';
import TopNav from './src/components/layout/TopNav';
import ApiBuilder from './src/modules/api-builder';
import DatabaseManager from './src/db-manager';
import DataSourceList from './src/pages/DataSourceList';
import LogManager from './src/pages/LogManager';
import Settings from './src/pages/Settings';
import SmartQuery from './src/pages/SmartQuery';
import FunctionManager from './src/pages/FunctionManager';
import OpsManager from './src/pages/OpsManager';
import { AppPage } from './src/types';

function App() {
  const [activePage, setActivePage] = useState<AppPage>(AppPage.OPS_MANAGER);

  const renderContent = () => {
    switch (activePage) {
      case AppPage.SMART_QUERY:
        return <SmartQuery />;
      case AppPage.DATASOURCE:
        return <DataSourceList onNavigate={setActivePage} />;
      case AppPage.DATABASE_MANAGER:
        return <DatabaseManager />;
      case AppPage.API_MANAGER:
        return <ApiBuilder />;
      case AppPage.FUNCTION_MANAGER:
        return <FunctionManager />;
      case AppPage.OPS_MANAGER:
        return <OpsManager />;
      case AppPage.LOGS:
        return <LogManager />;
      case AppPage.SETTINGS:
        return <Settings />;
      default:
        return <OpsManager />;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 overflow-hidden">
      <TopNav activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;