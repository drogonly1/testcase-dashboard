// backend/src/services/testcase.service.js
const prisma = require('../utils/prisma');

class TestCaseService {
  /**
   * Get all test cases with filters and pagination
   */
  async getAll(filters = {}) {
    const { status, category, priority, search, limit = 50, offset = 0 } = filters;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { testId: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) where.category = category;
    if (priority) where.priority = priority;
    
    // Get test cases with latest run
    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status,
              executedAt,
              assignee,
              duration,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.testCase.count({ where }),
    ]);
    
    // Transform data to include latest run status
    const data = testCases.map(tc => ({
      id: tc.id,
      testId: tc.testId,
      summary: tc.summary,
      description: tc.description,
      category: tc.category,
      priority: tc.priority,
      status: tc.runs[0]?.status || 'pending',
      assignee: tc.runs[0]?.assignee || null,
      updatedAt: tc.updatedAt,
      latestRun: tc.runs[0] || null,
    }));
    
    return { data, total, limit: parseInt(limit), offset: parseInt(offset) };
  }
  
  /**
   * Get test case by ID
   */
  async getById(id) {
    const testCase = await prisma.testCase.findUnique({
      where: { id: parseInt(id) },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!testCase) {
      throw new Error('Test case not found');
    }
    
    return testCase;
  }
  
  /**
   * Create new test case
   */
  async create(data) {
    const { testId, summary, description, category, priority } = data;
    
    // Check if testId already exists
    const existing = await prisma.testCase.findUnique({
      where: { testId },
    });
    
    if (existing) {
      throw new Error(`Test case with ID ${testId} already exists`);
    }
    
    const testCase = await prisma.testCase.create({
      data: {
        testId,
        summary,
        description,
        category,
        priority: priority || 'medium',
      },
    });
    
    return testCase;
  }
  
  /**
   * Update test case
   */
  async update(id, data) {
    const { summary, description, category, priority } = data;
    
    const testCase = await prisma.testCase.update({
      where: { id: parseInt(id) },
      data: {
        ...(summary && { summary }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(priority && { priority }),
      },
    });
    
    return testCase;
  }
  
  /**
   * Delete test case
   */
  async delete(id) {
    await prisma.testCase.delete({
      where: { id: parseInt(id) },
    });
    
    return { message: 'Test case deleted successfully' };
  }
  
  /**
   * Create test run (execute test)
   */
  async createRun(testCaseId, data) {
    const { status, assignee, executedBy, duration, errorMsg, environment, buildNumber } = data;
    
    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: parseInt(testCaseId) },
    });
    
    if (!testCase) {
      throw new Error('Test case not found');
    }
    
    const run = await prisma.testRun.create({
      data: {
        testCaseId: parseInt(testCaseId),
        status,
        assignee,
        executedBy,
        executedAt: new Date(),
        duration: duration || null,
        errorMsg: errorMsg || null,
        environment: environment || 'test',
        buildNumber: buildNumber || null,
      },
    });
    
    return run;
  }
  
  /**
   * Get test runs for a test case
   */
  async getRuns(testCaseId, limit = 20) {
    const runs = await prisma.testRun.findMany({
      where: { testCaseId: parseInt(testCaseId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return runs;
  }
}

module.exports = new TestCaseService();
