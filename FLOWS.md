# 🎨 Visual Workflows - Sơ Đồ Luồng Hoạt Động

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  BROWSER (http://localhost:3000)               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              React Frontend Application                 │ │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────────────┐ │ │
│  │  │ Dashboard  │  │  Issue   │  │  Share/Verify/View   │ │ │
│  │  └────────────┘  └──────────┘  └──────────────────────┘ │ │
│  │         │              │               │                  │ │
│  │         └──────────────┴───────────────┘                  │ │
│  │                      │                                     │ │
│  │         ┌────────────▼─────────────┐                      │ │
│  │         │   MetaMask Integration   │                      │ │
│  │         │  - Wallet Connection     │                      │ │
│  │         │  - Sign Messages         │                      │ │
│  │         └────────────┬─────────────┘                      │ │
│  └──────────────────────┼──────────────────────────────────┘ │
│                         │                                      │
│                    HTTP API                                    │
│                         │                                      │
│                         ▼                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              Express.js Backend (localhost:5000)              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              API Endpoints                              │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │ /api/documents/issue                              │  │ │
│  │  │ /api/documents/verify                             │  │ │
│  │  │ /api/documents/sign                               │  │ │
│  │  │ /api/documents/grant-permission                   │  │ │
│  │  │ /api/documents/:hash                              │  │ │
│  │  │ /api/documents/user/:address                      │  │ │
│  │  │ /api/admin/add-issuer                             │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  │                      │                                    │ │
│  │         ┌────────────▼─────────────┐                     │ │
│  │         │   Blockchain Layer       │                     │ │
│  │         │  - ethers.js provider    │                     │ │
│  │         │  - Contract interaction  │                     │ │
│  │         │  - RPC calls             │                     │ │
│  │         └────────────┬─────────────┘                     │ │
│  └──────────────────────┼──────────────────────────────────┘ │
│                         │                                      │
│                   JSON-RPC                                     │
│                         │                                      │
│                         ▼                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           Ganache Local Blockchain (localhost:8545)           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         DiplomaManager Smart Contract                   │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ State:                                             │ │ │
│  │  │ - mapping(bytes32 => DocumentRecord) documents    │ │ │
│  │  │ - mapping(address => bytes32[]) userDocuments     │ │ │
│  │  │ - mapping(address => bool) issuers                │ │ │
│  │  │ - mapping(address => bool) verifiers              │ │ │
│  │  │                                                    │ │ │
│  │  │ Functions:                                         │ │ │
│  │  │ - issueDiploma(), verifyDiploma()                 │ │ │
│  │  │ - signDocument(), grantPermission()               │ │ │
│  │  │ - getDiploma(), getSignatures()                   │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                      │                                    │ │
│  │         ┌────────────▼─────────────┐                     │ │
│  │         │  Ganache Blockchain      │                     │ │
│  │         │  - 10 Test Accounts      │                     │ │
│  │         │  - 100 ETH per Account   │                     │ │
│  │         │  - Instant Mining        │                     │ │
│  │         │  - Port: 8545            │                     │ │
│  │         └──────────────────────────┘                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Issue Diploma Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Issue Diploma"                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │ Frontend: Form Page │
           │ - Recipient Name    │
           │ - Wallet Address    │
           │ - Institution       │
           │ - Document Type     │
           │ - Document URI      │
           └────────┬────────────┘
                    │
                    ▼ User fills form
           ┌─────────────────────┐
           │ User clicks Submit  │
           └────────┬────────────┘
                    │
                    ▼
           ┌─────────────────────────────────────┐
           │ Frontend: Sign Message with MetaMask│
           └────────┬────────────────────────────┘
                    │
                    ▼ User confirms in MetaMask
           ┌─────────────────────────────────────┐
           │ Frontend: POST /api/documents/issue │
           │ {                                    │
           │   ownerAddress,                      │
           │   documentURI,                       │
           │   documentType                       │
           │ }                                    │
           └────────┬────────────────────────────┘
                    │
                    ▼
          ┌──────────────────────────────────┐
          │ Backend: Validate Input          │
          │ - Check owner address valid      │
          │ - Check URI not empty            │
          │ - Check type selected            │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌──────────────────────────────────┐
          │ Backend: Create Document Hash    │
          │ hash = ethers.id(JSON.stringify) │
          └────────┬───────────────────────┘
                   │
                   ▼
          ┌──────────────────────────────────┐
          │ Backend: Call Smart Contract     │
          │                                  │
          │ contract.issueDiploma(           │
          │   documentHash,                  │
          │   ownerAddress,                  │
          │   documentURI,                   │
          │   documentType                   │
          │ )                                │
          └────────┬───────────────────────┘
                   │
                   ▼
         ┌──────────────────────────────────┐
         │ SmartContract: Validation        │
         │ - Check msg.sender is issuer     │
         │ - Check owner address != 0x0     │
         │ - Check document not exists      │
         └────────┬────────────────────────┘
                  │
                  ▼
         ┌──────────────────────────────────┐
         │ SmartContract: Create Record     │
         │ - Create Diploma struct          │
         │ - Store in mapping               │
         │ - Add to userDocuments array     │
         │ - Update documentCount           │
         └────────┬────────────────────────┘
                  │
                  ▼
         ┌──────────────────────────────────┐
         │ SmartContract: Emit Event        │
         │ DiplomaIssued(                   │
         │   documentHash,                  │
         │   issuer,                        │
         │   owner,                         │
         │   documentType,                  │
         │   timestamp                      │
         │ )                                │
         └────────┬────────────────────────┘
                  │
                  ▼ Transaction mined
         ┌──────────────────────────────────┐
         │ Ganache: Add to Blockchain       │
         │ - Add transaction                │
         │ - Mine block                     │
         │ - Update state                   │
         │ - Return receipt                 │
         └────────┬────────────────────────┘
                  │
                  ▼
         ┌──────────────────────────────────┐
         │ Backend: Return Response         │
         │ {                                │
         │   success: true,                 │
         │   documentHash,                  │
         │   transactionHash,               │
         │   owner,                         │
         │   documentType                   │
         │ }                                │
         └────────┬────────────────────────┘
                  │
                  ▼
         ┌──────────────────────────────────┐
         │ Frontend: Show Success           │
         │ - Display message                │
         │ - Show transaction hash          │
         │ - Redirect to ViewDocument       │
         │ - Display issued diploma         │
         └──────────────────────────────────┘
```

---

## 3. Share Document Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Share" on Document                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
           ┌──────────────────────┐
           │ Frontend: Share Form │
           │ - Recipient Address  │
           │ - Can View Checkbox  │
           │ - Can Verify Checkbox│
           │ - Expiry Days Input  │
           └────────┬─────────────┘
                    │
                    ▼ User fills
           ┌──────────────────────┐
           │ Click "Grant"        │
           └────────┬─────────────┘
                    │
                    ▼
        ┌────────────────────────────────┐
        │ Backend: POST grant-permission │
        │ {                              │
        │   documentHash,                │
        │   granteeAddress,              │
        │   expiryDays: 30,              │
        │   canView: true,               │
        │   canVerify: false             │
        │ }                              │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Backend: Calculate expiryDate  │
        │ expiryDate = now + (30 * 86400)│
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Backend: Call Smart Contract   │
        │                                │
        │ contract.grantPermission(      │
        │   documentHash,                │
        │   granteeAddress,              │
        │   expiryDate,                  │
        │   canView,                     │
        │   canVerify                    │
        │ )                              │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ SmartContract: Validation      │
        │ - Check msg.sender == owner    │
        │ - Check grantee address valid  │
        │ - Check expiry in future       │
        │ - Check at least 1 permission  │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ SmartContract: Add Permission  │
        │ - Create SharePermission       │
        │ - Add to permissions array     │
        │ - Update timestamp             │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ SmartContract: Emit Event      │
        │ PermissionGranted(...)         │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Ganache: Mine Block            │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Backend: Return Success        │
        │ {                              │
        │   success: true,               │
        │   grantee,                     │
        │   expiryDate                   │
        │ }                              │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Frontend: Show Success         │
        │ - Update share list            │
        │ - Show grantee                 │
        │ - Display expiry date          │
        └────────────────────────────────┘

LATER:
Grantee tries to view document

        ┌────────────────────────────────┐
        │ Grantee: GET /api/documents/:h │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Backend: Check hasPermission   │
        │ - Is owner? NO                 │
        │ - Is admin? NO                 │
        │ - In permissions? YES ✓        │
        │ - canView = true? YES ✓        │
        │ - Not expired? YES ✓           │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Return: Document Details ✓     │
        └────────────────────────────────┘
```

---

## 4. Verify Document Flow

```
┌─────────────────────────────────────────┐
│ VERIFIER: Click "Verify Document"       │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Frontend: Verify    │
        │ Form - Enter Hash   │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ Backend: POST /verify           │
        │ {                               │
        │   documentHash,                 │
        │   isVerified: true              │
        │ }                               │
        └────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ SmartContract: verifyDiploma()  │
        │                                 │
        │ - Check msg.sender is verifier  │
        │ - Check document exists         │
        │ - Set isVerified = true         │
        │ - Update timestamp              │
        │ - Emit DiplomaVerified event    │
        └────────┬────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ Frontend: Show Verified Badge ✓ │
        └─────────────────────────────────┘
```

---

## 5. Sign Document Flow

```
┌──────────────────────────────────┐
│ USER: Click "Sign Document"      │
└────────┬─────────────────────────┘
         │
         ▼
    ┌────────────────────────┐
    │ Frontend: Create msg   │
    │ msg = "Sign:[hash]"    │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ Frontend: Open MetaMask        │
    │ - Request signature            │
    │ - Show message to sign         │
    └────────┬───────────────────────┘
             │
             ▼ User approves
    ┌────────────────────────────────┐
    │ MetaMask: Sign Message         │
    │ signature = sign(message)      │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ Frontend: Send Signature       │
    │ POST /api/documents/sign       │
    │ {                              │
    │   documentHash,                │
    │   signature,                   │
    │   role: "Issuer"               │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ Backend: Call Smart Contract   │
    │ contract.signDocument(...)     │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ SmartContract: Add Signature   │
    │ - Create Signature struct      │
    │ - Add to signatures array      │
    │ - Emit DocumentSigned event    │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ Frontend: Show Signed Badge ✓  │
    │ - Display signer info          │
    │ - Show role                    │
    │ - Show signed date             │
    └────────────────────────────────┘
```

---

## 6. Permission Check Flow

```
REQUEST: GET /api/documents/:hash
from address: 0x123...

         ┌──────────────────────────┐
         │ Backend: hasPermission() │
         └────────┬─────────────────┘
                  │
         ┌────────▼─────────┐
         │ Check condition  │
         └────────┬─────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
   Is Owner?  Is Admin?  Shared with?
      │           │           │
   ✓ YES      ✓ YES      ✓ Check:
   │           │         - In permissions[]
   │           │         - canView = true
   │           │         - expiry > now
   │           │           │
   │           │         ✓ YES
   │           │           │
   └───────────┴───────────┘
               │
               ▼
      Return: Document ✓
      
      OR
      
      Return: Error 403 ✗
```

---

## 7. State Transition Diagram

```
Document States:

  CREATED
    │
    ├─► Issue Diploma ──────────────────┐
    │                                   │
    │                                   ▼
    │                            ISSUED (isVerified=false)
    │                                   │
    │       ┌───────────────────────────┤
    │       │                           │
    │       ▼                           ▼
    │   Add Signatures            Verify Diploma
    │       │                           │
    │       ▼                           ▼
    │   SIGNED                   VERIFIED (isVerified=true)
    │                                   │
    └───────┼───────────────────────────┘
            │
            ▼
        SHARED (permissions granted)
            │
            ├─► EXPIRED (after expiryDate)
            │
            └─► REVOKED (permission revoked)
```

---

**Created: May 9, 2026**
**Version: 1.0**
