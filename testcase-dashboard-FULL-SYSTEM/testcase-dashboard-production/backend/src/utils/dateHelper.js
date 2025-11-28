// backend/src/utils/dateHelper.js

/**
 * Get date range for last N days
 */
const getLastNDays = (days) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  
  return dates;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Get start and end of day
 */
const getDateRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get start and end of last N days
 */
const getLastNDaysRange = (days) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
};

module.exports = {
  getLastNDays,
  formatDate,
  getDateRange,
  getLastNDaysRange,
};
