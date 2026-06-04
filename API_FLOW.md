# 📡 API Request/Response Flow

## 1️⃣ Issue Diploma Request Flow

### Frontend → Backend → Smart Contract → Blockchain

**Frontend Call:**
```javascript
// src/pages/IssueDiploma.js
await documentService.issueDiploma(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
  "QmXxxx...",
  "Bachelor Degree"
);
```

**HTTP Request:**
```http
POST /api/documents/issue HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "ownerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
  "documentURI": "QmXxxx...",
  "documentType": "Bachelor Degree"
}
```

**Backend Processing:**
```javascript
// backend/server.js
app.post('/api/documents/issue', async (req, res) => {
  // 1. Validate input
  const { ownerAddress, documentURI, documentType } = req.body;
  
  // 2. Create hash
  const documentHash = ethers.id(JSON.stringify({
    owner: ownerAddress,
    uri: documentURI,
    type: documentType,
    timestamp: Date.now()
  }));
  
  // 3. Call smart contract
  const tx = await contract.issueDiploma(
    documentHash,
    ownerAddress,
    documentURI,
    documentType
  );
  
  // 4. Wait for transaction
  await tx.wait();
  
  // 5. Return response
  res.json({
    success: true,
    documentHash,
    transactionHash: tx.hash
  });
});
```

