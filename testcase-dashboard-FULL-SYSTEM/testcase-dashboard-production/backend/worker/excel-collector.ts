// worker/excel-collector.ts
import XLSX from 'xlsx';
import crypto from 'crypto';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestCaseRaw {
  test_id: string;
  summary: string;
  function_name: string;
  item_name: string;
  precondition: string;
  test_content: string;
  expected_result: string;
  notes: string;
  status: string;
  planned_exec_date: string;
  planned_review_date: string;
  actual_exec_date: string;
  actual_review_date: string;
  assignee: string;
  bug_ticket: string;
  remarks: string;
}

interface TestCase {
  testId: string;
  summary: string;
  functionName: string;
  itemName: string;
  precondition: string;
  testContent: string;
  expectedResult: string;
  notes: string;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'DELETED';
  plannedExecDate?: Date;
  plannedReviewDate?: Date;
  actualExecDate?: Date;
  actualReviewDate?: Date;
  assignee: string;
  bugTicket: string;
  remarks: string;
  collectedAt: Date;
}

export class ExcelCollector {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.API_URL || 'http://localhost:3000';
  }

  /**
   * Collect data from Excel file
   */
  async collectFromExcel(filePath: string, sheetName?: string): Promise<void> {
    console.log(`[ExcelCollector] Starting collection from: ${filePath}`);
    
    try {
      // 1. Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheet = sheetName 
        ? workbook.Sheets[sheetName] 
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error(`Sheet not found: ${sheetName || workbook.SheetNames[0]}`);
      }

      // 2. Calculate file hash for change detection
      const fileHash = await this.calculateFileHash(filePath);

      // 3. Parse data starting from row 9 (index 8)
      const rawData = XLSX.utils.sheet_to_json<TestCaseRaw>(sheet, {
        range: 8, // Start from row 9 (0-indexed)
        header: [
          'test_id',
          'summary',
          'function_name',
          'item_name',
          'precondition',
          'test_content',
          'expected_result',
          'notes',
          'status',
          'planned_exec_date',
          'planned_review_date',
          'actual_exec_date',
          'actual_review_date',
          'assignee',
          'bug_ticket',
          'remarks'
        ],
        defval: '' // Default value for empty cells
      });

      console.log(`[ExcelCollector] Raw data rows: ${rawData.length}`);

      // 4. Filter valid rows (must have test_content)
      const validData = rawData.filter(row => 
        row.test_content && row.test_content.toString().trim() !== ''
      );

      console.log(`[ExcelCollector] Valid data rows: ${validData.length}`);

      // 5. Transform to standard format
      const transformedData = validData.map(row => this.transformTestCase(row));

      // 6. Push to API
      await this.pushToAPI({
        testcases: transformedData,
        source: 'excel',
        timestamp: new Date().toISOString(),
        fileHash
      });

      console.log(`[ExcelCollector] Successfully collected ${transformedData.length} test cases`);
    } catch (error) {
      console.error('[ExcelCollector] Error:', error);
      throw error;
    }
  }

  /**
   * Transform raw Excel row to TestCase format
   */
  private transformTestCase(row: TestCaseRaw): TestCase {
    return {
      testId: this.cleanString(row.test_id),
      summary: this.cleanString(row.summary),
      functionName: this.cleanString(row.function_name),
      itemName: this.cleanString(row.item_name),
      precondition: this.cleanString(row.precondition),
      testContent: this.cleanString(row.test_content),
      expectedResult: this.cleanString(row.expected_result),
      notes: this.cleanString(row.notes),
      status: this.normalizeStatus(row.status),
      plannedExecDate: this.parseDate(row.planned_exec_date),
      plannedReviewDate: this.parseDate(row.planned_review_date),
      actualExecDate: this.parseDate(row.actual_exec_date),
      actualReviewDate: this.parseDate(row.actual_review_date),
      assignee: this.cleanString(row.assignee),
      bugTicket: this.cleanString(row.bug_ticket),
      remarks: this.cleanString(row.remarks),
      collectedAt: new Date()
    };
  }

  /**
   * Normalize status from Japanese markers to English enum
   */
  private normalizeStatus(status: string): 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'DELETED' {
    const statusStr = String(status || '').trim();
    
    const statusMap: Record<string, 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'DELETED'> = {
      '○': 'PASSED',
      'O': 'PASSED',
      '▲': 'FAILED',
      'NG': 'FAILED',
      '×': 'BLOCKED',
      'X': 'BLOCKED',
      '削除': 'DELETED',
      'DELETED': 'DELETED',
      '': 'PENDING'
    };

    return statusMap[statusStr] || 'PENDING';
  }

  /**
   * Parse date from Excel format (number or string)
   */
  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;

    // If it's already a Date
    if (value instanceof Date) return value;

    // If it's an Excel serial number
    if (typeof value === 'number') {
      // Excel date serial: days since 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
      return date;
    }

    // If it's a string, try to parse
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }

    return undefined;
  }

  /**
   * Clean string values
   */
  private cleanString(value: any): string {
    if (!value) return '';
    return String(value).trim();
  }

  /**
   * Calculate MD5 hash of file for change detection
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    return hash;
  }

  /**
   * Push collected data to API
   */
  private async pushToAPI(data: {
    testcases: TestCase[];
    source: string;
    timestamp: string;
    fileHash: string;
  }): Promise<void> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/api/testcases/sync`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );

      console.log('[ExcelCollector] API response:', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[ExcelCollector] API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Validate Excel file structure
   */
  async validateFileStructure(filePath: string, sheetName?: string): Promise<boolean> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = sheetName 
        ? workbook.Sheets[sheetName] 
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) return false;

      // Check if row 8 has headers
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      if (range.e.r < 8) return false; // Must have at least 8 rows

      // Try to read one row
      const testData = XLSX.utils.sheet_to_json(sheet, {
        range: 8,
        header: 1
      });

      return testData.length > 0;
    } catch (error) {
      console.error('[ExcelCollector] Validation error:', error);
      return false;
    }
  }
}

// Example usage
if (require.main === module) {
  const collector = new ExcelCollector();
  const filePath = process.argv[2] || '/data/testcases.xlsx';
  const sheetName = process.argv[3];

  collector.collectFromExcel(filePath, sheetName)
    .then(() => {
      console.log('Collection completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Collection failed:', error);
      process.exit(1);
    });
}
