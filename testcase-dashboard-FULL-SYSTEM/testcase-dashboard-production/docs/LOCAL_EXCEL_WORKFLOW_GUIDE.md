# 📝 HƯỚNG DẪN: Làm việc với File Excel Local

## ❓ Câu hỏi thường gặp

### "Member sử dụng local Excel thì phải add-ins tool gì không?"

**TRẢ LỜI: KHÔNG! Không cần add-ins, không cần tool đặc biệt!**

Team member làm việc hoàn toàn bình thường với Excel như hiện tại. System được thiết kế để **ĐỌC** file Excel, không yêu cầu Excel phải có plugin hay add-in gì cả.

---

## 🔄 4 Phương án Làm việc

### **Phương án 1: Shared Network Drive** ⭐ (RECOMMENDED)

#### Cách hoạt động:
```
┌─────────────────────────────────────────────────────────────┐
│ Member A's Computer                                          │
│ ┌──────────────────────────────────────────────┐            │
│ │ Excel đang mở file:                          │            │
│ │ \\server\testcases\Toho3_testcases.xlsx     │            │
│ │                                              │            │
│ │ Member edit → Save (Ctrl+S)                 │            │
│ └──────────────────────────────────────────────┘            │
└──────────────────────┬──────────────────────────────────────┘
                       │ Save to network
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Network File Server                                          │
│ Path: \\server\testcases\Toho3_testcases.xlsx              │
│                                                              │
│ [File được lưu ở đây, ai cũng access được]                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Worker reads every 30 min
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Worker Process (Python/Node.js)                             │
│ 1. Đọc file từ \\server\testcases\Toho3_testcases.xlsx    │
│ 2. Parse data từ row 9                                      │
│ 3. Push lên API                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
│ Hiển thị data realtime                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Setup cho IT Admin:

**Bước 1: Tạo Network Share**
```bash
# Windows Server
1. Tạo folder: C:\TestCases
2. Right-click → Properties → Sharing → Advanced Sharing
3. Share name: TestCases
4. Permissions: Everyone - Read/Write
5. Path sẽ là: \\SERVER-NAME\TestCases\
```

**Bước 2: Team member truy cập**
```
1. Mở Excel
2. File → Open → Network → \\SERVER-NAME\TestCases\Toho3_testcases.xlsx
3. Làm việc bình thường
4. Save khi xong (Ctrl+S)
```

**Bước 3: Config Worker**
```javascript
// worker config
{
  source: 'excel',
  filePath: '\\\\SERVER-NAME\\TestCases\\Toho3_testcases.xlsx'
}
```

**Bước 4: Done!**
- Worker tự động đọc file mỗi 30 phút
- Dashboard tự động update

#### Ưu điểm:
✅ **Zero change** cho workflow hiện tại  
✅ Không cần install gì cả  
✅ Real-time collaboration (nhưng Excel vẫn lock file khi edit)  
✅ Centralized backup dễ dàng  
✅ IT control được access permissions  

#### Nhược điểm:
❌ Cần network connection  
❌ Chỉ 1 người edit cùng lúc (Excel limitation)  
❌ Cần setup network share  

---

### **Phương án 2: Google Sheets** ⭐ (MODERN APPROACH)

#### Cách hoạt động:
```
┌─────────────────────────────────────────────────────────────┐
│ Member A's Browser                                           │
│ ┌──────────────────────────────────────────────┐            │
│ │ Google Sheets                                │            │
│ │ https://docs.google.com/spreadsheets/...    │            │
│ │                                              │            │
│ │ Member edit → Auto-saved                    │            │
│ └──────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Member B's Browser (cùng lúc)                                │
│ ┌──────────────────────────────────────────────┐            │
│ │ Google Sheets (same file)                   │            │
│ │ Thấy Member A đang edit ô nào realtime     │            │
│ └──────────────────────────────────────────────┘            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Cloud                                                 │
│ File được lưu tự động, version history                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ Worker calls API every 30 min
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Worker Process                                               │
│ 1. Gọi Google Sheets API                                    │
│ 2. Lấy data từ sheet                                        │
│ 3. Push lên API                                             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
                    Dashboard
```

#### Setup:

**Bước 1: Upload Excel lên Google Sheets**
```
1. Mở Google Drive
2. Click New → File upload
3. Chọn Toho3_testcases.xlsx
4. Right-click file → Open with → Google Sheets
5. File sẽ được convert sang Google Sheets format
```

**Bước 2: Create Service Account**
```bash
# Google Cloud Console
1. Tạo project: https://console.cloud.google.com
2. Enable Google Sheets API
3. Create Service Account
4. Download JSON key file
5. Copy service account email: xxx@xxx.iam.gserviceaccount.com
```

**Bước 3: Share Sheet với Service Account**
```
1. Mở Google Sheet
2. Click Share
3. Paste service account email
4. Set permission: Editor hoặc Viewer (Viewer đủ)
5. Done
```

**Bước 4: Config Worker**
```javascript
// .env file
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

