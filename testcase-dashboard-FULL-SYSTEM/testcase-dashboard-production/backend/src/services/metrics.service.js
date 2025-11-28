// backend/src/services/metrics.service.js
const prisma = require('../utils/prisma');
const { getLastNDays, formatDate, getLastNDaysRange } = require('../utils/dateHelper');

class MetricsService {
  /**
   * Calculate current dashboard metrics
   */
  async calculateMetrics() {
    // Get all test cases with their latest run
    const testCases = await prisma.testCase.findMany({
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    const total = testCases.length;
    let passed = 0;
    let failed = 0;
    let pending = 0;
    let skipped = 0;
    let totalDuration = 0;
    let durationCount = 0;
    
    testCases.forEach(tc => {
      const latestRun = tc.runs[0];
      
      if (!latestRun) {
        pending++;
        return;
      }
      
      switch (latestRun.status) {
        case 'passed':
          passed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'pending':
          pending++;
          break;
        case 'skipped':
          skipped++;
          break;
        default:
          pending++;
      }
      
      if (latestRun.duration) {
        totalDuration += latestRun.duration;
        durationCount++;
      }
    });
    
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    
    return {
      total,
      passed,
      failed,
      pending,
      skipped,
      passRate: parseFloat(passRate),
      avgDuration,
      lastUpdated: new Date(),
    };
  }
  
  /**
   * Get trends for last N days
   */
  async getTrends(days = 7) {
    const { start, end } = getLastNDaysRange(days);
    
    // Get all test runs in the date range
    const runs = await prisma.testRun.findMany({
      where: {
        executedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { executedAt: 'asc' },
    });
    
    // Group by date
    const dateMap = new Map();
    const dates = getLastNDays(days);
    
    // Initialize all dates with 0 counts
    dates.forEach(date => {
      const dateStr = formatDate(date);
      dateMap.set(dateStr, {
        date: dateStr,
        passed: 0,
        failed: 0,
        pending: 0,
        skipped: 0,
        total: 0,
      });
    });
    
    // Aggregate runs by date
    runs.forEach(run => {
      const dateStr = formatDate(new Date(run.executedAt));
      const stats = dateMap.get(dateStr);
      
      if (stats) {
        stats.total++;
        
        switch (run.status) {
          case 'passed':
            stats.passed++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'pending':
            stats.pending++;
            break;
          case 'skipped':
            stats.skipped++;
            break;
        }
      }
    });
    
    // Convert map to array and calculate pass rates
    const data = Array.from(dateMap.values()).map(day => ({
      ...day,
      passRate: day.total > 0 ? ((day.passed / day.total) * 100).toFixed(2) : 0,
    }));
    
    return { data };
  }
  
  /**
   * Get metrics by category
   */
  async getMetricsByCategory() {
    const testCases = await prisma.testCase.findMany({
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    const categoryMap = new Map();
    
    testCases.forEach(tc => {
      const category = tc.category || 'Uncategorized';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          total: 0,
          passed: 0,
          failed: 0,
          pending: 0,
        });
      }
      
      const stats = categoryMap.get(category);
      stats.total++;
      
      const latestRun = tc.runs[0];
      if (latestRun) {
        switch (latestRun.status) {
          case 'passed':
            stats.passed++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'pending':
            stats.pending++;
            break;
        }
      } else {
        stats.pending++;
      }
    });
    
    return Array.from(categoryMap.values());
  }
  
  /**
   * Get top failing test cases
   */
  async getTopFailures(limit = 10) {
    // Get test cases with failed runs
    const testCases = await prisma.testCase.findMany({
      include: {
        runs: {
          where: { status: 'failed' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            runs: {
              where: { status: 'failed' },
            },
          },
        },
      },
    });
    
    // Filter and sort by failure count
    const failures = testCases
      .filter(tc => tc._count.runs > 0)
      .map(tc => ({
        testId: tc.testId,
        summary: tc.summary,
        failureCount: tc._count.runs,
        lastFailure: tc.runs[0]?.executedAt || null,
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, limit);
    
    return failures;
  }
}

module.exports = new MetricsService();
