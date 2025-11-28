// src/components/TestCaseTable.jsx
import React, { useState } from 'react';
import { Search, Filter, Download, ChevronDown, CheckCircle2, XCircle, Clock, Circle, ExternalLink } from 'lucide-react';

function TestCaseTable({ data, theme, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter and sort data
  const filteredData = data
    .filter(item => {
      const matchesSearch = item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.testId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'id') return order * (a.testId || '').localeCompare(b.testId || '');
      if (sortBy === 'status') return order * (a.status || '').localeCompare(b.status || '');
      if (sortBy === 'updated') return order * (new Date(a.updatedAt) - new Date(b.updatedAt));
      return 0;
    });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'ng':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      passed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
      ok: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
      ng: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    };

    return (
      <span className={`
        inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
        ${classes[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'}
      `}>
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  return (
    <div className="
      rounded-xl border border-slate-200/50 dark:border-slate-800/50
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
      overflow-hidden
    ">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Test Cases
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filteredData.length} of {data.length} test cases
            </p>
          </div>

          <button className="
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-blue-600 hover:bg-blue-700 text-white
            transition-all duration-200
          ">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 rounded-lg text-sm
                bg-slate-100 dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                text-slate-900 dark:text-white
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-all duration-200
              "
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all duration-200
            "
          >
            <option value="all">All Status</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Sort */}
          <button className="
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-slate-100 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-white
            hover:bg-slate-200 dark:hover:bg-slate-700
            transition-all duration-200
          ">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Test ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No test cases found
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={index}
                  className="
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                    transition-colors duration-150
                  "
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {item.testId || 'N/A'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 dark:text-white line-clamp-2">
                      {item.summary || 'No summary'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {(item.assignee || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-900 dark:text-white">
                        {item.assignee || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="
                      p-1.5 rounded-lg
                      text-slate-400 hover:text-blue-600 dark:hover:text-blue-400
                      hover:bg-slate-100 dark:hover:bg-slate-800
                      transition-all duration-200
                    ">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing 1 to {filteredData.length} of {data.length} results
          </p>
          <div className="flex items-center space-x-2">
            <button className="
              px-3 py-1.5 rounded-lg text-sm font-medium
              bg-slate-100 dark:bg-slate-800
              text-slate-900 dark:text-white
              hover:bg-slate-200 dark:hover:bg-slate-700
              transition-all duration-200
            ">
              Previous
            </button>
            <button className="
              px-3 py-1.5 rounded-lg text-sm font-medium
              bg-blue-600 text-white
              hover:bg-blue-700
              transition-all duration-200
            ">
              1
            </button>
            <button className="
              px-3 py-1.5 rounded-lg text-sm font-medium
              bg-slate-100 dark:bg-slate-800
              text-slate-900 dark:text-white
              hover:bg-slate-200 dark:hover:bg-slate-700
              transition-all duration-200
            ">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCaseTable;
