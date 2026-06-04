# Setup & Hướng Dẫn Cài Đặt

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: v16.0.0 trở lên
- **npm**: v8.0.0 trở lên (hoặc yarn)
- **MetaMask**: Chrome/Firefox extension
- **Ganache**: Local Ethereum blockchain (dễ cho development)

## 🔧 Cài Đặt Bước Theo Bước

### Bước 1: Clone/Setup Project

```bash
# Tạo/vào thư mục dự án
cd QLVB

# Khởi tạo Git (nếu cần)
git init
```

### Bước 2: Smart Contracts (Blockchain) - Sử Dụng Ganache

#### 2.1 Cài Đặt Ganache

```bash
# Cài đặt Ganache CLI
npm install -g ganache-cli

# Hoặc sử dụng Ganache Desktop GUI (dễ hơn)
# Download từ: https://www.trufflesuite.com/ganache
```

#### 2.2 Chạy Ganache

**Option 1: Ganache CLI**
```bash
ganache-cli --deterministic --mnemonic "test test test test test test test test test test test junk"
```
Ganache sẽ chạy trên: `http://localhost:8545`

**Option 2: Ganache GUI**
- Mở Ganache Desktop
- Click "New Workspace"
- Port mặc định: 7545

#### 2.3 Deploy Smart Contract

```bash
cd blockchain

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env (sử dụng Ganache):
# PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
# (Key từ Ganache, hoặc lấy từ output Ganache)

# Compile smart contracts
npm run compile

# Deploy to Ganache (localhost)
npx hardhat run scripts/deploy.js --network hardhat
```

**Lưu contract address từ output!** Ví dụ: `0x5FbDB2315678afccb333f8a9c6..`

### Bước 3: Backend API

```bash
cd ../backend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env (sử dụng Ganache):
# PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
# CONTRACT_ADDRESS=0x... (từ bước 2)
# RPC_URL=http://localhost:8545
# NETWORK=localhost
# PORT=5000
# NODE_ENV=development

# Kiểm tra kết nối
npm start
```

**Backend chạy trên http://localhost:5000**

### Bước 4: Frontend

```bash
cd ../frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env:
# - REACT_APP_CONTRACT_ADDRESS: Address từ bước 2
# - REACT_APP_API_URL: http://localhost:5000/api

# Chạy ứng dụng
npm start
```

**Frontend chạy trên http://localhost:3000**

## 🌐 Cấu Hình Ganache với MetaMask

### 1. Thêm Ganache Network vào MetaMask

**Network Details:**
- Network Name: Ganache
- RPC URL: `http://localhost:8545` (hoặc `http://127.0.0.1:8545`)
- Chain ID: 1337
- Currency Symbol: ETH
- Block Explorer: (không cần)

### 2. Import Ganache Account vào MetaMask

Ganache sẽ generate 10 tài khoản khi khởi chạy.

**Lấy Private Key từ Ganache:**

**Ganache CLI Output:**
```
Private Keys:
(0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
(1) 0x6cbed15c793ce57650b9c2ff57e637a98388f23334b814f8e340ebbc6f721f50
...
```

**Ganache GUI:**
- Click account button trên cùng bên phải
- Chọn "Show Keys"
- Copy private key

**Import vào MetaMask:**
1. Mở MetaMask
2. Click icon trang trái > Import Account
3. Paste private key (không cần `0x` prefix)
4. Click Import

### 3. Xác Nhận Kết Nối

- MetaMask phải chuyển sang "Ganache" network
- Mỗi account có 100 ETH fake (không có giá trị thực)

## 🔑 Environment Variables (Ganache)

### blockchain/.env
```env
PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
ETHERSCAN_API_KEY=dummy_key_for_local
```

### backend/.env
```env
PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
CONTRACT_ADDRESS=0x... (từ deployment output)
RPC_URL=http://localhost:8545
NETWORK=localhost
PORT=5000
NODE_ENV=development
```

### frontend/.env
```env
REACT_APP_CONTRACT_ADDRESS=0x... (từ deployment output)
REACT_APP_API_URL=http://localhost:5000/api
```

## ✅ Kiểm Tra Cài Đặt

```bash
# 1. Kiểm tra Node version
node --version

# 2. Kiểm tra npm version
npm --version

# 3. Test smart contract compilation
cd blockchain
npm run compile

# 4. Test backend connection
cd ../backend
npm start
# Browser: http://localhost:5000/api/health

# 5. Test frontend
cd ../frontend
npm start
# Browser: http://localhost:3000
```

