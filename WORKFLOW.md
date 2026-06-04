# 🔄 Luồng Hoạt Động (Workflow)

## Tổng Quan Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  - Dashboard, Issue, View, Share, Verify                        │
│  - Kết nối MetaMask, UI/UX                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP REST API
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                          │
│  - API Endpoints, Business Logic                               │
│  - Blockchain Interaction                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ ethers.js, RPC Calls
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│            SMART CONTRACTS (DiplomaManager.sol)                 │
│  - State Management, Validation                                 │
│  - Events, Transactions                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Ganache/Ethereum
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN (Ganache)                         │
│  - Immutable Records, Transactions                              │
│  - Accounts with 100 ETH (test)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Luồng Cấp Văn Bằng (Issue Diploma)

### Các Bước:

```
User (Frontend)
    │
    ├─► Mở trang "Issue Diploma"
    │
    ├─► Nhập thông tin:
    │   - Recipient Name
    │   - Recipient Wallet Address
    │   - Institution
    │   - Diploma Type
    │   - Document URI (IPFS hash)
    │
    ├─► Click "Issue Diploma"
    │
    └─► Ký tín nhắn để xác thực (MetaMask)
         │
         ▼
Backend API
    │
    ├─► Nhận POST /api/documents/issue
    │
    ├─► Validate input data
    │
    ├─► Hash document: ethers.id(JSON.stringify(data))
    │
    ├─► Gọi Smart Contract:
    │   contract.issueDiploma(
    │     documentHash,
    │     ownerAddress,
    │     documentURI,
    │     documentType
    │   )
    │
    └─► Trả về response với transactionHash
         │
         ▼
Smart Contract
    │
    ├─► Kiểm tra msg.sender là issuer
    │
    ├─► Tạo Diploma struct:
    │   - documentHash
    │   - issuer: msg.sender
    │   - owner: _owner
    │   - issuedDate: block.timestamp
    │   - documentURI: _documentURI
    │   - isVerified: false
    │   - documentType: _documentType
    │
    ├─► Lưu vào mapping: documents[documentHash]
    │
    ├─► Thêm vào userDocuments[owner][]
    │
    ├─► Emit DiplomaIssued event
    │
    └─► Return success
         │
         ▼
Frontend
    │
    ├─► Show success message
    │
    ├─► Display transactionHash
    │
    ├─► Redirect to ViewDocument page
    │
    └─► User sees newly issued diploma
```

### Data Flow:

```json
Frontend ──────────────────────► Backend
{
  "ownerAddress": "0x...",
  "documentURI": "QmXxxx",
  "documentType": "Bachelor Degree"
}

Backend ───────────────────────► Blockchain
Tx: issueDiploma(hash, owner, uri, type)

Blockchain ────────────────────► Backend
{
  "transactionHash": "0xabcd...",
  "blockNumber": 123,
  "gasUsed": 150000
}

Backend ───────────────────────► Frontend
{
  "success": true,
  "documentHash": "0x...",
  "transactionHash": "0xabcd..."
}
```

---

## 2️⃣ Luồng Xem Tài Liệu (View Document)

### Các Bước:

```
User (Frontend)
    │
    ├─► Vào Dashboard
    │
    ├─► Xem danh sách tài liệu
    │
    ├─► Click "View Details"
    │
    └─► Gửi GET /api/documents/:documentHash
         │
         ▼
Backend API
    │
    ├─► Nhận documentHash
    │
    ├─► Gọi Smart Contract (read-only):
    │   - contract.getDiploma(documentHash)
    │   - contract.getSignatures(documentHash)
    │   - contract.getFullDocumentRecord(documentHash)
    │
    ├─► Format data:
    │   - Convert timestamps to Date
    │   - Parse addresses
    │   - Organize signatures
    │
    └─► Trả về response
         │
         ▼
Smart Contract (View Function)
    │
    ├─► Check hasPermission:
    │   - owner? ✓
    │   - shared permission? ✓
    │   - admin? ✓
    │
    ├─► Return DocumentRecord:
    │   - diploma info
    │   - signatures array
    │   - createdAt, updatedAt
    │
    └─► No state change (read-only)
         │
         ▼
Frontend
    │
    ├─► Display document details:
    │   - Issuer
    │   - Owner
    │   - Issued Date
    │   - Document Type
    │   - Verification Status
    │
    ├─► Show signatures:
    │   - Signer address
    │   - Role
    │   - Signed date
    │
    └─► Display action buttons:
        - Share Document
        - Download
        - Verify
```

---

## 3️⃣ Luồng Chia Sẻ Tài Liệu (Share Document)

### Các Bước:

