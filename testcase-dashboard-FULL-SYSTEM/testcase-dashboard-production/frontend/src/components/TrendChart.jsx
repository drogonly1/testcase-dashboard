// src/components/TrendChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

function TrendChart({ data, theme }) {
  // Sample data if none provided
  const chartData = data && data.length > 0 ? data : [
    { date: 'Mon', passed: 45, failed: 5, pending: 10 },
    { date: 'Tue', passed: 52, failed: 3, pending: 8 },
    { date: 'Wed', passed: 48, failed: 7, pending: 12 },
    { date: 'Thu', passed: 61, failed: 2, pending: 6 },
    { date: 'Fri', passed: 55, failed: 4, pending: 9 },
    { date: 'Sat', passed: 67, failed: 1, pending: 5 },
    { date: 'Sun', passed: 58, failed: 3, pending: 7 },
  ];

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Test Execution Trends
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Last 7 days performance
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600 dark:text-slate-400">Passed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600 dark:text-slate-400">Failed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-600 dark:text-slate-400">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#334155' : '#e2e8f0'}
              opacity={0.5}
            />
            <XAxis 
              dataKey="date" 
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px'
              }}
              labelStyle={{
                color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                fontWeight: 600,
                marginBottom: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="passed" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TrendChart;
