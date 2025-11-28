// backend/src/routes/testcase.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/testcase.controller');

// Metrics endpoints (must be before /:id routes)
router.get('/metrics', controller.getMetrics);
router.get('/metrics/category', controller.getMetricsByCategory);
router.get('/trends', controller.getTrends);
router.get('/failures', controller.getTopFailures);

// CRUD endpoints
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Test run endpoints
router.post('/:id/runs', controller.createRun);
router.get('/:id/runs', controller.getRuns);

module.exports = router;