```
User (Document Owner)
    │
    ├─► Vào trang View Document
    │
    ├─► Click "Share"
    │
    ├─► Nhập thông tin:
    │   - Recipient Address (0x...)
    │   - Can View: ✓
    │   - Can Verify: ☐
    │   - Expiry Days: 30
    │
    ├─► Click "Grant Permission"
    │
    └─► MetaMask transaction
         │
         ▼
Backend API
    │
    ├─► POST /api/documents/grant-permission
    │
    ├─► Validate:
    │   - documentHash valid
    │   - granteeAddress valid
    │   - expiryDate in future
    │
    ├─► Call contract:
    │   contract.grantPermission(
    │     documentHash,
    │     granteeAddress,
    │     expiryDate,
    │     canView,
    │     canVerify
    │   )
    │
    └─► Return transactionHash
         │
         ▼
Smart Contract
    │
    ├─► Check msg.sender == owner
    │
    ├─► Create SharePermission:
    │   - grantee: _grantee
    │   - grantDate: block.timestamp
    │   - expiryDate: _expiryDate
    │   - canView: _canView
    │   - canVerify: _canVerify
    │
    ├─► Add to permissions array
    │
    ├─► Emit PermissionGranted event
    │
    └─► Return success
         │
         ▼
Frontend
    │
    ├─► Show success message
    │
    ├─► Update UI
    │
    └─► User can see shared users
```

### Grantee (Người Nhận)

```
Grantee User
    │
    ├─► Nhập document hash
    │
    ├─► Frontend gọi: GET /api/documents/:hash
    │
    ├─► Backend kiểm tra quyền:
    │   - Có trong permissions array?
    │   - canView = true?
    │   - Chưa expired?
    │
    ├─► Return document nếu OK
    │
    └─► Display document
```

---

## 4️⃣ Luồng Xác Minh Tài Liệu (Verify Diploma)

### Các Bước:

```
Verifier/Admin
    │
    ├─► Vào trang Verify
    │
    ├─► Nhập document hash
    │
    ├─► Click "Verify Document"
    │
    └─► Send POST /api/documents/verify
         │
         ▼
Backend API
    │
    ├─► Validate:
    │   - Sender là verifier?
    │   - Document exists?
    │
    ├─► Call contract:
    │   contract.verifyDiploma(documentHash, true)
    │
    └─► Return confirmation
         │
         ▼
Smart Contract
    │
    ├─► Check msg.sender == verifier
    │
    ├─► Update diploma.isVerified = true
    │
    ├─► Update updatedAt timestamp
    │
    ├─► Emit DiplomaVerified event
    │
    └─► Return success
         │
         ▼
Frontend
    │
    ├─► Show "Document Verified ✓"
    │
    ├─► Update status badge
    │
    └─► Display verifier info
```

---

## 5️⃣ Luồng Ký Số (Sign Document)

### Các Bước:

```
Issuer/Owner/Verifier
    │
    ├─► Vào View Document
    │
    ├─► Click "Sign Document"
    │
    ├─► MetaMask ký message
    │
    └─► Send POST /api/documents/sign
         │
         ▼
Frontend (MetaMask)
    │
    ├─► Tạo message: 
    │   "Sign: [documentHash]"
    │
    ├─► Mở MetaMask signature dialog
    │
    ├─► User confirm ký
    │
    └─► Return signature (0x...)
         │
         ▼
Backend API
    │
    ├─► Validate signature
    │
    ├─► Call contract:
    │   contract.signDocument(
    │     documentHash,
    │     signature,
    │     "Issuer" // role
    │   )
    │
    └─► Return confirmation
         │
         ▼
Smart Contract
    │
    ├─► Create Signature struct:
    │   - signer: msg.sender
    │   - signature: _signature
    │   - signedDate: block.timestamp
    │   - role: _role
    │
    ├─► Add to signatures array
    │
    ├─► Emit DocumentSigned event
    │
    └─► Return success
         │
         ▼
Frontend
    │
    ├─► Show "Document Signed ✓"
    │
    ├─► Refresh signatures list
    │
    └─► Display new signature
```

---

## 6️⃣ Luồng Quản Lý Quyền (Admin Functions)

### Thêm Issuer:

```
Admin
    │
    ├─► Admin Page
    │
    ├─► Nhập issuer address
    │
    └─► POST /api/admin/add-issuer
         │
         ▼
Backend
    │
    ├─► Contract.addIssuer(issuerAddress)
    │
    └─► Return confirmation
         │
         ▼
Smart Contract
    │
    ├─► Check msg.sender == admin
    │
    ├─► Set issuers[address] = true
    │
    ├─► Emit IssuerAdded event
    │
    └─► Return success
         │
         ▼
Frontend/Admin
    │
    ├─► Show "Issuer Added ✓"
    │
    └─► Update issuer list
```

---

## 🔄 Sequence Diagram - Cấp Văn Bằng

