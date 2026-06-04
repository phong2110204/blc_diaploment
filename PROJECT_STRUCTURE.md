# 📋 QLVB - Diploma Management System

## Hệ Thống Quản Lý Văn Bằng Trên Blockchain

Đây là một dự án toàn diện để xây dựng hệ thống quản lý và xác thực văn bằng sử dụng:
- **Smart Contracts** (Solidity/Ethereum)
- **Backend API** (Node.js/Express)
- **Frontend** (React)

## 📂 Cấu Trúc Thư Mục

```
QLVB/
├── blockchain/        # Smart Contracts
│   ├── contracts/     # Solidity contracts
│   ├── scripts/       # Deployment scripts
│   ├── test/          # Unit tests
│   └── README.md      # Blockchain documentation
│
├── backend/           # Backend API
│   ├── abi/          # Contract ABI
│   ├── server.js     # Express server
│   └── README.md     # API documentation
│
├── frontend/          # React Frontend
│   ├── src/          # React components
│   ├── public/       # Static files
│   └── README.md     # Frontend documentation
│
├── README.md          # This file
├── SETUP.md          # Setup instructions
└── deployment.json   # Contract deployment info
```

## 🚀 Nhanh Chóng Bắt Đầu

### 1. Clone & Setup
```bash
cd QLVB
npm install
```

### 2. Deploy Smart Contract
```bash
cd blockchain
npm install
npm run deploy:testnet
# Lưu contract address!
```

### 3. Run Backend
```bash
cd ../backend
npm install
# Cấu hình .env
npm run dev
```

### 4. Run Frontend
```bash
cd ../frontend
npm install
# Cấu hình .env
npm start
```

## 📖 Tài Liệu

- [Setup Guide](./SETUP.md) - Hướng dẫn cài đặt chi tiết
- [Blockchain Docs](./blockchain/README.md) - Smart Contract documentation
- [Backend Docs](./backend/README.md) - API reference
- [Frontend Docs](./frontend/README.md) - React component guide

## ✨ Tính Năng

✅ Cấp và lưu trữ văn bằng trên blockchain  
✅ Xác minh tính xác thực của tài liệu  
✅ Ký điện tử/ký số trên tài liệu  
✅ Chia sẻ tài liệu với quyền hạn  
✅ Kiểm soát quyền truy cập  
✅ Theo dõi lịch sử tài liệu  

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20 |
| Blockchain | Ethereum + Sepolia Testnet |
| Backend | Node.js + Express.js |
| Frontend | React 18 + React Router |
| Package Manager | npm / yarn |

## 📝 Các API Endpoint

### Documents
- `POST /api/documents/issue` - Cấp văn bằng
- `POST /api/documents/verify` - Xác minh
- `POST /api/documents/sign` - Ký điện tử
- `GET /api/documents/:hash` - Xem chi tiết
- `GET /api/documents/user/:address` - Xem tài liệu của người dùng

### Sharing
- `POST /api/documents/grant-permission` - Cấp quyền
- `POST /api/documents/revoke-permission` - Thu hồi quyền

### Admin
- `POST /api/admin/add-issuer` - Thêm issuer
- `POST /api/admin/add-verifier` - Thêm verifier

## 🔐 Bảo Mật

✅ Environment variables cho sensitive data  
✅ Smart contract optimized & audited  
✅ Access control dựa trên role  
✅ Digital signatures  
✅ Gas optimizations  

## 🧪 Testing

```bash
# Test smart contracts
cd blockchain
npm test

# Chạy local blockchain
npx hardhat node
```

## 🚀 Deployment

### Development
1. Chạy Hardhat local node
2. Deploy contract to localhost
3. Config .env files
4. Run backend & frontend

### Testnet (Sepolia)
1. Get testnet ETH
2. Deploy to Sepolia
3. Config .env files
4. Connect MetaMask to Sepolia

### Production
1. Deploy to Ethereum mainnet
2. Security audit
3. Optimize gas usage
4. Monitor contract

## 📞 Support & Documentation

Xem [SETUP.md](./SETUP.md) cho hướng dẫn chi tiết cài đặt

## 📄 License

MIT License - Xem file LICENSE

---

**Version**: 1.0.0  
**Created**: May 9, 2026  
**Updated**: May 9, 2026  
**Status**: Development  
