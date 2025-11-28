// src/components/StatusDistribution.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

function StatusDistribution({ metrics, theme }) {
  // Sample data if metrics not provided
  const defaultMetrics = {
    total: 100,
    passed: 67,
    failed: 8,
    pending: 25
  };

  const metricsData = metrics || defaultMetrics;

  const data = [
    { name: 'Passed', value: metricsData.passed, color: '#10b981', icon: CheckCircle2 },
    { name: 'Failed', value: metricsData.failed, color: '#ef4444', icon: XCircle },
    { name: 'Pending', value: metricsData.pending, color: '#f59e0b', icon: Clock },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.value} ({((data.value / metricsData.total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden h-full">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" />
          Status Distribution
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Current test case breakdown
        </p>
      </div>

      <div className="p-6">
        {/* Chart */}
        <div className="flex items-center justify-center mb-6">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with detailed stats */}
        <div className="space-y-3">
          {data.map((item) => {
            const Icon = item.icon;
            const percentage = ((item.value / metricsData.total) * 100).toFixed(1);
            
            return (
              <div 
                key={item.name} 
                className="group p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.value}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Test Cases
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {metricsData.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusDistribution;
