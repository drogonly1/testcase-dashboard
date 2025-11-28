// src/components/Header.jsx
import React from 'react';
import { Moon, Sun, RefreshCw, Bell, Settings, Search, Zap } from 'lucide-react';

function Header({ theme, toggleTheme, autoRefresh, setAutoRefresh, lastUpdated, onRefresh, loading }) {
  return (
    <header className="
      sticky top-0 z-40 
      border-b border-slate-200/50 dark:border-slate-800/50
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
      transition-colors duration-300
    ">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Title + Status */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              TestCase Dashboard
            </h1>
            {lastUpdated && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Live
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <button className="
            p-2 rounded-lg
            text-slate-600 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all duration-200
          ">
            <Search className="w-5 h-5" />
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${autoRefresh 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto-refresh</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="
              p-2 rounded-lg
              text-slate-600 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-slate-800
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <button className="
            relative p-2 rounded-lg
            text-slate-600 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all duration-200
          ">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="
              p-2 rounded-lg
              text-slate-600 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-all duration-200
            "
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Settings */}
          <button className="
            p-2 rounded-lg
            text-slate-600 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all duration-200
          ">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
