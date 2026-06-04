# 🚀 Hướng Dẫn Chạy Dự Án

## Quick Start - Lần Sau Chạy Lại

Mở **3 Terminal** và chạy lần lượt:

### Terminal 1: Blockchain (Hardhat Node)
```bash
cd "c:\Users\Admin\Desktop\New folder\blockchain"
npx hardhat node
```
✓ Chờ: `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`

### Terminal 2: Backend API
```bash
cd "c:\Users\Admin\Desktop\New folder\backend"
npm start
```
✓ Chờ: `✓ Blockchain initialized successfully`

### Terminal 3: Frontend React
```bash
cd "c:\Users\Admin\Desktop\New folder\frontend"
npm start
```
✓ Tự động mở `http://localhost:3000`

---

## Cấu Hình MetaMask (Lần Đầu)

1. **Thêm Hardhat Network:**
   - Network Name: `Hardhat`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

3. **Kết nối Frontend:**
   - Refresh trang
   - Click "Connect Wallet"
   - Chọn account đã import

---

## Các Ports

- **Blockchain**: http://127.0.0.1:8545
- **Backend**: http://localhost:5000/api/health
- **Frontend**: http://localhost:3000

---

## Kiểm Tra Kết Nối

✓ All 3 terminals chạy
✓ MetaMask connected
✓ Frontend shows "Connected" 🎉
