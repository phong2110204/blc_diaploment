# 3.5. CHI TIẾT MÃ NGUỒN VÀ CÁC THUẬT TOÁN CHỨC NĂNG

## 3.5.1. Kiến Trúc Mã Nguồn Tổng Thể

Hệ thống được chia thành 3 tầng chính:

```
┌─────────────────────────────────────┐
│         FRONTEND (React 18)         │  Client Layer
│  - React Components                 │  - UI/UX
│  - State Management                 │  - User Interactions
│  - API Integration                  │
└────────────────┬────────────────────┘
                 │ HTTP/REST API
┌────────────────▼────────────────────┐
│       BACKEND (Node.js/Express)     │  Service Layer
│  - API Endpoints                    │  - Business Logic
│  - Data Processing                  │  - Smart Contract Interface
│  - User Authentication              │
└────────────────┬────────────────────┘
                 │ Web3/ethers.js
┌────────────────▼────────────────────┐
│    BLOCKCHAIN (Solidity/Ethereum)   │  Data Layer
│  - Smart Contracts                  │  - Data Storage
│  - Access Control                   │  - Transaction Verification
│  - State Management                 │
└─────────────────────────────────────┘
```

---

## 3.5.2. Tầng Smart Contracts (Blockchain)

### A. Hợp Đồng DiplomaManager

**Vị trí**: `blockchain/contracts/DiplomaManager.sol`

**Các Hàm Chính**:

#### 1. **issueDiploma()**
```solidity
Mục đích: Cấp văn bằng mới
Input:
  - ownerAddress: Địa chỉ người nhận
  - documentHash: Hash của tài liệu
  - documentType: Loại văn bằng
  - documentURI: Đường dẫn metadata

Thuật toán:
1. Kiểm tra quyền issuer của caller
2. Tạo Diploma struct mới
3. Lưu vào mapping diplomas
4. Emit event IssuedDiploma
5. Trả về transactionHash

Gas Cost: ~150,000 gas
```

#### 2. **verifyDiploma()**
```solidity
Mục đích: Xác minh tính xác thực của văn bằng
Input:
  - documentHash: Hash của tài liệu
  - isValid: Trạng thái xác minh

Thuật toán:
1. Kiểm tra quyền verifier của caller
2. Tìm diploma từ hash
3. Cập nhật trạng thái verified
4. Ghi lại người xác minh + timestamp
5. Emit event DiplomaVerified

Gas Cost: ~100,000 gas
```

#### 3. **grantPermission()**
```solidity
Mục đích: Cấp quyền chia sẻ tài liệu
Input:
  - documentHash: Hash của tài liệu
  - recipient: Người được cấp quyền
  - expiresAt: Thời gian hết hạn

Thuật toán:
1. Kiểm tra caller là owner
2. Kiểm tra expiration time hợp lệ
3. Lưu vào permissions mapping
4. Emit event PermissionGranted

Gas Cost: ~80,000 gas
```

#### 4. **revokePermission()**
```solidity
Mục đích: Thu hồi quyền chia sẻ
Input:
  - documentHash: Hash của tài liệu
  - recipient: Người bị thu hồi quyền

Thuật toán:
1. Kiểm tra caller là owner hoặc admin
2. Xóa từ permissions mapping
3. Emit event PermissionRevoked

Gas Cost: ~60,000 gas
```

---

## 3.5.3. Tầng Backend (Node.js/Express)

### A. Cấu Trúc Thư Mục
```
backend/
├── server.js              # Entry point
├── abi/
│   └── DiplomaManager_abi.json
├── data/
│   └── diploma_*.json     # Local storage
└── package.json
```

### B. API Endpoints và Thuật Toán

#### 1. **POST /api/documents/issue** - Cấp Văn Bằng

