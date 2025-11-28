// backend/src/controllers/testcase.controller.js
const testCaseService = require('../services/testcase.service');
const metricsService = require('../services/metrics.service');
const { success, error, paginated } = require('../utils/response');

/**
 * Get all test cases
 * GET /api/testcases
 */
exports.getAll = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      search: req.query.search,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0,
    };
    
    const result = await testCaseService.getAll(filters);
    res.json(paginated(result.data, result.total, result.limit, result.offset));
  } catch (err) {
    console.error('Error in getAll:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Get test case by ID
 * GET /api/testcases/:id
 */
exports.getById = async (req, res) => {
  try {
    const testCase = await testCaseService.getById(req.params.id);
    res.json(success(testCase));
  } catch (err) {
    console.error('Error in getById:', err);
    
    if (err.message === 'Test case not found') {
      res.status(404).json(error('Test case not found', 404));
    } else {
      res.status(500).json(error(err.message, 500));
    }
  }
};

/**
 * Create new test case
 * POST /api/testcases
 */
exports.create = async (req, res) => {
  try {
    const { testId, summary, description, category, priority } = req.body;
    
    // Validation
    if (!testId || !summary) {
      return res.status(400).json(error('testId and summary are required', 400));
    }
    
    const testCase = await testCaseService.create({
      testId,
      summary,
      description,
      category,
      priority,
    });
    
    res.status(201).json(success(testCase, 'Test case created successfully'));
  } catch (err) {
    console.error('Error in create:', err);
    
    if (err.message.includes('already exists')) {
      res.status(409).json(error(err.message, 409));
    } else {
      res.status(500).json(error(err.message, 500));
    }
  }
};

/**
 * Update test case
 * PUT /api/testcases/:id
 */
exports.update = async (req, res) => {
  try {
    const { summary, description, category, priority } = req.body;
    
    const testCase = await testCaseService.update(req.params.id, {
      summary,
      description,
      category,
      priority,
    });
    
    res.json(success(testCase, 'Test case updated successfully'));
  } catch (err) {
    console.error('Error in update:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Delete test case
 * DELETE /api/testcases/:id
 */
exports.delete = async (req, res) => {
  try {
    const result = await testCaseService.delete(req.params.id);
    res.json(success(result));
  } catch (err) {
    console.error('Error in delete:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Get dashboard metrics
 * GET /api/testcases/metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const metrics = await metricsService.calculateMetrics();
    res.json(success(metrics));
  } catch (err) {
    console.error('Error in getMetrics:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Get trends data
 * GET /api/testcases/trends
 */
exports.getTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trends = await metricsService.getTrends(days);
    res.json(success(trends.data));
  } catch (err) {
    console.error('Error in getTrends:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Create test run (execute test)
 * POST /api/testcases/:id/runs
 */
exports.createRun = async (req, res) => {
  try {
    const { status, assignee, executedBy, duration, errorMsg, environment, buildNumber } = req.body;
    
    // Validation
    if (!status) {
      return res.status(400).json(error('status is required', 400));
    }
    
    const run = await testCaseService.createRun(req.params.id, {
      status,
      assignee,
      executedBy,
      duration,
      errorMsg,
      environment,
      buildNumber,
    });
    
    res.status(201).json(success(run, 'Test run created successfully'));
  } catch (err) {
    console.error('Error in createRun:', err);
    
    if (err.message === 'Test case not found') {
      res.status(404).json(error('Test case not found', 404));
    } else {
      res.status(500).json(error(err.message, 500));
    }
  }
};

/**
 * Get test runs for a test case
 * GET /api/testcases/:id/runs
 */
exports.getRuns = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const runs = await testCaseService.getRuns(req.params.id, limit);
    res.json(success(runs));
  } catch (err) {
    console.error('Error in getRuns:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Get metrics by category
 * GET /api/testcases/metrics/category
 */
exports.getMetricsByCategory = async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsByCategory();
    res.json(success(metrics));
  } catch (err) {
    console.error('Error in getMetricsByCategory:', err);
    res.status(500).json(error(err.message, 500));
  }
};

/**
 * Get top failures
 * GET /api/testcases/failures
 */
exports.getTopFailures = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const failures = await metricsService.getTopFailures(limit);
    res.json(success(failures));
  } catch (err) {
    console.error('Error in getTopFailures:', err);
    res.status(500).json(error(err.message, 500));
  }
};