// worker config
{
  source: 'gsheet',
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',  // From URL
  sheetName: '②'  // Sheet name
}
```

**Bước 5: Code Implementation**
```typescript
// worker/gsheet-collector.ts
import { GoogleSpreadsheet } from 'google-spreadsheet';

async function collectFromGoogleSheet(spreadsheetId: string, sheetName: string) {
  // 1. Authenticate
  const doc = new GoogleSpreadsheet(spreadsheetId);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  });
  
  // 2. Load sheet
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[sheetName];
  
  // 3. Get rows (starting from row 9)
  const rows = await sheet.getRows({ offset: 8 });  // Skip first 8 rows
  
  // 4. Parse data
  const testCases = rows.map(row => ({
    testId: row['通番'],
    summary: row['概要'],
    status: normalizeStatus(row['結果']),
    assignee: row['確認者'],
    // ... more fields
  }));
  
  // 5. Push to API
  await pushToAPI(testCases);
}
```

#### Ưu điểm:
✅ **Multiple people edit cùng lúc** (real collaboration!)  
✅ Auto-save, không lo mất data  
✅ Version history built-in (ai edit gì, khi nào)  
✅ Access từ bất kỳ đâu (office, home, mobile)  
✅ Không cần network drive, không cần VPN  
✅ Free cho Google Workspace accounts  
✅ API rate limit cao (100 requests/100 seconds)  

#### Nhược điểm:
❌ Cần convert Excel sang Google Sheets (1 lần)  
❌ Cần setup Google Cloud project (1 lần)  
❌ Formulas có thể khác Excel một chút  

---

### **Phương án 3: Local + Manual Upload**

#### Cách hoạt động:
```
Member làm việc local → Khi xong → Upload qua Web UI → Dashboard update
```

#### Implementation:

**Thêm Upload endpoint:**
```typescript
// backend/routes/upload.ts
import multer from 'multer';
import { ExcelCollector } from '../worker/excel-collector';

const upload = multer({ 
  dest: '/tmp/uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files allowed'));
    }
  }
});

