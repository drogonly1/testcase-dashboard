// backend/src/config/logger.js
// Production-ready logging with Winston

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Format for file output (JSON for log parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join('/app/logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join('/app/logs', 'combined.log'),
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 10,
  }),
  
  // HTTP requests log
  new winston.transports.File({
    filename: path.join('/app/logs', 'http.log'),
    level: 'http',
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// HTTP request logger middleware
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// Worker logger (for scheduler/worker processes)
logger.worker = {
  jobStart: (jobId, jobName) => {
    logger.info(`[Worker] Job ${jobId} started: ${jobName}`);
  },
  jobComplete: (jobId, result) => {
    logger.info(`[Worker] Job ${jobId} completed`, { result });
  },
  jobFailed: (jobId, error) => {
    logger.error(`[Worker] Job ${jobId} failed`, { error: error.message, stack: error.stack });
  },
  collection: (source, count) => {
    logger.info(`[Worker] Collected ${count} test cases from ${source}`);
  },
};

// Graceful error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = logger;
