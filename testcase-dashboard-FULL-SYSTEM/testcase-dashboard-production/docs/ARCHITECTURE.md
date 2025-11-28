# THIẾT KẾ KỸ THUẬT: TEST CASE DASHBOARD REALTIME

**Document Version:** 1.0  
**Date:** 27/11/2025  
**Role:** Technical Architect + PMO

---

## 📋 MỤC LỤC

1. [Executive Summary](#executive-summary)
2. [Phân tích File Test Case hiện tại](#phân-tích-file-test-case)
3. [Kiến trúc Hệ thống](#kiến-trúc-hệ-thống)
4. [Chi tiết các Component](#chi-tiết-các-component)
5. [Database Design](#database-design)
6. [API Specification](#api-specification)
7. [Data Flow](#data-flow)
8. [Auto-Update Mechanism](#auto-update-mechanism)
9. [Technology Stack](#technology-stack)
10. [UI/UX Design](#uiux-design)
11. [Risk Management](#risk-management)
12. [Implementation Roadmap](#implementation-roadmap)

---

## 1. EXECUTIVE SUMMARY

### Mục tiêu
Xây dựng hệ thống Dashboard realtime để theo dõi tiến độ test case từ Excel/Google Sheet, giúp PM quản lý hiệu quả mà không làm thay đổi workflow của team.

### Key Features
- ✅ Auto-update từ Excel/Google Sheet với interval tùy chỉnh (default: 30 phút)
- ✅ Tracking realtime: số lượng test case, status (○, ▲, ×), người thực hiện
- ✅ Dashboard với biểu đồ trực quan: progress, pass/fail ratio, trends
- ✅ Historical data cho phân tích xu hướng
- ✅ Alert khi phát hiện delay hoặc anomaly

---

## 2. PHÂN TÍCH FILE TEST CASE HIỆN TẠI

### 2.0 Quan trọng: Cách thức làm việc với File Excel Local

**KHÔNG CẦN ADD-INS HAY TOOL ĐẶC BIỆT!**

Team member làm việc hoàn toàn bình thường với Excel như thói quen hiện tại. Có 3 phương án để system collect data:

#### **Phương án 1: Shared Network Drive (Recommended)**
```
Team members → Edit Excel trên Network Drive (\\server\share\testcases.xlsx)
                ↓
            Worker đọc trực tiếp từ network path
                ↓
            Dashboard tự động update
```

**Ưu điểm:**
- ✅ Không cần thay đổi workflow
- ✅ Không cần setup gì thêm
- ✅ Real-time sync
- ✅ Chỉ cần config đường dẫn network

**Setup:**
```javascript
// worker config
{
  source: 'excel',
  filePath: '\\\\server\\share\\testcases.xlsx'  // Network UNC path
}
```

#### **Phương án 2: Google Sheets (Collaborative)**
```
Team members → Edit trên Google Sheets
                ↓
            Worker gọi Google Sheets API
                ↓
            Dashboard tự động update
```

**Ưu điểm:**
- ✅ Collaborative editing (nhiều người cùng lúc)
- ✅ Không cần network drive
- ✅ Access từ bất kỳ đâu
- ✅ Version history built-in

**Setup:**
1. Upload Excel lên Google Sheets
2. Share với service account
3. Worker tự động đọc qua API

#### **Phương án 3: Local File với Manual Upload**
```
Team member → Edit Excel local → Upload lên server qua Web UI
                                        ↓
                                    Worker đọc file
                                        ↓
                                    Dashboard update
```

**Ưu điểm:**
- ✅ Làm việc offline
- ✅ Full control

**Nhược điểm:**
- ❌ Cần manual upload
- ❌ Không real-time

#### **Phương án 4: Dropbox/OneDrive Sync**
```
Team member → Edit Excel local trong Dropbox/OneDrive folder
                ↓
            Dropbox/OneDrive tự sync lên cloud
                ↓
            Worker đọc từ synced folder
                ↓
            Dashboard update
```

**Ưu điểm:**
- ✅ Tự động sync
- ✅ Work offline
- ✅ Không cần thay đổi workflow

### Cấu trúc File Excel
Dựa trên file `Toho3_testcases_ver1_8_20250930.xlsx`:

**Structure:**
- **Header Row:** Row 8
- **Data Start:** Row 9
- **Key Columns:**
  - Col A (通番): Test Case ID
  - Col B (概要): Test Case Summary
  - Col C (機能名): Function Name
  - Col D (項目名): Item Name
  - Col E (前提条件): Precondition
  - Col F (確認内容): Test Content
  - Col G (期待結果): Expected Result
  - Col H (特記事項等): Notes
  - **Col I (結果): STATUS** → ○ (OK/Pass), ▲ (NG/Fail), × (Blocked), 削除 (Deleted)
  - Col J (実施予定日): Planned Execution Date
  - Col K (確認予定日): Planned Review Date
  - Col L (実施日): Actual Execution Date
  - Col M (確認日): Actual Review Date
  - Col N (確認者): Reviewer/Assignee
  - Col O (障害票№): Bug Ticket No
  - Col P (備考): Remarks

**Status Indicators:**
- ○ (Maru): Test Passed
- ▲ (Delta): Test Failed (NG)
- × (Batsu): Blocked
- 削除: Deleted/Skipped
- (Empty): Pending/Not Run

**Summary Formulas (Row 3):**
- Total Cases: `=COUNTA(F9:F1009)`
- Deleted Cases: `=COUNTIF(I9:I1009,"削除")`
- Active Test Cases: `=K3-L3`
- Passed (○): `=COUNTIF(I9:I1009,"○")`
- Failed (▲): `=COUNTIF(I9:I1009,"▲")`

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Excel File      │              │  Google Sheet    │         │
│  │  (Local/Network) │              │  (Cloud)         │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            └─────────────┬────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTOR SERVICE                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Scheduler (Cron/Bull Queue)                            │  │
│  │  • File Parser (Excel/GSheet API)                         │  │
│  │  • Data Validator & Transformer                           │  │
│  │  • Schema Version Detector                                │  │
│  └───────────────────────┬───────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  REST API (Node.js + Express / FastAPI)                  │   │
│  │  • POST /api/testcases/sync                              │   │
│  │  • GET  /api/testcases/summary                           │   │
│  │  • GET  /api/testcases/history                           │   │
│  │  • GET  /api/dashboard/metrics                           │   │
│  │  • PUT  /api/settings/auto-update                        │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                            │
│  ┌────────────────────┐         ┌─────────────────────┐         │
│  │  PostgreSQL/MySQL  │         │  Redis Cache        │         │
│  │  (Main DB)         │         │  (Session/Queue)    │         │
│  └────────────────────┘         └─────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND DASHBOARD                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React/Vue.js + Chart.js/Recharts                        │   │
│  │  • Real-time metrics display                             │   │
│  │  • Interactive charts & trends                           │   │
│  │  • Auto-update toggle & interval config                  │   │
│  │  • Alert notifications                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Settings    │  │  History     │          │
│  │  View        │  │  Panel       │  │  Trends      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│                      (REST API)                                 │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Backend (Node.js)                           │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────┐          │
│  │            API Gateway (Express)                   │          │
│  │  • Authentication & Authorization                  │          │
│  │  • Rate Limiting                                   │          │
│  │  • Request Validation                              │          │
│  └─────────────┬──────────────────────┬───────────────┘          │
│                │                      │                          │
│  ┌─────────────▼───────────┐  ┌──────▼────────────────┐         │
│  │  TestCase Service       │  │  Scheduler Service    │         │
│  │  • CRUD operations      │  │  • Bull Queue         │         │
│  │  • Metrics calculation  │  │  • Job management     │         │
│  │  • Historical tracking  │  │  • Interval config    │         │
│  └─────────────┬───────────┘  └──────┬────────────────┘         │
│                │                     │                           │
│  ┌─────────────▼─────────────────────▼─────────────┐            │
│  │         Data Collector Worker                    │            │
│  │  • Excel Parser (xlsx library)                   │            │
│  │  • Google Sheets API Client                      │            │
│  │  • Data Transformation Logic                     │            │
│  │  • Schema Detection & Migration                  │            │
│  └──────────────────────────┬───────────────────────┘            │
└─────────────────────────────┼──────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                      Database Layer                             │
│                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │   PostgreSQL         │        │   Redis              │      │
│  │   • testcases        │        │   • Queue jobs       │      │
│  │   • snapshots        │        │   • Cache            │      │
│  │   • settings         │        │   • Sessions         │      │
│  │   • audit_logs       │        └──────────────────────┘      │
│  └──────────────────────┘                                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. CHI TIẾT CÁC COMPONENT

### 4.1 Data Collector Service (Worker)

**Responsibilities:**
- Đọc file Excel/Google Sheet theo interval
- Parse và validate data
- Transform sang format chuẩn
- Push data lên API
- Handle errors và retry logic

**Technology:**
- **Language:** Node.js hoặc Python
- **Libraries:**
  - Node.js: `xlsx`, `google-spreadsheet`, `bull`, `node-cron`
  - Python: `openpyxl`, `gspread`, `celery`, `pandas`

**Key Functions:**

```javascript
// Node.js Example
class DataCollector {
  async collectFromExcel(filePath) {
    // 1. Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    
    // 2. Parse data starting from row 9
    const data = XLSX.utils.sheet_to_json(sheet, { 
      range: 8, // Start from row 9 (0-indexed)
      header: ['id', 'summary', 'function', 'item', 'precondition', 
               'content', 'expected', 'notes', 'status', 'planned_exec_date',
               'planned_review_date', 'actual_exec_date', 'actual_review_date',
               'assignee', 'bug_ticket', 'remarks']
    });
    
    // 3. Filter valid rows (có content)
    const validData = data.filter(row => row.content && row.content.trim());
    
    // 4. Transform status
    const transformed = validData.map(row => ({
      ...row,
      status: this.normalizeStatus(row.status),
      collected_at: new Date().toISOString()
    }));
    
    return transformed;
  }
  
  normalizeStatus(status) {
    const statusMap = {
      '○': 'PASSED',
      '▲': 'FAILED',
      '×': 'BLOCKED',
      '削除': 'DELETED',
      '': 'PENDING'
    };
    return statusMap[status] || 'PENDING';
  }
  
  async collectFromGoogleSheet(spreadsheetId, sheetName) {
    // Similar logic using google-spreadsheet library
  }
  
  async pushToAPI(data) {
    // POST to backend API
    const response = await axios.post('/api/testcases/sync', {
      testcases: data,
      source: 'excel',
      timestamp: new Date().toISOString()
    });
    return response.data;
  }
}
```

### 4.2 Backend API (Node.js + Express)

**Technology Stack:**
- Framework: Express.js / NestJS
- ORM: Prisma / TypeORM / Sequelize
- Validation: Joi / Zod
- Queue: Bull (Redis-based)

**Core Endpoints:**

```typescript
// API Routes
interface APIRoutes {
  // Data Ingestion
  POST   '/api/testcases/sync'           // Sync data from collector
  POST   '/api/testcases/bulk'           // Bulk insert/update
  
  // Query & Metrics
  GET    '/api/testcases'                // List testcases with filters
  GET    '/api/testcases/:id'            // Get specific testcase
  GET    '/api/dashboard/metrics'        // Current metrics summary
  GET    '/api/dashboard/trends'         // Historical trends
  GET    '/api/dashboard/comparison'     // Compare snapshots
  
  // Settings
  GET    '/api/settings'                 // Get current settings
  PUT    '/api/settings/auto-update'     // Enable/disable auto-update
  PUT    '/api/settings/interval'        // Set collection interval
  POST   '/api/settings/manual-trigger'  // Manual data collection
  
  // History
  GET    '/api/snapshots'                // List all snapshots
  GET    '/api/snapshots/:id'            // Get specific snapshot
  
  // Admin
  GET    '/api/health'                   // Health check
  GET    '/api/logs'                     // System logs
}
```

**Sample Implementation:**

```typescript
// src/controllers/testcase.controller.ts
class TestCaseController {
  async syncTestCases(req: Request, res: Response) {
    try {
      const { testcases, source, timestamp } = req.body;
      
      // 1. Validate input
      const validated = testCaseSchema.parse(testcases);
      
      // 2. Create snapshot
      const snapshot = await db.snapshot.create({
        data: {
          source,
          collected_at: new Date(timestamp),
          total_cases: validated.length
        }
      });
      
      // 3. Bulk upsert testcases
      const result = await db.testCase.createMany({
        data: validated.map(tc => ({
          ...tc,
          snapshot_id: snapshot.id
        })),
        skipDuplicates: true
      });
      
      // 4. Calculate metrics
      const metrics = this.calculateMetrics(validated);
      
      // 5. Store metrics
      await db.metrics.create({
        data: {
          snapshot_id: snapshot.id,
          ...metrics
        }
      });
      
      // 6. Check for alerts
      await this.checkAlerts(metrics);
      
      return res.json({ 
        success: true, 
        snapshot_id: snapshot.id,
        metrics 
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  calculateMetrics(testcases: TestCase[]) {
    const total = testcases.length;
    const passed = testcases.filter(tc => tc.status === 'PASSED').length;
    const failed = testcases.filter(tc => tc.status === 'FAILED').length;
    const blocked = testcases.filter(tc => tc.status === 'BLOCKED').length;
    const pending = testcases.filter(tc => tc.status === 'PENDING').length;
    const deleted = testcases.filter(tc => tc.status === 'DELETED').length;
    
    return {
      total,
      active: total - deleted,
      passed,
      failed,
      blocked,
      pending,
      pass_rate: total > 0 ? (passed / (total - deleted - pending)) * 100 : 0,
      completion_rate: total > 0 ? ((passed + failed + blocked) / total) * 100 : 0
    };
  }
}
```

### 4.3 Scheduler Service

**Technology:** Bull Queue (Redis-based)

**Configuration:**

```typescript
// src/services/scheduler.service.ts
import Bull from 'bull';
import { DataCollector } from './data-collector';

class SchedulerService {
  private queue: Bull.Queue;
  private collector: DataCollector;
  
  constructor() {
    this.queue = new Bull('testcase-collection', {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    });
    
    this.collector = new DataCollector();
    this.setupProcessors();
  }
  
  setupProcessors() {
    // Process collection jobs
    this.queue.process('collect-data', async (job) => {
      const { source, filePath, sheetId } = job.data;
      
      console.log(`[Job ${job.id}] Starting collection from ${source}`);
      
      try {
        let data;
        if (source === 'excel') {
          data = await this.collector.collectFromExcel(filePath);
        } else if (source === 'gsheet') {
          data = await this.collector.collectFromGoogleSheet(sheetId);
        }
        
        await this.collector.pushToAPI(data);
        
        console.log(`[Job ${job.id}] Completed successfully`);
        return { success: true, count: data.length };
      } catch (error) {
        console.error(`[Job ${job.id}] Failed:`, error);
        throw error;
      }
    });
  }
  
  async scheduleRecurringJob(intervalMinutes: number, config: any) {
    // Add repeatable job
    await this.queue.add(
      'collect-data',
      config,
      {
        repeat: {
          every: intervalMinutes * 60 * 1000 // Convert to milliseconds
        },
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50,     // Keep last 50 failed jobs
        attempts: 3,          // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );
  }
  
  async enableAutoUpdate(config: AutoUpdateConfig) {
    await this.scheduleRecurringJob(config.interval, {
      source: config.source,
      filePath: config.filePath,
      sheetId: config.sheetId
    });
  }
  
  async disableAutoUpdate() {
    await this.queue.removeRepeatable('collect-data');
  }
  
  async triggerManualCollection(config: any) {
    await this.queue.add('collect-data', config, {
      priority: 1 // High priority
    });
  }
}
```

### 4.4 Frontend Dashboard (React)

**Technology Stack:**
- Framework: React 18 + Vite
- UI Library: Material-UI / Ant Design / Shadcn-UI
- Charts: Recharts / Chart.js / Apache ECharts
- State: Zustand / Redux Toolkit
- API Client: Axios / React Query

**Key Components:**

```tsx
// src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, BarChart, PieChart } from 'recharts';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [interval, setInterval] = useState(30);
  
  useEffect(() => {
    fetchMetrics();
    fetchTrends();
    
    // Poll for updates every 1 minute
    const pollInterval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(pollInterval);
  }, []);
  
  const fetchMetrics = async () => {
    const response = await api.get('/api/dashboard/metrics');
    setMetrics(response.data);
  };
  
  const fetchTrends = async () => {
    const response = await api.get('/api/dashboard/trends?days=7');
    setTrends(response.data);
  };
  
  const toggleAutoUpdate = async () => {
    await api.put('/api/settings/auto-update', {
      enabled: !autoUpdateEnabled,
      interval
    });
    setAutoUpdateEnabled(!autoUpdateEnabled);
  };
  
  return (
    <div className="dashboard">
      {/* Header with controls */}
      <header>
        <h1>Test Case Dashboard</h1>
        <div className="controls">
          <label>
            <input 
              type="checkbox" 
              checked={autoUpdateEnabled}
              onChange={toggleAutoUpdate}
            />
            Auto-Update
          </label>
          <select 
            value={interval} 
            onChange={(e) => setInterval(Number(e.target.value))}
            disabled={!autoUpdateEnabled}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      </header>
      
      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard 
          title="Total Test Cases" 
          value={metrics?.total}
          icon="📋"
        />
        <MetricCard 
          title="Passed" 
          value={metrics?.passed}
          percentage={metrics?.pass_rate}
          color="green"
          icon="✅"
        />
        <MetricCard 
          title="Failed" 
          value={metrics?.failed}
          color="red"
          icon="❌"
        />
        <MetricCard 
          title="Completion Rate" 
          value={`${metrics?.completion_rate}%`}
          icon="📊"
        />
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Status Distribution</h3>
          <PieChart data={[
            { name: 'Passed', value: metrics?.passed, fill: '#4caf50' },
            { name: 'Failed', value: metrics?.failed, fill: '#f44336' },
            { name: 'Blocked', value: metrics?.blocked, fill: '#ff9800' },
            { name: 'Pending', value: metrics?.pending, fill: '#9e9e9e' }
          ]} />
        </div>
        
        <div className="chart-card">
          <h3>Trend Over Time</h3>
          <LineChart data={trends} />
        </div>
        
        <div className="chart-card">
          <h3>Daily Progress</h3>
          <BarChart data={trends} />
        </div>
      </div>
      
      {/* Test Case Table */}
      <div className="table-container">
        <h3>Recent Test Cases</h3>
        <TestCaseTable />
      </div>
    </div>
  );
};
```

---

## 5. DATABASE DESIGN

### 5.1 Schema

```sql
-- Table: settings
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  auto_update_enabled BOOLEAN DEFAULT false,
  collection_interval INTEGER DEFAULT 30, -- minutes
  source_type VARCHAR(20) CHECK (source_type IN ('excel', 'gsheet')),
  source_path TEXT,
  spreadsheet_id TEXT,
  sheet_name VARCHAR(255),
  last_collection_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: snapshots (Historical collection records)
CREATE TABLE snapshots (
  id SERIAL PRIMARY KEY,
  source VARCHAR(20) NOT NULL,
  collected_at TIMESTAMP NOT NULL,
  total_cases INTEGER,
  file_hash VARCHAR(64), -- MD5 hash để detect file changes
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_collected_at (collected_at DESC)
);

-- Table: testcases
CREATE TABLE testcases (
  id SERIAL PRIMARY KEY,
  snapshot_id INTEGER REFERENCES snapshots(id) ON DELETE CASCADE,
  
  -- Test case identification
  test_id VARCHAR(50),  -- Row number from Excel
  summary TEXT,
  function_name VARCHAR(255),
  item_name VARCHAR(255),
  
  -- Test details
  precondition TEXT,
  test_content TEXT,
  expected_result TEXT,
  notes TEXT,
  
  -- Status & execution
  status VARCHAR(20) CHECK (status IN ('PENDING', 'PASSED', 'FAILED', 'BLOCKED', 'DELETED')),
  planned_exec_date DATE,
  planned_review_date DATE,
  actual_exec_date DATE,
  actual_review_date DATE,
  
  -- Assignee & tracking
  assignee VARCHAR(255),
  bug_ticket VARCHAR(100),
  remarks TEXT,
  
  -- Metadata
  collected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_snapshot (snapshot_id),
  INDEX idx_status (status),
  INDEX idx_assignee (assignee),
  INDEX idx_collected_at (collected_at DESC)
);

-- Table: metrics (Aggregated metrics per snapshot)
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  snapshot_id INTEGER REFERENCES snapshots(id) ON DELETE CASCADE,
  
  -- Counts
  total_cases INTEGER,
  active_cases INTEGER,
  passed_cases INTEGER,
  failed_cases INTEGER,
  blocked_cases INTEGER,
  pending_cases INTEGER,
  deleted_cases INTEGER,
  
  -- Rates (%)
  pass_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  
  -- Timing
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_snapshot (snapshot_id),
  INDEX idx_calculated_at (calculated_at DESC)
);

-- Table: alerts
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  snapshot_id INTEGER REFERENCES snapshots(id),
  alert_type VARCHAR(50), -- 'HIGH_FAIL_RATE', 'DELAYED_EXECUTION', 'ANOMALY'
  severity VARCHAR(20), -- 'INFO', 'WARNING', 'CRITICAL'
  message TEXT,
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_severity (severity),
  INDEX idx_acknowledged (acknowledged),
  INDEX idx_created_at (created_at DESC)
);

-- Table: audit_logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50), -- 'COLLECTION', 'SETTING_CHANGED', 'MANUAL_TRIGGER'
  user_id VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_action (action),
  INDEX idx_created_at (created_at DESC)
);

-- Table: schema_migrations (Track file structure changes)
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  columns JSONB, -- Store column mapping
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Sample Data Format

```json
// Snapshot record
{
  "id": 1,
  "source": "excel",
  "collected_at": "2025-11-27T10:30:00Z",
  "total_cases": 156,
  "file_hash": "abc123def456...",
  "schema_version": 1
}

// TestCase record
{
  "id": 1,
  "snapshot_id": 1,
  "test_id": "1",
  "summary": "Test login functionality",
  "function_name": "会員区分登録",
  "status": "PASSED",
  "assignee": "Nguyen Van A",
  "actual_exec_date": "2025-11-25",
  "collected_at": "2025-11-27T10:30:00Z"
}

// Metrics record
{
  "id": 1,
  "snapshot_id": 1,
  "total_cases": 156,
  "active_cases": 150,
  "passed_cases": 120,
  "failed_cases": 15,
  "pending_cases": 15,
  "pass_rate": 88.24,
  "completion_rate": 90.00
}
```

---

## 6. API SPECIFICATION

### 6.1 Data Sync API

**POST /api/testcases/sync**

Request:
```json
{
  "testcases": [
    {
      "test_id": "1",
      "summary": "Test case summary",
      "function_name": "会員区分登録",
      "item_name": "Login",
      "status": "PASSED",
      "assignee": "Nguyen Van A",
      "actual_exec_date": "2025-11-25"
    }
  ],
  "source": "excel",
  "timestamp": "2025-11-27T10:30:00Z"
}
```

Response:
```json
{
  "success": true,
  "snapshot_id": 123,
  "metrics": {
    "total": 156,
    "passed": 120,
    "failed": 15,
    "pass_rate": 88.24
  }
}
```

### 6.2 Dashboard Metrics API

**GET /api/dashboard/metrics**

Response:
```json
{
  "snapshot_id": 123,
  "collected_at": "2025-11-27T10:30:00Z",
  "total": 156,
  "active": 150,
  "passed": 120,
  "failed": 15,
  "blocked": 5,
  "pending": 10,
  "deleted": 6,
  "pass_rate": 88.24,
  "completion_rate": 93.33,
  "by_assignee": [
    { "assignee": "Nguyen Van A", "passed": 50, "failed": 5 },
    { "assignee": "Tran Thi B", "passed": 40, "failed": 3 }
  ]
}
```

### 6.3 Trends API

**GET /api/dashboard/trends?days=7**

Response:
```json
{
  "trends": [
    {
      "date": "2025-11-20",
      "total": 150,
      "passed": 100,
      "failed": 20,
      "pass_rate": 83.33
    },
    {
      "date": "2025-11-21",
      "total": 152,
      "passed": 110,
      "failed": 18,
      "pass_rate": 85.94
    }
  ]
}
```

### 6.4 Settings API

**PUT /api/settings/auto-update**

Request:
```json
{
  "enabled": true,
  "interval": 30,
  "source": "excel",
  "file_path": "/path/to/testcases.xlsx"
}
```

Response:
```json
{
  "success": true,
  "settings": {
    "auto_update_enabled": true,
    "collection_interval": 30,
    "next_collection_at": "2025-11-27T11:00:00Z"
  }
}
```

---

## 7. DATA FLOW

### 7.1 Auto-Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Scheduler Triggers (Every 30 minutes)                   │
│                                                                  │
│  Bull Queue → Creates Job → Worker Process                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Data Collection                                          │
│                                                                  │
│  Worker reads Excel/GSheet                                       │
│  → Parse from Row 9 onwards                                      │
│  → Extract columns A-P                                           │
│  → Filter valid rows (has test content)                          │
│  → Normalize status (○→PASSED, ▲→FAILED, etc.)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Data Validation & Transformation                        │
│                                                                  │
│  • Check required fields                                         │
│  • Validate date formats                                         │
│  • Calculate file hash (detect changes)                          │
│  • Add metadata (collected_at, source)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: API Push                                                 │
│                                                                  │
│  POST /api/testcases/sync                                        │
│  → Create snapshot record                                        │
│  → Bulk insert testcases                                         │
│  → Calculate metrics                                             │
│  → Check alerts                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Database Storage                                         │
│                                                                  │
│  Transaction:                                                    │
│    1. Insert snapshot                                            │
│    2. Insert testcases (bulk)                                    │
│    3. Insert metrics                                             │
│    4. Insert alerts (if any)                                     │
│    5. Update settings.last_collection_at                         │
│    6. Commit                                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Frontend Update                                          │
│                                                                  │
│  Dashboard polls /api/dashboard/metrics every 1 minute           │
│  → Updates charts & metrics                                      │
│  → Shows notifications if alerts exist                           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Manual Trigger Flow

```
User clicks "Refresh Now" 
  → Frontend: POST /api/settings/manual-trigger
  → Backend: Queue.add('collect-data', { priority: HIGH })
  → Worker: Immediate execution
  → Same flow as auto-update
  → Frontend: Shows loading spinner until complete
```

---

## 8. AUTO-UPDATE MECHANISM

### 8.1 Implementation với Bull Queue

```typescript
// scheduler.service.ts
class SchedulerService {
  async enableAutoUpdate(config: AutoUpdateConfig) {
    // Remove existing jobs
    await this.disableAutoUpdate();
    
    // Create new repeatable job
    await this.queue.add(
      'collect-data',
      {
        source: config.source,
        filePath: config.filePath,
        sheetId: config.sheetId,
        sheetName: config.sheetName
      },
      {
        repeat: {
          every: config.interval * 60 * 1000, // Convert minutes to ms
          immediately: true // Run immediately on enable
        },
        jobId: 'auto-update-job', // Fixed ID for easy removal
        removeOnComplete: {
          count: 20 // Keep last 20 completed jobs
        },
        removeOnFail: {
          count: 50 // Keep last 50 failed jobs for debugging
        }
      }
    );
    
    // Update settings in DB
    await db.settings.update({
      where: { id: 1 },
      data: {
        auto_update_enabled: true,
        collection_interval: config.interval,
        source_type: config.source,
        source_path: config.filePath,
        spreadsheet_id: config.sheetId,
        sheet_name: config.sheetName,
        updated_at: new Date()
      }
    });
    
    console.log(`Auto-update enabled: every ${config.interval} minutes`);
  }
  
  async disableAutoUpdate() {
    // Remove repeatable job
    await this.queue.removeRepeatable('collect-data', {
      every: '*/30 * * * *' // Cron expression
    });
    
    // Update settings
    await db.settings.update({
      where: { id: 1 },
      data: {
        auto_update_enabled: false,
        updated_at: new Date()
      }
    });
    
    console.log('Auto-update disabled');
  }
  
  async updateInterval(newIntervalMinutes: number) {
    const currentSettings = await db.settings.findFirst();
    
    // Re-enable with new interval
    await this.enableAutoUpdate({
      interval: newIntervalMinutes,
      source: currentSettings.source_type,
      filePath: currentSettings.source_path,
      sheetId: currentSettings.spreadsheet_id,
      sheetName: currentSettings.sheet_name
    });
  }
}
```

### 8.2 Cron Expression cho các Interval phổ biến

```javascript
const intervalToCron = {
  5: '*/5 * * * *',   // Every 5 minutes
  15: '*/15 * * * *',  // Every 15 minutes
  30: '*/30 * * * *',  // Every 30 minutes
  60: '0 * * * *',     // Every hour
  120: '0 */2 * * *',  // Every 2 hours
  1440: '0 0 * * *'    // Daily at midnight
};
```

### 8.3 Error Handling & Retry

```typescript
// Worker error handling
this.queue.process('collect-data', async (job) => {
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Job ${job.id}] Attempt ${attempt}/${maxRetries}`);
      
      const data = await this.collector.collect(job.data);
      await this.collector.pushToAPI(data);
      
      return { success: true, attempts: attempt };
    } catch (error) {
      console.error(`[Job ${job.id}] Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Final attempt failed - send alert
        await this.sendAlert({
          type: 'COLLECTION_FAILED',
          severity: 'CRITICAL',
          message: `Data collection failed after ${maxRetries} attempts`,
          details: { error: error.message, jobId: job.id }
        });
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
});
```

---

## 9. XỬ LÝ THAY ĐỔI CẤU TRÚC FILE

### 9.1 Schema Detection

```typescript
class SchemaDetector {
  async detectSchema(filePath: string): Promise<SchemaVersion> {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    
    // Read header row (row 8)
    const headerRow = XLSX.utils.sheet_to_json(sheet, { 
      range: 7,
      header: 1 
    })[0];
    
    // Calculate schema hash
    const schemaHash = crypto
      .createHash('md5')
      .update(JSON.stringify(headerRow))
      .digest('hex');
    
    // Check if schema exists in DB
    const existingSchema = await db.schemaMigration.findFirst({
      where: { schema_hash: schemaHash }
    });
    
    if (existingSchema) {
      return existingSchema.version;
    }
    
    // New schema detected
    const newVersion = await this.createNewSchemaVersion(headerRow, schemaHash);
    
    // Send alert
    await this.sendAlert({
      type: 'SCHEMA_CHANGED',
      severity: 'WARNING',
      message: 'File structure has changed. Please review column mappings.',
      details: { 
        old_version: existingSchema?.version,
        new_version: newVersion,
        columns: headerRow 
      }
    });
    
    return newVersion;
  }
  
  async createNewSchemaVersion(columns: string[], hash: string) {
    // Create column mapping
    const mapping = this.autoMapColumns(columns);
    
    const schema = await db.schemaMigration.create({
      data: {
        schema_hash: hash,
        version: Date.now(), // Use timestamp as version
        columns: JSON.stringify(mapping),
        applied_at: new Date()
      }
    });
    
    return schema.version;
  }
  
  autoMapColumns(columns: string[]): ColumnMapping {
    // Smart mapping based on keywords
    const mapping: ColumnMapping = {};
    
    columns.forEach((col, index) => {
      const normalized = col.toLowerCase().trim();
      
      if (normalized.includes('通番') || normalized.includes('id')) {
        mapping.test_id = index;
      } else if (normalized.includes('概要') || normalized.includes('summary')) {
        mapping.summary = index;
      } else if (normalized.includes('結果') || normalized.includes('status')) {
        mapping.status = index;
      } else if (normalized.includes('確認者') || normalized.includes('assignee')) {
        mapping.assignee = index;
      }
      // ... more mappings
    });
    
    return mapping;
  }
}
```

### 9.2 Column Mapping Strategy

```typescript
interface ColumnMapping {
  test_id: number;      // Column A (0)
  summary: number;      // Column B (1)
  function_name: number; // Column C (2)
  status: number;       // Column I (8)
  assignee: number;     // Column N (13)
  // ... more fields
}

// Use mapping when parsing
class DataParser {
  parse(sheet: WorkSheet, mapping: ColumnMapping): TestCase[] {
    const rows = XLSX.utils.sheet_to_json(sheet, { 
      range: 8,
      header: 1 
    });
    
    return rows.map((row: any[]) => ({
      test_id: row[mapping.test_id],
      summary: row[mapping.summary],
      function_name: row[mapping.function_name],
      status: this.normalizeStatus(row[mapping.status]),
      assignee: row[mapping.assignee],
      // ...
    }));
  }
}
```

### 9.3 Migration Strategy

```typescript
// Khi detect schema mới
async handleSchemaChange(newSchema: SchemaVersion) {
  // 1. Pause auto-update
  await this.scheduler.disableAutoUpdate();
  
  // 2. Send notification to admin
  await this.notifyAdmin({
    type: 'SCHEMA_CHANGE_DETECTED',
    message: 'File structure changed. Auto-update paused.',
    action_required: 'Review and approve new column mapping'
  });
  
  // 3. Create mapping review UI
  // Admin reviews suggested mapping in dashboard
  // Admin can adjust mapping if auto-detection is wrong
  
  // 4. After admin approval
  await this.applyNewSchema(newSchema);
  
  // 5. Resume auto-update
  await this.scheduler.enableAutoUpdate(currentSettings);
}
```

---

## 10. TECHNOLOGY STACK

### 10.1 Recommended Stack

#### **Option 1: Node.js Full Stack (Recommended)**

```
Frontend:
  - React 18 + TypeScript
  - Vite (build tool)
  - Zustand (state management)
  - React Query (data fetching)
  - Recharts (charts)
  - Tailwind CSS + Shadcn-UI
  - Axios

Backend:
  - Node.js 20+
  - Express.js / NestJS
  - TypeScript
  - Prisma ORM
  - Bull (job queue)
  - Zod (validation)

Data Collector:
  - Node.js worker
  - xlsx (Excel parsing)
  - google-spreadsheet (GSheet API)
  - node-cron (scheduling)

Database:
  - PostgreSQL 15+ (main DB)
  - Redis 7+ (queue & cache)

Deployment:
  - Docker + Docker Compose
  - PM2 (process manager)
  - Nginx (reverse proxy)
```

#### **Option 2: Python Backend + React Frontend**

```
Frontend: (Same as Option 1)

Backend:
  - Python 3.11+
  - FastAPI
  - SQLAlchemy ORM
  - Celery (task queue)
  - Pydantic (validation)

Data Collector:
  - Python worker
  - openpyxl / pandas (Excel)
  - gspread (GSheet API)
  - APScheduler

Database: (Same as Option 1)

Deployment:
  - Docker + Docker Compose
  - Gunicorn/Uvicorn
  - Nginx
```

### 10.2 Development Tools

```
Version Control:
  - Git + GitHub/GitLab

CI/CD:
  - GitHub Actions / GitLab CI
  - Docker
  - Jest/Vitest (testing)

Monitoring:
  - Winston/Pino (logging)
  - Prometheus + Grafana (metrics)
  - Sentry (error tracking)

Documentation:
  - Swagger/OpenAPI (API docs)
  - Storybook (UI components)
```

### 10.3 Package Dependencies (Node.js)

```json
// Backend package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "bull": "^4.11.5",
    "redis": "^4.6.11",
    "xlsx": "^0.18.5",
    "google-spreadsheet": "^4.1.1",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}

// Frontend package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.6"
  }
}
```

---

## 11. UI/UX DESIGN

### 11.1 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Test Dashboard  │  │ Auto-Update  │  │  Last Update │      │
│  │                 │  │  ⚙️ ON       │  │  10:30 AM    │      │
│  └─────────────────┘  │  📅 30 min   │  │  🔄 Refresh  │      │
│                       └──────────────┘  └──────────────┘      │
├────────────────────────────────────────────────────────────────┤
│  METRICS CARDS                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   📋     │  │   ✅     │  │   ❌     │  │   📊     │       │
│  │  Total   │  │  Passed  │  │  Failed  │  │ Progress │       │
│  │   156    │  │   120    │  │    15    │  │   90%    │       │
│  │          │  │  76.9%   │  │   9.6%   │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├────────────────────────────────────────────────────────────────┤
│  CHARTS SECTION                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  Status Distribution    │  │  Trend (7 days)         │     │
│  │  ┌───────────────────┐  │  │  ┌──────────────────┐  │     │
│  │  │    Pie Chart      │  │  │  │   Line Chart     │  │     │
│  │  │   (Passed/Failed) │  │  │  │  (Pass Rate %)   │  │     │
│  │  └───────────────────┘  │  │  └──────────────────┘  │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Daily Progress (Bar Chart)                             │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  Stacked bars: Passed | Failed | Pending          │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────┤
│  TEST CASE TABLE                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID │ Summary │ Status │ Assignee │ Date │ Bug Ticket │  │  │
│  │────┼─────────┼────────┼──────────┼──────┼─────────────┤  │  │
│  │ 1  │ Login   │   ✅   │ Nguyen A │11/25 │    #123     │  │  │
│  │ 2  │ Logout  │   ❌   │ Tran B   │11/26 │    #124     │  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  [Show more] [Filter] [Export CSV]                             │
└────────────────────────────────────────────────────────────────┘
```

### 11.2 Settings Panel

```
┌────────────────────────────────────────────────────┐
│  AUTO-UPDATE SETTINGS                              │
│                                                    │
│  ☑️ Enable Auto-Update                            │
│                                                    │
│  Collection Interval:                              │
│  ○ 15 minutes                                      │
│  ● 30 minutes (recommended)                        │
│  ○ 1 hour                                          │
│  ○ Custom: [___] minutes                           │
│                                                    │
│  Data Source:                                      │
│  ● Excel File                                      │
│    📁 Path: /data/testcases.xlsx                  │
│    [Browse...]                                     │
│                                                    │
│  ○ Google Sheet                                    │
│    Sheet ID: [________________________]            │
│    Sheet Name: [________________________]          │
│                                                    │
│  Next Collection: 11:00 AM (in 30 minutes)         │
│                                                    │
│  [Save Settings]  [Manual Trigger Now]             │
└────────────────────────────────────────────────────┘
```

### 11.3 Color Scheme

```
Status Colors:
  - Passed (✅): #4caf50 (green)
  - Failed (❌): #f44336 (red)
  - Blocked (⚠️): #ff9800 (orange)
  - Pending (⏳): #9e9e9e (gray)
  - Deleted (🗑️): #757575 (dark gray)

Chart Colors:
  - Primary: #1976d2 (blue)
  - Secondary: #7b1fa2 (purple)
  - Success: #388e3c (dark green)
  - Warning: #f57c00 (dark orange)
  - Error: #d32f2f (dark red)

Background:
  - Main BG: #f5f5f5 (light gray)
  - Card BG: #ffffff (white)
  - Border: #e0e0e0 (gray)
```

### 11.4 Responsive Design

```
Desktop (> 1200px):
  - 4 metric cards in a row
  - Charts side-by-side (2 columns)
  - Full table with all columns

Tablet (768px - 1200px):
  - 2 metric cards per row
  - Charts stacked vertically
  - Table with essential columns only

Mobile (< 768px):
  - 1 metric card per row
  - Charts full-width
  - Simplified table with drill-down
```

---

## 12. RISK MANAGEMENT

### 12.1 Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| **File Excel bị corrupt** | HIGH | - Validate file trước khi parse<br>- Retry mechanism (3 attempts)<br>- Alert notification<br>- Keep last known good data |
| **Google Sheet API limit** | MEDIUM | - Cache responses<br>- Rate limiting<br>- Batch requests<br>- Use service account with higher quota |
| **Network failure** | MEDIUM | - Exponential backoff retry<br>- Queue system với persistence<br>- Local file fallback |
| **File structure thay đổi** | HIGH | - Schema detection & versioning<br>- Auto-mapping với review<br>- Pause auto-update khi detect change<br>- Admin approval workflow |
| **Database connection loss** | HIGH | - Connection pooling<br>- Auto-reconnect<br>- Circuit breaker pattern<br>- Write-ahead logging |
| **Concurrent access conflicts** | LOW | - Row-level locking<br>- Transaction isolation<br>- Optimistic locking |
| **Large file performance** | MEDIUM | - Stream processing<br>- Batch insert (1000 rows/batch)<br>- Index optimization<br>- Pagination |
| **Data inconsistency** | MEDIUM | - Transaction wrapping<br>- Validation at multiple layers<br>- Audit logs<br>- Rollback capability |
| **Worker process crash** | MEDIUM | - PM2 auto-restart<br>- Health checks<br>- Dead letter queue<br>- Alert on failure |
| **UI không responsive** | LOW | - Lazy loading<br>- Virtual scrolling cho table<br>- Chart data aggregation |
| **Timezone issues** | LOW | - Store all timestamps in UTC<br>- Convert to user timezone on display |
| **Data privacy** | MEDIUM | - Authentication & authorization<br>- Role-based access control<br>- Encrypt sensitive data<br>- Audit logs |

### 12.2 Monitoring & Alerting

```typescript
// Alert conditions
const ALERT_RULES = {
  HIGH_FAIL_RATE: {
    condition: (metrics) => metrics.pass_rate < 70,
    severity: 'WARNING',
    message: 'Pass rate below 70%'
  },
  COLLECTION_FAILED: {
    condition: (job) => job.failedReason !== null,
    severity: 'CRITICAL',
    message: 'Data collection failed'
  },
  DELAYED_EXECUTION: {
    condition: (testcase) => {
      const planned = new Date(testcase.planned_exec_date);
      const now = new Date();
      return now - planned > 3 * 24 * 60 * 60 * 1000; // 3 days
    },
    severity: 'WARNING',
    message: 'Test execution delayed by 3+ days'
  },
  SCHEMA_CHANGED: {
    condition: (schemaHash) => schemaHash !== lastKnownHash,
    severity: 'WARNING',
    message: 'File structure changed'
  },
  NO_RECENT_DATA: {
    condition: (lastUpdate) => {
      const now = new Date();
      return now - lastUpdate > 2 * 60 * 60 * 1000; // 2 hours
    },
    severity: 'CRITICAL',
    message: 'No data collected in 2+ hours'
  }
};
```

### 12.3 Backup Strategy

```
Daily Backups:
  - Database: Full backup at 2 AM
  - Retention: 30 days
  - Storage: AWS S3 / Google Cloud Storage

Snapshot History:
  - Keep all snapshots for 90 days
  - Archive older snapshots to cold storage
  - Compress data after 30 days

File Versioning:
  - Keep last 10 versions of Excel file
  - Store file hash with each snapshot
  - Enable "revert to previous version" feature
```

---

## 13. IMPLEMENTATION ROADMAP

### Phase 1: Core Infrastructure (Week 1-2)

**Week 1:**
- ✅ Setup project structure
- ✅ Database design & setup (PostgreSQL + Redis)
- ✅ Backend API scaffold (Express + Prisma)
- ✅ Basic Excel parser implementation
- ✅ Data model & validation

**Week 2:**
- ✅ API endpoints implementation
- ✅ Worker process setup
- ✅ Bull queue integration
- ✅ Basic scheduler (cron)
- ✅ Unit tests

**Deliverable:** Backend API với basic data collection

---

### Phase 2: Dashboard UI (Week 3-4)

**Week 3:**
- ✅ Frontend setup (React + Vite)
- ✅ Dashboard layout & routing
- ✅ Metrics cards component
- ✅ API integration layer
- ✅ State management (Zustand)

**Week 4:**
- ✅ Chart components (Recharts)
- ✅ Test case table with filters
- ✅ Settings panel
- ✅ Auto-update toggle UI
- ✅ Responsive design

**Deliverable:** Functional dashboard với realtime data

---

### Phase 3: Advanced Features (Week 5-6)

**Week 5:**
- ✅ Google Sheets integration
- ✅ Historical trends & comparison
- ✅ Alert system
- ✅ Schema detection & migration
- ✅ Error handling & retry logic

**Week 6:**
- ✅ Performance optimization
- ✅ Advanced filtering & search
- ✅ Export functionality (CSV/PDF)
- ✅ Admin panel
- ✅ Documentation

**Deliverable:** Production-ready system

---

### Phase 4: Testing & Deployment (Week 7-8)

**Week 7:**
- ✅ Integration testing
- ✅ Load testing
- ✅ Security audit
- ✅ Bug fixes
- ✅ User acceptance testing

**Week 8:**
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ✅ Production deployment
- ✅ Monitoring setup
- ✅ User training & handover

**Deliverable:** Deployed system with monitoring

---

## 14. DEPLOYMENT GUIDE

### 14.1 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testcase_dashboard
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (Queue & Cache)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/testcase_dashboard
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./data:/app/data  # For Excel files
    restart: unless-stopped

  # Worker (Data Collector)
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/testcase_dashboard
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  # Frontend Dashboard
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 14.2 Environment Variables

```bash
# .env
# Database
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://admin:${DB_PASSWORD}@localhost:5432/testcase_dashboard

# Redis
REDIS_URL=redis://localhost:6379

# API
API_PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret

# Google Sheets (Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# Auto-update defaults
DEFAULT_INTERVAL=30
DEFAULT_SOURCE=excel

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info
```

### 14.3 Production Checklist

```
Before Deploy:
  ☐ Environment variables configured
  ☐ Database migrations run
  ☐ SSL certificates installed
  ☐ Firewall rules configured
  ☐ Backup strategy in place
  ☐ Monitoring setup (Prometheus/Grafana)
  ☐ Error tracking (Sentry)
  ☐ Load testing completed
  ☐ Security audit passed
  ☐ Documentation updated

After Deploy:
  ☐ Health checks passing
  ☐ Logs flowing correctly
  ☐ Metrics collecting
  ☐ Alerts configured
  ☐ Backup running
  ☐ Performance baseline established
  ☐ User training completed
```

---

## 15. API TESTING EXAMPLES

### 15.1 cURL Examples

```bash
# Health check
curl http://localhost:3000/api/health

# Get current metrics
curl http://localhost:3000/api/dashboard/metrics

# Get trends (last 7 days)
curl http://localhost:3000/api/dashboard/trends?days=7

# Enable auto-update
curl -X PUT http://localhost:3000/api/settings/auto-update \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "interval": 30,
    "source": "excel",
    "file_path": "/data/testcases.xlsx"
  }'

# Manual trigger
curl -X POST http://localhost:3000/api/settings/manual-trigger \
  -H "Content-Type: application/json"

# Sync data (from worker)
curl -X POST http://localhost:3000/api/testcases/sync \
  -H "Content-Type: application/json" \
  -d '{
    "testcases": [...],
    "source": "excel",
    "timestamp": "2025-11-27T10:30:00Z"
  }'
```

---

## 16. MAINTENANCE & OPERATIONS

### 16.1 Regular Tasks

```
Daily:
  - Monitor error logs
  - Check alert notifications
  - Verify auto-update running
  - Review failed jobs in queue

Weekly:
  - Review performance metrics
  - Check database size
  - Clean old snapshots (>90 days)
  - Update dependencies

Monthly:
  - Database optimization (VACUUM, REINDEX)
  - Security patches
  - Backup verification
  - Capacity planning
```

### 16.2 Troubleshooting Guide

```
Issue: Auto-update not running
  → Check Bull queue status
  → Verify Redis connection
  → Check worker process logs
  → Ensure settings.auto_update_enabled = true

Issue: Data not appearing in dashboard
  → Check last snapshot timestamp
  → Verify API endpoints responding
  → Check frontend console errors
  → Verify database connection

Issue: File parsing errors
  → Validate file format
  → Check schema version
  → Review column mappings
  → Enable debug logging

Issue: Performance slow
  → Check database indexes
  → Review query execution plans
  → Monitor Redis cache hit rate
  → Consider pagination/lazy loading
```

---

## SUMMARY

Hệ thống Test Case Dashboard này được thiết kế để:

✅ **Không làm gián đoạn workflow hiện tại** - Team tiếp tục làm việc trên Excel/Google Sheet như bình thường

✅ **Thu thập dữ liệu tự động** - Scheduler với Bull Queue, interval tùy chỉnh, retry logic

✅ **Lưu trữ lịch sử đầy đủ** - Snapshot-based architecture, metrics tracking, trends analysis

✅ **Dashboard trực quan** - React với Recharts, metrics cards, real-time updates

✅ **Xử lý thay đổi linh hoạt** - Schema detection, auto-mapping, migration workflow

✅ **Ổn định & scalable** - PostgreSQL + Redis, error handling, monitoring, alerts

✅ **Dễ deploy** - Docker Compose, environment variables, CI/CD ready

### Bắt đầu Development:

```bash
# 1. Clone và setup
git clone <repo>
cd testcase-dashboard
npm install

# 2. Setup database
docker-compose up -d postgres redis
npx prisma migrate dev

# 3. Start backend
cd backend
npm run dev

# 4. Start worker
npm run worker

# 5. Start frontend
cd frontend
npm run dev
```

Tài liệu này cung cấp đầy đủ thông tin để bắt đầu phát triển ngay. Nếu có câu hỏi hoặc cần làm rõ bất kỳ phần nào, vui lòng cho tôi biết!
