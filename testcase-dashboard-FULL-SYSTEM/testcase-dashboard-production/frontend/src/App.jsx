// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Activity, TrendingUp, CheckCircle2, XCircle, Clock, AlertCircle, Settings, RefreshCw, Database, Zap } from 'lucide-react';
import DashboardMetrics from './components/DashboardMetrics';
import TestCaseTable from './components/TestCaseTable';
import TrendChart from './components/TrendChart';
import StatusDistribution from './components/StatusDistribution';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  const [theme, setTheme] = useState('dark');
  const [metrics, setMetrics] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics
      const metricsRes = await fetch('/api/testcases/metrics');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      // Fetch test cases
      const casesRes = await fetch('/api/testcases');
      const casesData = await casesRes.json();
      setTestCases(casesData);

      // Fetch trends
      const trendsRes = await fetch('/api/testcases/trends?days=7');
      const trendsData = await trendsRes.json();
      setTrends(trendsData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300" />
      
      {/* Noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] bg-noise pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar theme={theme} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            theme={theme}
            toggleTheme={toggleTheme}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            lastUpdated={lastUpdated}
            onRefresh={fetchData}
            loading={loading}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-[1800px] mx-auto p-6 space-y-6">
              {/* Hero Section with Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Test Cases"
                  value={metrics?.total || 0}
                  icon={Database}
                  trend="+12% from last week"
                  trendUp={true}
                  color="blue"
                  theme={theme}
                />
                <MetricCard
                  title="Pass Rate"
                  value={metrics ? `${((metrics.passed / metrics.total) * 100).toFixed(1)}%` : '0%'}
                  icon={CheckCircle2}
                  trend="+5.2% from last week"
                  trendUp={true}
                  color="green"
                  theme={theme}
                />
                <MetricCard
                  title="Failed"
                  value={metrics?.failed || 0}
                  icon={XCircle}
                  trend="-3 from yesterday"
                  trendUp={false}
                  color="red"
                  theme={theme}
                />
                <MetricCard
                  title="In Progress"
                  value={metrics?.pending || 0}
                  icon={Clock}
                  trend="2 added today"
                  trendUp={true}
                  color="yellow"
                  theme={theme}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart - 2 columns */}
                <div className="lg:col-span-2">
                  <TrendChart data={trends} theme={theme} />
                </div>

                {/* Status Distribution - 1 column */}
                <div className="lg:col-span-1">
                  <StatusDistribution metrics={metrics} theme={theme} />
                </div>
              </div>

              {/* Test Cases Table */}
              <div>
                <TestCaseTable data={testCases} theme={theme} loading={loading} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, trend, trendUp, color, theme }) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border-blue-200/50 dark:border-blue-800/50',
    green: 'from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 border-green-200/50 dark:border-green-800/50',
    red: 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border-red-200/50 dark:border-red-800/50',
    yellow: 'from-yellow-500/10 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10 border-yellow-200/50 dark:border-yellow-800/50',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-xl border backdrop-blur-sm
      bg-gradient-to-br ${colorClasses[color]}
      transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
    `}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
          </div>
          <div className={`
            p-3 rounded-lg bg-white/50 dark:bg-slate-800/50
            ${iconColorClasses[color]}
          `}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center text-xs">
            <TrendingUp className={`w-3 h-3 mr-1 ${trendUp ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
            <span className={trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
