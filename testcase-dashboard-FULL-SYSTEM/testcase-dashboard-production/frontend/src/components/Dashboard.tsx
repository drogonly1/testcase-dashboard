// frontend/src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Metrics {
  snapshot_id: number;
  collected_at: string;
  totalCases: number;
  activeCases: number;
  passedCases: number;
  failedCases: number;
  blockedCases: number;
  pendingCases: number;
  deletedCases: number;
  passRate: number;
  completionRate: number;
  by_assignee: Array<{
    assignee: string;
    passed: number;
    failed: number;
    blocked: number;
    pending: number;
    total: number;
  }>;
}

interface Trend {
  date: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
  pass_rate: number;
  completion_rate: number;
}

interface Settings {
  auto_update_enabled: boolean;
  collection_interval: number;
  next_collection_at?: string;
}

const COLORS = {
  passed: '#4caf50',
  failed: '#f44336',
  blocked: '#ff9800',
  pending: '#9e9e9e'
};

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [settings, setSettings] = useState<Settings>({
    auto_update_enabled: false,
    collection_interval: 30
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Poll for updates every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, trendsRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/metrics`),
        axios.get(`${API_BASE_URL}/api/dashboard/trends?days=7`),
        axios.get(`${API_BASE_URL}/api/settings`)
      ]);

      setMetrics(metricsRes.data);
      setTrends(trendsRes.data.trends);
      setSettings(settingsRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
  };

  const toggleAutoUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/settings/auto-update`, {
        enabled: !settings.auto_update_enabled,
        interval: settings.collection_interval
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualUpdate = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/settings/manual-trigger`);
      setTimeout(fetchData, 2000); // Wait 2s before fetching
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInterval = async (newInterval: number) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/settings/interval`, {
        interval: newInterval
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = [
    { name: 'Passed', value: metrics.passedCases, color: COLORS.passed },
    { name: 'Failed', value: metrics.failedCases, color: COLORS.failed },
    { name: 'Blocked', value: metrics.blockedCases, color: COLORS.blocked },
    { name: 'Pending', value: metrics.pendingCases, color: COLORS.pending }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Case Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(metrics.collected_at).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.auto_update_enabled}
                      onChange={toggleAutoUpdate}
                      disabled={loading}
                    />
                    <div className={`block w-14 h-8 rounded-full ${settings.auto_update_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings.auto_update_enabled ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Auto-Update
                  </span>
                </label>
              </div>

              <select
                value={settings.collection_interval}
                onChange={(e) => updateInterval(Number(e.target.value))}
                disabled={!settings.auto_update_enabled || loading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>

              <button
                onClick={triggerManualUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Updating...' : '🔄 Refresh Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Test Cases"
            value={metrics.activeCases}
            icon="📋"
            subtitle={`${metrics.deletedCases} deleted`}
          />
          <MetricCard
            title="Passed"
            value={metrics.passedCases}
            percentage={metrics.passRate}
            icon="✅"
            color="green"
          />
          <MetricCard
            title="Failed"
            value={metrics.failedCases}
            icon="❌"
            color="red"
          />
          <MetricCard
            title="Completion Rate"
            value={`${metrics.completionRate.toFixed(1)}%`}
            icon="📊"
            subtitle={`${metrics.pendingCases} pending`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pass Rate Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate Trend (7 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pass_rate" stroke="#4caf50" name="Pass Rate %" strokeWidth={2} />
                <Line type="monotone" dataKey="completion_rate" stroke="#2196f3" name="Completion %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" stackId="a" fill={COLORS.passed} name="Passed" />
              <Bar dataKey="failed" stackId="a" fill={COLORS.failed} name="Failed" />
              <Bar dataKey="blocked" stackId="a" fill={COLORS.blocked} name="Blocked" />
              <Bar dataKey="pending" stackId="a" fill={COLORS.pending} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Assignee */}
        {metrics.by_assignee && metrics.by_assignee.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Assignee</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.by_assignee.map((item, index) => {
                    const passRate = item.total > 0 
                      ? ((item.passed / (item.passed + item.failed + item.blocked)) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.assignee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.passed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.failed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pending}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{passRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  percentage?: number;
  subtitle?: string;
  color?: 'green' | 'red' | 'blue' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, percentage, subtitle, color = 'blue' }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {percentage !== undefined && (
            <p className="text-sm text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};
