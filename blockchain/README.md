# Blockchain - Smart Contracts

## 📜 DiplomaManager Smart Contract

Smart contract chính để quản lý văn bằng trên blockchain Ethereum.

### Tính Năng

1. **Cấp Văn Bằng** (`issueDiploma`)
   - Cấp văn bằng cho một người dùng
   - Lưu trữ IPFS hash của tài liệu
   - Yêu cầu authorization từ issuer

2. **Xác Minh** (`verifyDiploma`)
   - Xác minh tính xác thực của văn bằng
   - Chỉ verifier được phép
   - Ghi lại thời gian xác minh

3. **Ký Điện Tử** (`signDocument`)
   - Ký một tài liệu
   - Lưu trữ chữ ký và vai trò
   - Hỗ trợ nhiều chữ ký

4. **Chia Sẻ** (`grantPermission`, `revokePermission`)
   - Cấp quyền xem/xác minh
   - Thiết lập thời hạn quyền
   - Thu hồi quyền truy cập

### Cấu Trúc Data

```solidity
struct Diploma {
    bytes32 documentHash;      // Hash của tài liệu
    address issuer;            // Người cấp
    address owner;             // Chủ sở hữu
    uint256 issuedDate;        // Ngày cấp
    string documentURI;        // IPFS URI
    bool isVerified;           // Trạng thái xác minh
    string documentType;       // Loại tài liệu
}

struct Signature {
    address signer;            // Người ký
    bytes signature;           // Chữ ký
    uint256 signedDate;        // Ngày ký
    string role;               // Vai trò
}

struct SharePermission {
    address grantee;           // Người được cấp
    uint256 grantDate;         // Ngày cấp
    uint256 expiryDate;        // Hết hạn
    bool canView;              // Xem
    bool canVerify;            // Xác minh
}
```

### Cài Đặt & Deployment

**1. Cài Đặt Dependencies:**
```bash
npm install
```

**2. Cấu Hình Hardhat:**
```js
// hardhat.config.js
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

**3. Deploy Smart Contract:**
```bash
# Compile
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

**4. Lưu Contract Address:**
Sau khi deploy thành công, copy contract address và lưu vào `.env`:
```
CONTRACT_ADDRESS=0x...
```

### Quyền Hạn (Access Control)

- **Admin**: Thêm/xóa issuer, verifier
- **Issuer**: Cấp ván bằng, ký
- **Verifier**: Xác minh tài liệu
- **Owner**: Quản lý tài liệu của mình, chia sẻ

### Events

```solidity
event DiplomaIssued(bytes32 indexed documentHash, ...);
event DiplomaVerified(bytes32 indexed documentHash, ...);
event DocumentSigned(bytes32 indexed documentHash, ...);
event PermissionGranted(bytes32 indexed documentHash, ...);
event PermissionRevoked(bytes32 indexed documentHash, ...);
```

### Gas Optimization

- Sử dụng `bytes32` cho document hash (tiết kiệm gas)
- Mapping thay vì array cho O(1) lookup
- Packed storage layout
- Optimizer settings: runs = 200

### Kiểm Thử

```bash
# Chạy test suite
npm test

# Chạy test với gas report
REPORT_GAS=true npm test

# Chạy test file cụ thể
npx hardhat test test/diplomamanager.test.js
```

### Bảo Mật

- ✅ Kiểm tra input validation
- ✅ Access control modifiers
- ✅ Re-entrancy safe (không dùng external calls)
- ✅ Integer overflow/underflow safe (Solidity ^0.8.20)

### Deployment Checklist

- [ ] Set contract address in `.env`
- [ ] Verify contract on Etherscan
- [ ] Test tất cả functions
- [ ] Add issuer addresses
- [ ] Add verifier addresses
- [ ] Test share permissions
- [ ] Monitor gas usage

---

**Version**: 1.0.0  
**Solidity**: ^0.8.20  
**Network**: Ethereum / Sepolia Testnet