```
Thuật toán:
├── 1. Validate Input
│   ├── Kiểm tra recipientName, ownerAddress, institution
│   ├── Kiểm tra documentType có hợp lệ
│   └── Kiểm tra documentURI format
│
├── 2. Blockchain Interaction
│   ├── Tạo document hash: keccak256(recipientName + ownerAddress + timestamp)
│   ├── Call issueDiploma() contract
│   ├── Chờ transaction confirm
│   └── Lấy transactionHash
│
├── 3. Local Storage
│   ├── Tạo file: diploma_<type>_<timestamp>_<randomId>.json
│   ├── Lưu metadata: hash, recipientName, documentType, status
│   └── Lưu timestamp tạo
│
└── 4. Response
    └── Trả về: { success, hash, tx, timestamp }
```

**Luồng Code**:
```javascript
POST /api/documents/issue
  ↓
validateInput()  // Check required fields
  ↓
generateDocumentHash()  // keccak256(data)
  ↓
blockchain.issueDiploma()  // Smart contract call
  ↓
saveToLocalStorage()  // Write JSON file
  ↓
return { success: true, hash, tx }
```

#### 2. **GET /api/documents/user/:address** - Lấy Tài Liệu

```
Thuật toán:
├── 1. Lấy Danh Sách File
│   ├── Scan thư mục data/
│   ├── Filter files có prefix "diploma_"
│   └── Parse từ filename
│
├── 2. Đọc Metadata
│   ├── Đọc từng file JSON
│   ├── Extract: hash, type, status, timestamp
│   └── Xếp chồng vào array
│
├── 3. Filter & Sort
│   ├── Lọc theo ownerAddress (case-insensitive)
│   ├── Sort theo timestamp (mới nhất trước)
│   └── Limit results
│
└── 4. Response
    └── Trả về: [ { hash, documentType, status, owner, ... } ]
```

#### 3. **POST /api/documents/verify** - Xác Minh Tài Liệu

```
Thuật toán:
├── 1. Validate Permissions
│   ├── Kiểm tra caller có phải verifier
│   ├── Kiểm tra account có trong admin list
│   └── Kiểm tra signature hợp lệ
│
├── 2. Blockchain Verification
│   ├── Call verifyDiploma() contract
│   ├── Ghi lại verifier address
│   ├── Ghi lại timestamp verify
│   └── Chờ transaction confirm
│
├── 3. Update Local Storage
│   ├── Tìm file diploma tương ứng
│   ├── Cập nhật status: "verified"
│   ├── Ghi lại verifier + timestamp
│   └── Write back to file
│
└── 4. Response
    └── Trả về: { success, message, tx }
```

#### 4. **GET /api/documents/:hash** - Xem Chi Tiết

```
Thuật toán:
├── 1. Tìm File
│   ├── Scan thư mục data/
│   ├── Tìm file chứa document hash
│   └── Parse metadata từ file
│
├── 2. Lấy Info từ Blockchain
│   ├── Query contract storage
│   ├── Lấy: owner, verified status, issuer
│   ├── Lấy: permissions, shares
│   └── Lấy: transaction history
│
├── 3. Combine Data
│   ├── Merge local metadata + blockchain data
│   ├── Verify signatures
│   ├── Format response
│   └── Add shares information
│
└── 4. Response
    └── Trả về: { hash, owner, type, status, permissions, shares }
```

---

## 3.5.4. Tầng Frontend (React)

### A. Cấu Trúc Components

```
frontend/src/
├── App.js                 # Router setup
├── pages/
│   ├── Dashboard.js       # List documents (Main page)
│   ├── IssueDiploma.js    # Issue new diploma (Admin)
│   ├── ViewDocument.js    # View detail
│   ├── VerifyDocument.js  # Verify (Admin)
│   └── ShareDocument.js   # Share
├── components/
│   ├── Navbar.js          # Navigation
│   └── DocumentCard.js    # Card component
├── services/
│   ├── api.js             # API calls
│   └── blockchain.js      # Web3 integration
└── config.js              # Configuration
```

### B. Các Thuật Toán Chức Năng Chính