router.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const collector = new ExcelCollector();
    await collector.collectFromExcel(req.file.path);
    
    res.json({ success: true, message: 'File processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend Upload UI:**
```tsx
// frontend/src/components/UploadPanel.tsx
const UploadPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Upload successful!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-panel">
      <h3>Upload Test Case File</h3>
      <input 
        type="file" 
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload & Process'}
      </button>
    </div>
  );
};
```

#### Workflow:
```
1. Member edit Excel local
2. Save file
3. Mở Dashboard
4. Click "Upload File"
5. Chọn file Excel
6. Click "Upload"
7. Dashboard update sau vài giây
```

#### Ưu điểm:
✅ Work completely offline  
✅ Full Excel features (không bị convert)  
✅ Simple setup  

#### Nhược điểm:
❌ **Manual process** - phải nhớ upload  
❌ Không real-time  
❌ Khó track version  

---

### **Phương án 4: Dropbox/OneDrive Sync** ⭐ (BEST OF BOTH WORLDS)

#### Cách hoạt động:
```
Member edit local → Dropbox tự sync → Worker đọc synced folder → Dashboard update
```

#### Setup:

**Bước 1: Member setup Dropbox/OneDrive**
```
1. Install Dropbox hoặc OneDrive client
2. Đặt Excel file trong Dropbox folder:
   C:\Users\Username\Dropbox\TestCases\Toho3_testcases.xlsx
3. Dropbox tự động sync lên cloud
```

**Bước 2: Server setup Dropbox sync**
```bash
# Install Dropbox client trên server
# Hoặc mount Dropbox folder

# Path will be:
/mnt/dropbox/TestCases/Toho3_testcases.xlsx
```

**Bước 3: Config Worker**
```javascript
{
  source: 'excel',
  filePath: '/mnt/dropbox/TestCases/Toho3_testcases.xlsx'
}
```

**Alternative: Sử dụng Dropbox API**
```typescript
// worker/dropbox-collector.ts
import { Dropbox } from 'dropbox';

async function collectFromDropbox(filePath: string) {
  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });
  
  // Download file
  const response = await dbx.filesDownload({ path: filePath });
  const fileBlob = response.result.fileBinary;
  
  // Save temporarily
  fs.writeFileSync('/tmp/temp.xlsx', fileBlob);
  
  // Process
  await collector.collectFromExcel('/tmp/temp.xlsx');
}
```

#### Ưu điểm:
✅ Work offline (file local)  
✅ Tự động sync (không cần manual upload)  
✅ Version history (Dropbox/OneDrive có built-in)  
✅ Full Excel features  
✅ Member không cần làm gì thêm  

#### Nhược điểm:
❌ Cần Dropbox/OneDrive subscription  
❌ Sync delay (vài giây đến vài phút)  
❌ Conflict nếu nhiều người edit cùng lúc  

---

## 📊 So sánh các phương án

| Feature | Network Drive | Google Sheets | Manual Upload | Dropbox Sync |
|---------|--------------|---------------|---------------|--------------|
| **Zero workflow change** | ✅ | ⚠️ (convert once) | ❌ (manual) | ✅ |
| **Real-time sync** | ✅ | ✅ | ❌ | ⚠️ (delay) |
| **Multi-user edit** | ❌ (Excel lock) | ✅ | ❌ | ❌ (conflict) |
| **Work offline** | ❌ | ❌ | ✅ | ✅ |
| **Full Excel features** | ✅ | ⚠️ (most) | ✅ | ✅ |
| **Version history** | ⚠️ (manual) | ✅ | ❌ | ✅ |
| **Setup complexity** | Medium | High | Low | Medium |
| **Cost** | Free | Free | Free | $$ |
| **Recommended for** | Office team | Remote team | Simple case | Hybrid work |

---

## 🎯 Khuyến nghị

### Nếu team làm việc tại văn phòng:
→ **Phương án 1: Network Drive** - Simple, reliable, zero change

### Nếu team làm việc remote/hybrid:
→ **Phương án 2: Google Sheets** - Best collaboration, modern

### Nếu cần quick start và đơn giản:
→ **Phương án 3: Manual Upload** - Easy setup, good enough

### Nếu có budget cho Dropbox Business:
→ **Phương án 4: Dropbox Sync** - Best of both worlds

---

## 💡 Lưu ý quan trọng

### 1. Worker KHÔNG can thiệp vào file Excel
- Worker chỉ **ĐỌC** file
- Worker không write, không modify
- Worker không cần Excel được cài đặt
- Worker chỉ cần library để parse file (xlsx, openpyxl)

### 2. Member làm việc hoàn toàn bình thường
- Không cần install add-in
- Không cần plugin
- Không cần macro
- Chỉ cần Excel thông thường (hoặc Google Sheets)

### 3. File format không thay đổi
- Vẫn là file .xlsx bình thường
- Không có metadata đặc biệt
- Không có hidden sheets
- Chỉ là Excel file thuần túy

### 4. Security
- Worker access file với read-only permission (recommended)
- Nếu dùng Google Sheets, service account chỉ cần Viewer role
- Network share nên set read-only cho worker account

---

## 🔧 Code Example: Worker đọc file

```typescript
// Ví dụ: Worker đọc Excel file (không cần Excel installed)
import XLSX from 'xlsx';

function readExcelFile(filePath: string) {
  // 1. Đọc file binary
  const workbook = XLSX.readFile(filePath);
  
  // 2. Chọn sheet
  const sheet = workbook.Sheets['②'];
  
  // 3. Parse data từ row 9
  const data = XLSX.utils.sheet_to_json(sheet, {
    range: 8,  // Start from row 9 (0-indexed)
    header: ['test_id', 'summary', 'function', ...]
  });
  
  // 4. Xử lý data
  return data.filter(row => row.test_content);
}
```

**Thư viện parse Excel:**
- Node.js: `xlsx`, `exceljs`
- Python: `openpyxl`, `pandas`
- Không cần Excel installed trên server!

---

## ❓ FAQ

**Q: Member có cần cài gì không?**  
A: KHÔNG! Member chỉ cần Excel bình thường (hoặc Google Sheets)

**Q: File Excel có cần format đặc biệt không?**  
A: KHÔNG! File Excel bình thường, không cần macro, không cần add-in

**Q: Worker có modify file Excel không?**  
A: KHÔNG! Worker chỉ đọc, không bao giờ ghi vào file

**Q: Nếu member đang edit file, worker đọc có bị lỗi không?**  
A: Không, worker đọc được ngay cả khi Excel đang mở file

**Q: Có cần internet connection không?**  
A: Tùy phương án:
- Network Drive: Cần network local
- Google Sheets: Cần internet
- Manual Upload: Cần internet khi upload
- Dropbox Sync: Cần internet để sync

**Q: Phương án nào tốt nhất?**  
A: 
- Office team → Network Drive
- Remote team → Google Sheets
- Simple/quick start → Manual Upload
- Hybrid work → Dropbox Sync

---

**Kết luận:** Không cần add-ins hay tool đặc biệt! Member làm việc bình thường, system tự động collect data. 🎉