**Smart Contract Call:**
```solidity
// blockchain/contracts/DiplomaManager.sol
function issueDiploma(
    bytes32 _documentHash,
    address _owner,
    string memory _documentURI,
    string memory _documentType
) public onlyIssuer {
    // Validation
    require(_owner != address(0), "Invalid owner");
    require(documents[_documentHash].diploma.issuer == address(0), "Already exists");
    
    // Create diploma
    Diploma memory newDiploma = Diploma({
        documentHash: _documentHash,
        issuer: msg.sender,
        owner: _owner,
        issuedDate: block.timestamp,
        documentURI: _documentURI,
        isVerified: false,
        documentType: _documentType
    });
    
    // Store
    documents[_documentHash].diploma = newDiploma;
    userDocuments[_owner].push(_documentHash);
    
    // Event
    emit DiplomaIssued(_documentHash, msg.sender, _owner, _documentType, block.timestamp);
}
```

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Diploma issued successfully",
  "documentHash": "0x1234567890abcdef...",
  "transactionHash": "0xabcdef1234567890...",
  "owner": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
  "documentType": "Bachelor Degree"
}
```

**Frontend Response Handler:**
```javascript
// src/pages/IssueDiploma.js
try {
  const result = await documentService.issueDiploma(...);
  
  setSuccess(true);
  console.log("Diploma issued:", result.documentHash);
  
  // Redirect to view page
  setTimeout(() => {
    navigate(`/view/${result.documentHash}`);
  }, 2000);
} catch (error) {
  setError(error.message);
}
```

---

## 2️⃣ Get Document Request Flow

### Frontend → Backend → Smart Contract (Read-Only)

**Frontend Call:**
```javascript
// src/pages/ViewDocument.js
const diploma = await documentService.getDocument(documentHash);
```

**HTTP Request:**
```http
GET /api/documents/0x1234567890abcdef... HTTP/1.1
Host: localhost:5000
```

**Backend Processing:**
```javascript
// backend/server.js
app.get('/api/documents/:documentHash', async (req, res) => {
  const { documentHash } = req.params;
  
  try {
    // Call read-only functions
    const diploma = await contract.getDiploma(documentHash);
    const signatures = await contract.getSignatures(documentHash);
    const fullRecord = await contract.getFullDocumentRecord(documentHash);
    
    // Format response
    res.json({
      success: true,
      diploma: {
        documentHash: diploma.documentHash,
        issuer: diploma.issuer,
        owner: diploma.owner,
        issuedDate: new Date(Number(diploma.issuedDate) * 1000),
        documentURI: diploma.documentURI,
        isVerified: diploma.isVerified,
        documentType: diploma.documentType
      },
      signatures: signatures.map(sig => ({
        signer: sig.signer,
        role: sig.role,
        signedDate: new Date(Number(sig.signedDate) * 1000)
      })),
      createdAt: new Date(Number(fullRecord.createdAt) * 1000),
      updatedAt: new Date(Number(fullRecord.updatedAt) * 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Smart Contract Calls (View Functions):**
```solidity
function getDiploma(bytes32 _documentHash)
    public view
    documentExists(_documentHash)
    hasPermission(_documentHash)
    returns (Diploma memory)
{
    return documents[_documentHash].diploma;
}

function getSignatures(bytes32 _documentHash)
    public view
    documentExists(_documentHash)
    hasPermission(_documentHash)
    returns (Signature[] memory)
{
    return documents[_documentHash].signatures;
}

function getFullDocumentRecord(bytes32 _documentHash)
    public view
    documentExists(_documentHash)
    hasPermission(_documentHash)
    returns (...)
{
    DocumentRecord storage record = documents[_documentHash];
    return (
        record.diploma,
        record.signatures,
        record.createdAt,
        record.updatedAt
    );
}
```

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "diploma": {
    "documentHash": "0x1234567890abcdef...",
    "issuer": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
    "owner": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
    "issuedDate": "2026-05-09T10:00:00.000Z",
    "documentURI": "QmXxxx...",
    "isVerified": false,
    "documentType": "Bachelor Degree"
  },
  "signatures": [
    {
      "signer": "0x742d35Cc6634C0532925a3b844Bc9e7595f1bEb",
      "role": "Issuer",
      "signedDate": "2026-05-09T10:05:00.000Z"
    }
  ],
  "createdAt": "2026-05-09T10:00:00.000Z",
  "updatedAt": "2026-05-09T10:05:00.000Z"
}
```

---

## 3️⃣ Grant Permission Request Flow

**HTTP Request:**
```http
POST /api/documents/grant-permission HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "documentHash": "0x1234567890abcdef...",
  "granteeAddress": "0x987654321fedcba0...",
  "expiryDays": 30,
  "canView": true,
  "canVerify": false
}
```

**Backend Processing:**
```javascript
app.post('/api/documents/grant-permission', async (req, res) => {
  const { documentHash, granteeAddress, expiryDays, canView, canVerify } = req.body;
  
  // Calculate expiry date
  const expiryDate = Math.floor(Date.now() / 1000) + (expiryDays || 30) * 86400;
  
  // Call smart contract
  const tx = await contract.grantPermission(
    documentHash,
    granteeAddress,
    expiryDate,
    canView !== false,
    canVerify || false
  );
  
  await tx.wait();
  
  res.json({
    success: true,
    documentHash,
    grantee: granteeAddress,
    expiryDate: new Date(expiryDate * 1000),
    transactionHash: tx.hash
  });
});
```

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Permission granted successfully",
  "documentHash": "0x1234567890abcdef...",
  "grantee": "0x987654321fedcba0...",
  "expiryDate": "2026-06-08T10:00:00.000Z",
  "transactionHash": "0xabcdef1234567890..."
}
```

---

## 4️⃣ Verify Diploma Request Flow

**HTTP Request:**
```http
POST /api/documents/verify HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "documentHash": "0x1234567890abcdef...",
  "isVerified": true
}
```

**Smart Contract:**
```solidity
function verifyDiploma(bytes32 _documentHash, bool _isVerified)
    public
    onlyVerifier
    documentExists(_documentHash)
{
    documents[_documentHash].diploma.isVerified = _isVerified;
    documents[_documentHash].updatedAt = block.timestamp;
    emit DiplomaVerified(_documentHash, msg.sender, _isVerified, block.timestamp);
}
```

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Document verified successfully",
  "documentHash": "0x1234567890abcdef...",
  "transactionHash": "0xabcdef1234567890..."
}
```

---

## 5️⃣ Error Response Examples

### Invalid Input
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Missing required fields"
}
```

### Unauthorized
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Only document owner can perform this action"
}
```

### Smart Contract Error
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Only authorized verifiers can verify",
  "message": "Execution reverted"
}
```

### Blockchain Connection Error
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Blockchain initialization failed",
  "message": "Failed to connect to RPC URL"
}
```

---

## 📊 Request/Response Timing

```
Frontend                Backend              SmartContract      Blockchain
   │                       │                      │                 │
   ├──POST /api/──────────►│                      │                 │
   │                       │                      │                 │
   │                       ├─Validate─────────────►│                 │
   │                       │ (~10ms)               │                 │
   │                       │                      ├─Check Access─────►
   │                       │                      │ (~20ms)          │
   │                       │◄─Valid────────────────│                 │
   │                       │                      │                 │
   │                       ├─Call Contract────────►│                 │
   │                       │ (~50ms)               │                 │
   │                       │                      ├─Execute────────►
   │                       │                      │                 │
   │                       │                      │ (~100ms mining)  │
   │                       │                      │◄─Mined─────────-─
   │                       │◄─TxHash──────────────│                 │
   │                       │ (~20ms)               │                 │
   │◄──200 OK with TxHash──│                      │                 │
   │ (~10ms)               │                      │                 │
   │                       │                      │                 │
   Total: ~250-300ms       │                      │                 │
```

### Read Request (No Transaction)
```
Frontend                Backend              SmartContract
   │                       │                      │
   ├──GET /api/docs────────►│                      │
   │                       │                      │
   │                       ├─Call getDiploma─────►│
   │                       │ (~5ms)                │
   │                       │◄─Return─────────────-│
   │                       │                      │
   │◄──200 OK with Data────│                      │
   │ (~10ms)               │                      │
   │                       │                      │
   Total: ~50-100ms
```

---

## 🔄 Common Workflows Timeline

### 1. Create & Verify Diploma
```
0ms     ─ User clicks Issue
100ms   ─ MetaMask signs message
200ms   ─ POST /api/documents/issue
300ms   ─ Smart contract executes
400ms   ─ Ganache mines block (instant, but ~1s in real blockchain)
500ms   ─ Response returned
600ms   ─ Frontend redirects to View
700ms   ─ Verifier clicks Verify
800ms   ─ POST /api/documents/verify
900ms   ─ Smart contract updates isVerified=true
1000ms  ─ Ganache mines block
1100ms  ─ Response returned
1200ms  ─ Status changes to "Verified ✓"
```

### 2. Share Document
```
0ms     ─ Owner clicks Share
100ms   ─ Fill share form
200ms   ─ POST /api/documents/grant-permission
300ms   ─ Calculate expiry date
400ms   ─ Call smart contract
500ms   ─ Mine block
600ms   ─ Response returned
700ms   ─ Permission granted ✓
```

### 3. View Shared Document (As Grantee)
```
0ms     ─ Grantee enters document hash
100ms   ─ GET /api/documents/:hash
200ms   ─ Backend checks permissions
300ms   ─ Smart contract validates access
400ms   ─ Response returned (success or denied)
500ms   ─ Display document or error
```

---

## 🎯 Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| Issue | 200-300ms | + MetaMask confirm |
| Verify | 100-150ms | Read-only call |
| Share | 100-150ms | Add to array |
| View | 50-100ms | Read-only call |
| Sign | 150-200ms | + MetaMask confirm |

---

## 🔗 API Endpoints Summary

| Method | Endpoint | Time | Type |
|--------|----------|------|------|
| POST | /api/documents/issue | 300ms | Write |
| POST | /api/documents/verify | 150ms | Write |
| POST | /api/documents/sign | 200ms | Write |
| POST | /api/documents/grant-permission | 150ms | Write |
| POST | /api/documents/revoke-permission | 150ms | Write |
| GET | /api/documents/:hash | 80ms | Read |
| GET | /api/documents/user/:addr | 100ms | Read |
| GET | /api/documents/:hash/verify-status | 60ms | Read |
| POST | /api/admin/add-issuer | 150ms | Write |
| POST | /api/admin/add-verifier | 150ms | Write |

---

**Created: May 9, 2026**
**Version: 1.0**
