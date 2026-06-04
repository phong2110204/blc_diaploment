# Frontend - React Application

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
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_API_URL=http://localhost:5000/api
```

### Chạy Ứng Dụng

**Development Mode:**
```bash
npm start
```

**Build Production:**
```bash
npm run build
```

Ứng dụng sẽ chạy trên: `http://localhost:3000`

## 🏗️ Cấu Trúc Thư Mục

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Navbar.css
│   │   ├── DocumentCard.js
│   │   └── DocumentCard.css
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Dashboard.css
│   │   ├── IssueDiploma.js
│   │   ├── IssueDiploma.css
│   │   ├── ViewDocument.js
│   │   ├── ViewDocument.css
│   │   ├── ShareDocument.js
│   │   ├── ShareDocument.css
│   │   ├── VerifyDocument.js
│   │   └── VerifyDocument.css
│   ├── services/
│   │   ├── api.js          # Backend API calls
│   │   └── blockchain.js   # Blockchain/MetaMask integration
│   ├── abi/
│   │   └── DiplomaManager.json
│   ├── App.js
│   ├── App.css
│   ├── config.js
│   ├── index.js
│   └── index.css
├── package.json
├── .env.example
└── README.md
```

## 📄 Pages & Components

### Pages

1. **Dashboard** - Xem danh sách tài liệu
   - Hiển thị tất cả tài liệu của người dùng
   - Load tài liệu từ blockchain
   - DocumentCard component

2. **IssueDiploma** - Cấp văn bằng mới
   - Form cấp bằng
   - Ký điện tử
   - Integration với smart contract

3. **ViewDocument** - Xem chi tiết tài liệu
   - Hiển thị thông tin chi tiết
   - Danh sách chữ ký
   - Hành động chia sẻ/download

4. **ShareDocument** - Chia sẻ tài liệu
   - Cấp quyền cho người dùng khác
   - Thiết lập thời hạn
   - Chọn quyền hạn (View/Verify)

5. **VerifyDocument** - Xác minh tài liệu
   - Kiểm tra trạng thái xác minh
   - Xem chi tiết xác minh
   - Yêu cầu xác minh

### Components

1. **Navbar** - Navigation bar
   - Logo & menu
   - Kết nối wallet
   - Hiển thị account

2. **DocumentCard** - Card hiển thị tài liệu
   - Thông tin cơ bản
   - Trạng thái xác minh
   - Action buttons

## 🔌 Services

### blockchain.js
```javascript
connectWallet()           // Kết nối MetaMask
getContract()            // Lấy instance contract
getProvider()            // Lấy provider
signMessage()            // Ký message
getCurrentAccount()      // Lấy account hiện tại
switchNetwork()          // Chuyển network
```

### api.js
```javascript
documentService.issueDiploma()
documentService.verifyDiploma()
documentService.signDocument()
documentService.grantPermission()
documentService.revokePermission()
documentService.getDocument()
documentService.getUserDocuments()
documentService.getVerificationStatus()
documentService.addIssuer()
documentService.addVerifier()
```

## 🎨 Styling

- **Primary Color**: `#667eea` (Purple)
- **Secondary Color**: `#764ba2` (Dark Purple)
- **Background**: `#f5f5f5` (Light Gray)
- **Success**: `#51cf66` (Green)
- **Error**: `#ff6b6b` (Red)

### CSS Classes

```css
.btn-primary              /* Primary button */
.btn-submit              /* Submit button */
.form-group              /* Form group */
.card                    /* Card container */
.error-message           /* Error message */
.success-message         /* Success message */
.loading                 /* Loading state */
.connect-wallet-prompt   /* Wallet connection prompt */
```

## 🔐 MetaMask Integration

1. **Detect MetaMask**
   ```javascript
   if (window.ethereum) {
     // MetaMask available
   }
   ```

2. **Request Account**
   ```javascript
   const accounts = await window.ethereum.request({
     method: 'eth_requestAccounts'
   });
   ```

3. **Sign Message**
   ```javascript
   const signature = await signer.signMessage(message);
   ```

4. **Call Contract**
   ```javascript
   const contract = new Contract(address, ABI, signer);
   const tx = await contract.issueDiploma(...);
   ```

## 📱 Responsive Design

- **Desktop**: Full layout
- **Tablet**: Adjusted grid
- **Mobile**: Single column layout

## ⚙️ Configuration

**config.js**
```javascript
CONTRACT_ADDRESS          // Smart contract address
CONTRACT_ABI             // Contract ABI
API_BASE_URL             // Backend API URL
```

## 🚨 Error Handling

```javascript
try {
  // Call API
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
}
```

## 📊 State Management

- useState cho component state
- Context API có thể thêm cho global state
- localStorage cho account persistence

## 🧪 Testing

```bash
# Run tests
npm test

# Build app
npm run build

# Test build
npm run serve
```

## 🔗 URL Routes

```
/                 - Dashboard
/issue           - Issue Diploma
/view/:hash      - View Document
/share/:hash     - Share Document
/verify/:hash    - Verify Document
```

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.15.0",
  "ethers": "^6.7.1",
  "axios": "^1.5.0",
  "tailwindcss": "^3.3.3"
}
```

## 🐛 Troubleshooting

### MetaMask không detected
- Cài đặt MetaMask extension
- Refresh trang
- Kiểm tra console errors

### Contract address error
- Thiết lập `REACT_APP_CONTRACT_ADDRESS` trong `.env`
- Restart development server
- `npm start`

### API connection error
- Kiểm tra backend chạy trên port 5000
- Verify `REACT_APP_API_URL` trong `.env`
- Kiểm tra CORS settings

### Document loading error
- Verify blockchain RPC URL
- Kiểm tra contract deployment
- Inspect network requests

## 💡 Best Practices

1. ✅ Luôn kiểm tra wallet kết nối
2. ✅ Handle loading & error states
3. ✅ Validate user input
4. ✅ Ký message trước thực hiện action
5. ✅ Hiển thị transaction hash cho user
6. ✅ Lưu trữ sensitive data an toàn

---

**Version**: 1.0.0  
**React Version**: 18.2.0  
**Port**: 3000 (default)
