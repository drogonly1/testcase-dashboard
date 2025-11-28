// src/components/Sidebar.jsx
import React from 'react';
import { LayoutDashboard, FileText, TrendingUp, Settings, Users, Database, Clock, Activity } from 'lucide-react';

function Sidebar({ theme }) {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'testcases', label: 'Test Cases', icon: FileText },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="
      w-64 flex-shrink-0
      border-r border-slate-200/50 dark:border-slate-800/50
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
      transition-colors duration-300
    ">
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                QA Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                v1.0.0
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* User Profile */}
          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center space-x-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  User
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  QA Engineer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
