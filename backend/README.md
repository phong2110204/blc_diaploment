# Backend API - Node.js/Express

## 🚀 Khởi Động

### Cài Đặt Dependencies
```bash
npm install
```

### Cấu Hình Môi Trường
```bash
cp .env.example .env
```

Chỉnh sửa `.env`:
```env
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here
RPC_URL=http://localhost:8545
NETWORK=localhost
PORT=5000
NODE_ENV=development
```

### Chạy Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server sẽ chạy trên: `http://localhost:5000`

## 📚 API Endpoints

### 1. Cấp Văn Bằng

**Endpoint:**
```
POST /api/documents/issue
```

**Body:**
```json
{
  "ownerAddress": "0x...",
  "documentURI": "Qm...",
  "documentType": "Bachelor Degree",
  "recipientData": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Diploma issued successfully",
  "documentHash": "0x...",
  "transactionHash": "0x...",
  "owner": "0x...",
  "documentType": "Bachelor Degree"
}
```

### 2. Xác Minh Tài Liệu

**Endpoint:**
```
POST /api/documents/verify
```

**Body:**
```json
{
  "documentHash": "0x...",
  "isVerified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document verified successfully",
  "documentHash": "0x...",
  "transactionHash": "0x..."
}
```

### 3. Ký Tài Liệu

**Endpoint:**
```
POST /api/documents/sign
```

**Body:**
```json
{
  "documentHash": "0x...",
  "signature": "0x...",
  "role": "Issuer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document signed successfully",
  "documentHash": "0x...",
  "role": "Issuer",
  "transactionHash": "0x..."
}
```

### 4. Cấp Quyền Chia Sẻ

**Endpoint:**
```
POST /api/documents/grant-permission
```

**Body:**
```json
{
  "documentHash": "0x...",
  "granteeAddress": "0x...",
  "expiryDays": 30,
  "canView": true,
  "canVerify": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission granted successfully",
  "documentHash": "0x...",
  "grantee": "0x...",
  "expiryDate": "2024-06-08T10:00:00Z",
  "transactionHash": "0x..."
}
```

### 5. Thu Hồi Quyền

**Endpoint:**
```
POST /api/documents/revoke-permission
```

**Body:**
```json
{
  "documentHash": "0x...",
  "granteeAddress": "0x..."
}
```

### 6. Xem Chi Tiết Tài Liệu

**Endpoint:**
```
GET /api/documents/:documentHash
```

**Response:**
```json
{
  "success": true,
  "diploma": {
    "documentHash": "0x...",
    "issuer": "0x...",
    "owner": "0x...",
    "issuedDate": "2024-05-09T10:00:00Z",
    "documentURI": "Qm...",
    "isVerified": true,
    "documentType": "Bachelor Degree"
  },
  "signatures": [...],
  "createdAt": "2024-05-09T10:00:00Z",
  "updatedAt": "2024-05-09T10:00:00Z"
}
```

### 7. Xem Tài Liệu Của Người Dùng

**Endpoint:**
```
GET /api/documents/user/:userAddress
```

**Response:**
```json
{
  "success": true,
  "userAddress": "0x...",
  "documentCount": 5,
  "documents": ["0x...", "0x...", ...]
}
```

### 8. Kiểm Tra Trạng Thái Xác Minh

**Endpoint:**
```
GET /api/documents/:documentHash/verification-status
```

**Response:**
```json
{
  "success": true,
  "documentHash": "0x...",
  "isVerified": true
}
```

### 9. Thêm Issuer (Admin)

**Endpoint:**
```
POST /api/admin/add-issuer
```

**Body:**
```json
{
  "issuerAddress": "0x..."
}
```

### 10. Thêm Verifier (Admin)

**Endpoint:**
```
POST /api/admin/add-verifier
```

**Body:**
```json
{
  "verifierAddress": "0x..."
}
```

### Health Check

**Endpoint:**
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Backend is running"
}
```

## 🏗️ Cấu Trúc Thư Mục

```
backend/
├── server.js              # Main server file
├── abi/
│   └── DiplomaManager.json # Contract ABI
├── package.json
├── .env.example
└── README.md
```

## 🔧 Utility Functions

### Hash Document
```javascript
const documentHash = hashDocument({
  owner: ownerAddress,
  uri: documentURI,
  type: documentType,
  timestamp: Date.now()
});
```

### Verify Signature
```javascript
const isValid = verifyDocumentSignature(message, signature, address);
```

## 🔐 Bảo Mật

- ✅ Environment variables cho sensitive data
- ✅ CORS enabled cho frontend
- ✅ Input validation trên tất cả endpoints
- ✅ Error handling toàn diện
- ✅ Async/await error handling

## 📊 Error Handling

Tất cả errors trả về format:
```json
{
  "error": "Error message",
  "message": "Detailed error information"
}
```

## 🧪 Testing

```bash
# Test API endpoint
curl http://localhost:5000/api/health

# Với data
curl -X POST http://localhost:5000/api/documents/issue \
  -H "Content-Type: application/json" \
  -d '{
    "ownerAddress": "0x...",
    "documentURI": "Qm...",
    "documentType": "Bachelor Degree"
  }'
```

## 🐛 Troubleshooting

### Lỗi: "Blockchain initialization failed"
- Kiểm tra `RPC_URL` trong `.env`
- Kiểm tra kết nối Internet
- Verify contract address

### Lỗi: "Contract address is required"
- Thiết lập `CONTRACT_ADDRESS` trong `.env`
- Deploy smart contract trước

### Lỗi: CORS
- Kiểm tra frontend URL
- Thêm frontend URL vào CORS whitelist

---

**Version**: 1.0.0  
**Node Version**: >=14.0.0  
**Port**: 5000 (default)