#### 1. **Dashboard - Search & Filter Logic**

**Vị trí**: `frontend/src/pages/Dashboard.js`

```
Thuật toán Multi-Stage Filter:

Stage 1: Load Documents
├── useEffect hook triggered
├── Call API: GET /api/documents/user/:address
├── Set documents state
└── setLoading(false)

Stage 2: Type Filter
├── filterType state từ dropdown
├── if filterType !== 'Tất Cả'
│   └── filtered = documents.filter(d => d.documentType === filterType)
└── else filtered = documents

Stage 3: Status Filter
├── filterStatus state từ dropdown
├── if filterStatus !== 'Tất Cả'
│   ├── if filterStatus === 'Đã Xác Minh'
│   │   └── filtered = filtered.filter(d => d.verified === true)
│   └── else (Chờ Xác Minh)
│       └── filtered = filtered.filter(d => d.verified === false)
└── else filtered unchanged

Stage 4: Search Filter
├── searchTerm state từ input
├── if searchTerm.length > 0
│   └── filtered = filtered.filter(d => 
│       d.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
│     )
└── else filtered unchanged

Stage 5: Display Results
├── setFilteredDocuments(filtered)
└── Render DocumentCard for each item

Time Complexity: O(n * m)
  n = number of documents
  m = average length of recipientName
Space Complexity: O(n)
```

**Pseudocode**:
```javascript
useEffect(() => {
  let result = documents;
  
  // Filter 1: Type
  if (filterType !== 'Tất Cả') {
    result = result.filter(d => d.documentType === filterType);
  }
  
  // Filter 2: Status
  if (filterStatus !== 'Tất Cả') {
    result = result.filter(d => 
      (filterStatus === 'Đã Xác Minh' && d.verified) ||
      (filterStatus === 'Chờ Xác Minh' && !d.verified)
    );
  }
  
  // Filter 3: Search
  if (searchTerm) {
    result = result.filter(d =>
      d.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  setFilteredDocuments(result);
}, [documents, filterType, filterStatus, searchTerm]);
```

#### 2. **DocumentCard - Document Rendering**

**Vị trí**: `frontend/src/components/DocumentCard.js`

```
Thuật toán:
├── 1. Initialize State
│   ├── docInfo: diploma data
│   ├── loading: fetch state
│   └── verifying: button state
│
├── 2. Load Document Info (useEffect)
│   ├── if !diploma provided
│   │   ├── Call API: getDocument(hash)
│   │   ├── Wait for response
│   │   └── setDocInfo(result)
│   └── else use provided diploma
│
├── 3. Render Card
│   ├── Show icon based on documentType
│   ├── Show status badge (Đã Xác Minh / Chờ Xác Minh)
│   ├── Show recipientName
│   ├── Show documentType
│   ├── Show issued date
│   └── Show action buttons
│
├── 4. Handle Verify (Admin Only)
│   ├── Check if isAdmin
│   ├── Check if already verified (disable button)
│   ├── Call API: verifyDiploma()
│   ├── setVerifying(true) during request
│   └── Refresh on success
│
└── 5. Handle Share/View
    ├── Link to ViewDocument
    ├── Pass hash as param
    └── Pass diploma data if available
```

#### 3. **IssueDiploma - Form Processing**

**Vị trí**: `frontend/src/pages/IssueDiploma.js`

```
Thuật toán:
├── 1. Permission Check
│   ├── Check if account exists
│   ├── Query admin list from contract
│   └── if not admin, show error message
│
├── 2. Form State Management
│   ├── formData state:
│   │   ├── recipientName
│   │   ├── ownerAddress (auto-filled)
│   │   ├── institution
│   │   └── documentType
│   └── Handle onChange for each field
│
├── 3. Form Submission
│   ├── Validate all fields
│   ├── Create digital signature:
│   │   ├── Message: recipient + owner + type
│   │   └── Sign with connected wallet
│   ├── Call API: issueDiploma()
│   │   ├── Pass: form data + signature
│   │   └── Wait for blockchain confirmation
│   ├── Show success message
│   ├── Reset form
│   └── Redirect to Dashboard
│
├── 4. Error Handling
│   ├── Catch network errors
│   ├── Catch validation errors
│   ├── Show error message to user
│   └── Log error to console
│
└── 5. Loading State
    ├── Disable button during submit
    ├── Show loading spinner
    └── Re-enable on complete
```

