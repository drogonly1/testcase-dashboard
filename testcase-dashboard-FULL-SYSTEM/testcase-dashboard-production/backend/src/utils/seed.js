// backend/src/utils/seed.js
const prisma = require('./prisma');

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.testRun.deleteMany();
    await prisma.testCase.deleteMany();
    await prisma.dailyMetrics.deleteMany();
    
    // Create test cases
    console.log('📝 Creating test cases...');
    const testCases = await prisma.testCase.createMany({
      data: [
        {
          testId: 'TC-001',
          summary: 'Login with valid credentials',
          description: 'Verify user can login with correct username and password',
          category: 'Authentication',
          priority: 'high',
        },
        {
          testId: 'TC-002',
          summary: 'Login with invalid password',
          description: 'Verify proper error message when password is incorrect',
          category: 'Authentication',
          priority: 'high',
        },
        {
          testId: 'TC-003',
          summary: 'Register new user account',
          description: 'Verify new user registration process',
          category: 'Registration',
          priority: 'high',
        },
        {
          testId: 'TC-004',
          summary: 'Reset password via email',
          description: 'Verify password reset flow using email link',
          category: 'Authentication',
          priority: 'medium',
        },
        {
          testId: 'TC-005',
          summary: 'Update user profile information',
          description: 'Verify user can update their profile data',
          category: 'Profile',
          priority: 'medium',
        },
        {
          testId: 'TC-006',
          summary: 'Upload profile picture',
          description: 'Verify user can upload and save profile picture',
          category: 'Profile',
          priority: 'low',
        },
        {
          testId: 'TC-007',
          summary: 'Search for products',
          description: 'Verify product search functionality',
          category: 'Search',
          priority: 'high',
        },
        {
          testId: 'TC-008',
          summary: 'Filter products by category',
          description: 'Verify category filtering works correctly',
          category: 'Search',
          priority: 'medium',
        },
        {
          testId: 'TC-009',
          summary: 'Add item to shopping cart',
          description: 'Verify item can be added to cart',
          category: 'Cart',
          priority: 'high',
        },
        {
          testId: 'TC-010',
          summary: 'Remove item from cart',
          description: 'Verify item can be removed from cart',
          category: 'Cart',
          priority: 'high',
        },
        {
          testId: 'TC-011',
          summary: 'Checkout with credit card',
          description: 'Verify checkout process with credit card payment',
          category: 'Checkout',
          priority: 'high',
        },
        {
          testId: 'TC-012',
          summary: 'Apply discount code',
          description: 'Verify discount code is applied correctly',
          category: 'Checkout',
          priority: 'medium',
        },
        {
          testId: 'TC-013',
          summary: 'View order history',
          description: 'Verify user can view past orders',
          category: 'Orders',
          priority: 'medium',
        },
        {
          testId: 'TC-014',
          summary: 'Cancel order',
          description: 'Verify order cancellation process',
          category: 'Orders',
          priority: 'medium',
        },
        {
          testId: 'TC-015',
          summary: 'Submit customer support ticket',
          description: 'Verify support ticket submission',
          category: 'Support',
          priority: 'low',
        },
      ],
    });
    
    console.log(`✅ Created ${testCases.count} test cases`);
    
    // Get created test cases
    const createdTestCases = await prisma.testCase.findMany();
    
    // Create test runs for each test case
    console.log('🏃 Creating test runs...');
    
    const statuses = ['passed', 'failed', 'pending'];
    const assignees = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson', 'Charlie Brown'];
    
    let runCount = 0;
    
    for (const tc of createdTestCases) {
      // Create 1-3 runs for each test case
      const numRuns = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numRuns; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const executedAt = new Date();
        executedAt.setDate(executedAt.getDate() - daysAgo);
        
        await prisma.testRun.create({
          data: {
            testCaseId: tc.id,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            assignee: assignees[Math.floor(Math.random() * assignees.length)],
            executedBy: assignees[Math.floor(Math.random() * assignees.length)],
            executedAt,
            duration: Math.floor(Math.random() * 5000) + 500, // 500-5500ms
            environment: 'test',
          },
        });
        
        runCount++;
      }
    }
    
    console.log(`✅ Created ${runCount} test runs`);
    
    // Create daily metrics for last 7 days
    console.log('📊 Creating daily metrics...');
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const total = 15;
      const passed = Math.floor(Math.random() * 5) + 10; // 10-14
      const failed = Math.floor(Math.random() * 3) + 1;  // 1-3
      const pending = total - passed - failed;
      
      await prisma.dailyMetrics.create({
        data: {
          date,
          totalTests: total,
          passed,
          failed,
          pending,
          skipped: 0,
          passRate: (passed / total) * 100,
          avgDuration: Math.floor(Math.random() * 2000) + 1500, // 1500-3500ms
        },
      });
    }
    
    console.log('✅ Created 7 days of daily metrics');
    
    console.log('');
    console.log('🎉 Database seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Test Cases: ${testCases.count}`);
    console.log(`   - Test Runs: ${runCount}`);
    console.log(`   - Daily Metrics: 7 days`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