```
Frontend    Backend     SmartContract    Blockchain
   │          │              │               │
   ├─Issue────►              │               │
   │          ├─Validate────►                │
   │          ├─Hash─────────►               │
   │          │              │               │
   │          ├──Call issueDiploma───────────►
   │          │              │      Tx       │
   │          │              │◄──Event────────
   │          │◄─Confirm─────┤               │
   │          │              │               │
   │◄─Success─┤              │               │
   │          │              │               │
   ├─Redirect─►              │               │
   │          ├─getDiploma──►                │
   │          │◄─Data────────┤               │
   │◄─Display─┤              │               │
   │          │              │               │
```

---

## 📊 Data Flow Summary

| Luồng | Request | Response | Storage |
|-------|---------|----------|---------|
| **Issue** | ownerAddr, URI, type | documentHash, txHash | Blockchain + Mapping |
| **View** | documentHash | diploma, signatures, permissions | Read from mapping |
| **Share** | hash, grantee, expiry | txHash, confirmation | Blockchain array |
| **Verify** | hash, isVerified | txHash, status | blockchain bool |
| **Sign** | hash, signature, role | txHash, confirmations | Blockchain array |

---

## 🎯 Quy Trình Chính

### 1. Khởi Tạo
- [ ] Ganache chạy trên localhost:8545
- [ ] Smart contract deployed
- [ ] Backend kết nối Ganache
- [ ] Frontend kết nối Backend
- [ ] MetaMask kết nối Ganache

### 2. Cấp Văn Bằng
- [ ] Issuer issue diploma
- [ ] Document lưu blockchain
- [ ] Owner nhận thông báo

### 3. Xác Minh
- [ ] Verifier verify diploma
- [ ] Status cập nhật trên blockchain
- [ ] Owner thấy "Verified" badge

### 4. Chia Sẻ
- [ ] Owner chia sẻ với người khác
- [ ] Grantee kiểm tra quyền
- [ ] Grantee có thể xem/verify

### 5. Ký Số
- [ ] Người ký ký document
- [ ] Signature lưu blockchain
- [ ] Lịch sử ký hiển thị

---

## 🔐 Bảo Mật Luồng

```
Frontend (User)
    ↓
Validate Input
    ↓
Sign with MetaMask
    ↓
Backend (API)
    ↓
Verify Authorization
    ↓
Call Smart Contract
    ↓
Smart Contract
    ↓
Check Access Control (modifiers)
    ↓
Validate State Change
    ↓
Emit Events
    ↓
Blockchain
    ↓
Immutable Record
```

---

## 📝 Ví Dụ Thực Tế

### Scenario: Sinh Viên Nhận Bằng

```
1. Trường (Issuer) đăng nhập
   ├─► Vào Issue Diploma
   ├─► Nhập: "Nguyễn Văn A" + wallet
   ├─► Submit
   └─► ✓ Bằng cấp trên blockchain

2. Sinh viên (Owner) xem bằng
   ├─► Vào Dashboard
   ├─► Click "View Details"
   ├─► Thấy: Issuer, Date, Type, Verified=false
   └─► ✓ Bằng của tôi trên blockchain

3. Người xác minh (Verifier) xác thực
   ├─► Vào Verify page
   ├─► Nhập bằng hash
   ├─► Click Verify
   └─► ✓ Bằng đã xác thực

4. Sinh viên chia sẻ cho nhà tuyển dụng
   ├─► Click Share
   ├─► Nhập employer wallet
   ├─► Set: canView=true, expiry=30 days
   ├─► Submit
   └─► ✓ Chia sẻ thành công

5. Nhà tuyển dụng xem bằng
   ├─► Nhập bằng hash
   ├─► Frontend check quyền
   ├─► Backend verify permission
   ├─► Smart contract confirm
   └─► ✓ Xem được bằng (30 ngày)

6. Sau 30 ngày
   ├─► Sinh viên revoke permission
   ├─► Nhà tuyển dụng không thể xem
   └─► ✓ Quyền hết hạn
```

---

## 🚀 Performance Flow

```
Request (100 tài liệu)
    │
    ├─► Frontend: 10ms (JS execution)
    ├─► Network: 50ms (HTTP)
    ├─► Backend: 100ms (API + Ganache call)
    ├─► Blockchain: 30ms (read from mapping)
    └─► Total: ~190ms

Transaction (Cấp văn bằng)
    │
    ├─► Frontend: 5ms (UI)
    ├─► MetaMask: 2000ms (user confirm)
    ├─► Network: 100ms (HTTP to backend)
    ├─► Backend: 50ms (send to blockchain)
    ├─► Ganache: 1000ms (mine block)
    └─► Total: ~3155ms
```

---

## 📞 Troubleshooting Flow

```
User Report Issue
    │
    ├─► Check Frontend Logs (Console)
    ├─► Check Backend Logs (Terminal)
    ├─► Check MetaMask Errors
    ├─► Check Ganache Status
    └─► Resolve and Retry
```

---

**Tạo: May 9, 2026**
**Version: 1.0**