## 🚀 Chạy Ứng Dụng (4 Terminal)

### Terminal 1: Ganache (Local Blockchain)
```bash
# Option 1: Ganache CLI
ganache-cli --deterministic --mnemonic "test test test test test test test test test test test junk"

# Option 2: Ganache GUI (mở app trực tiếp)
```

**Ganache chạy trên**: http://localhost:8545

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

**Backend chạy trên**: http://localhost:5000

### Terminal 3: Frontend
```bash
cd frontend
npm start
```

**Frontend chạy trên**: http://localhost:3000

### Terminal 4: (Optional) Deploy Smart Contract
```bash
# Chỉ cần chạy lần đầu
cd blockchain
npx hardhat run scripts/deploy.js --network hardhat
```

## 📝 Các Bước Đầu Tiên

1. ✅ Kết nối MetaMask wallet
2. ✅ Đảm bảo có testnet ETH
3. ✅ Kiểm tra backend chạy
4. ✅ Kiểm tra contract address cấu hình
5. ✅ Cấp issue quyền cho wallet
6. ✅ Test cấp văn bằng

## 🔐 Bảo Mật

⚠️ **QUAN TRỌNG:**

```
❌ KHÔNG bao giờ commit .env file!
❌ KHÔNG chia sẻ PRIVATE_KEY!
❌ KHÔNG public seed phrase!
✅ Luôn dùng testnet đầu tiên!
✅ Test kỹ trước production!
```

### .gitignore
```
.env
.env.local
node_modules/
build/
dist/
.DS_Store
```

## 🆘 Troubleshooting

### Ganache không chạy
```
1. Kiểm tra Ganache process: netstat -an | findstr 8545
2. Nếu port bận, kill process: taskkill /PID <PID> /F
3. Hoặc dùng Ganache GUI thay vì CLI
```

### MetaMask không kết nối Ganache
```
1. Kiểm tra Ganache chạy (http://localhost:8545)
2. Thêm Ganache network vào MetaMask đúng cách
3. Chuyển MetaMask sang Ganache network
4. Import account từ Ganache private key
```

### Backend error: "Blockchain initialization failed"
```
1. Kiểm tra Ganache chạy trên port 8545
2. Kiểm tra RPC_URL=http://localhost:8545 trong .env
3. Kiểm tra PRIVATE_KEY format (có 0x prefix)
4. Restart backend: npm run dev
```

### Contract address error
```
1. Chạy: npx hardhat run scripts/deploy.js --network hardhat
2. Copy contract address từ output
3. Paste vào backend .env (CONTRACT_ADDRESS)
4. Paste vào frontend .env (REACT_APP_CONTRACT_ADDRESS)
5. Restart backend và frontend
```

### CORS error
```
1. Kiểm tra backend chạy trên http://localhost:5000
2. Kiểm tra REACT_APP_API_URL=http://localhost:5000/api
3. Clear browser cache hoặc mở Incognito
```

### MetaMask "insufficient balance" lỗi
```
1. Kiểm tra đã import account từ Ganache
2. Tất cả Ganache accounts đều có 100 ETH
3. Nếu account khác, import private key mới
```

## 🎯 Quick Start Checklist

- [ ] Cài Ganache: `npm install -g ganache-cli`
- [ ] Chạy Ganache: `ganache-cli --deterministic`
- [ ] Deploy smart contract: `npx hardhat run scripts/deploy.js --network hardhat`
- [ ] Lưu contract address
- [ ] Cấu hình blockchain/.env
- [ ] Cấu hình backend/.env
- [ ] Cấu hình frontend/.env
- [ ] Import Ganache account vào MetaMask
- [ ] Thêm Ganache network vào MetaMask (localhost:8545)
- [ ] Chạy backend: `npm run dev`
- [ ] Chạy frontend: `npm start`
- [ ] Mở http://localhost:3000
- [ ] Kết nối MetaMask wallet
- [ ] Test cấp/view tài liệu
- [ ] ✅ Thành công!

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra documentation
2. Kiểm tra console errors
3. Kiểm tra network requests
4. Kiểm tra blockchain explorer (Etherscan)
5. Kiểm tra contract events

---

**Chúc bạn thành công! 🎉**