---

## 3.5.5. Luồng Dữ Liệu (Data Flow)

### A. Luồng Cấp Văn Bằng
```
User (Frontend)
    ↓
IssueDiploma Form → Validate → Create Signature
    ↓
POST /api/documents/issue
    ↓
Backend: Validate & Process
    ↓
Smart Contract: issueDiploma() call
    ↓
Blockchain: Record transaction
    ↓
Backend: Save to local storage
    ↓
Response: { hash, tx, timestamp }
    ↓
Frontend: Show success, redirect to Dashboard
```

### B. Luồng Xem Danh Sách Văn Bằng
```
User opens Dashboard
    ↓
useEffect: loadUserDocuments()
    ↓
GET /api/documents/user/:address
    ↓
Backend: Scan data/ directory
    ↓
Backend: Parse and filter by owner
    ↓
Response: [ {diploma1}, {diploma2}, ... ]
    ↓
Frontend: setDocuments(response)
    ↓
Render DocumentCard for each
```

### C. Luồng Tìm Kiếm & Lọc
```
User types in search box / changes filter
    ↓
State change: searchTerm / filterType / filterStatus
    ↓
useEffect triggered (dependency array)
    ↓
Multi-stage filter algorithm (see 3.5.4.B.1)
    ↓
setFilteredDocuments(result)
    ↓
Re-render with filtered results
    ↓
Display count: "Tìm thấy X kết quả"
```

---

## 3.5.6. Tối Ưu Hóa & Performance

### A. Frontend
- **React.memo**: Wrap DocumentCard để tránh re-render không cần thiết
- **useCallback**: Wrap loadDocumentInfo để stable function reference
- **CSS-in-JS**: CSS variables cho theme switching (future)
- **Lazy Loading**: Code splitting cho routes (React.lazy)

### B. Backend
- **File Caching**: Cache document list in memory
- **Async Operations**: Non-blocking API responses
- **Error Handling**: Try-catch với proper error messages
- **Gas Optimization**: Batch operations khi có thể

### C. Blockchain
- **View Functions**: Read-only calls (verifyDiploma) không tốn gas
- **Event Indexing**: Emit events để dễ track
- **Access Control**: Role-based restrictions (issuer, verifier, admin)

---

## 3.5.7. Công Nghệ & Libraries

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "ethers": "^6.7.1",
  "react-icons": "^4.x"
}
```

### Backend
```json
{
  "express": "^4.x",
  "ethers": "^6.7.1",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

### Blockchain
```json
{
  "hardhat": "^2.x",
  "solidity": "^0.8.20",
  "@openzeppelin/contracts": "^4.x",
  "ethers": "^6.7.1"
}
```

---

## 3.5.8. Security Considerations

1. **Private Key Management**:
   - Stored in `.env` file (development only)
   - Never commit `.env` to git
   - Use environment variables in production

2. **Access Control**:
   - Admin role for issuing/verifying
   - Owner check for sharing permissions
   - Signature verification on critical operations

3. **Input Validation**:
   - All user inputs validated before processing
   - Address format validation (0x prefix)
   - String sanitization for names

4. **Transaction Safety**:
   - Wait for blockchain confirmation
   - Handle gas estimation
   - Retry mechanism for failed transactions

---

**Lưu ý**: 
- Mã nguồn tuân theo ES6+ standards
- Comments trong code giải thích logic phức tạp
- Error messages rõ ràng bằng tiếng Việt
- Responsive design cho mobile/tablet/desktop
