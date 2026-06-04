// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DiplomaManager
 * @dev Hệ thống quản lý văn bằng blockchain với xác minh, ký điện tử và chia sẻ
 */
contract DiplomaManager {
    
    // ==================== Struct Definitions ====================
    
    struct Diploma {
        bytes32 documentHash;      // Hash của tài liệu
        address issuer;            // Người cấp bằng
        address owner;             // Chủ sở hữu bằng
        uint256 issuedDate;        // Ngày cấp
        string documentURI;        // URI lưu trữ tài liệu (IPFS/Arweave)
        bool isVerified;           // Trạng thái xác minh
        string documentType;       // Loại tài liệu
    }

    struct Signature {
        address signer;            // Người ký
        bytes signature;           // Chữ ký
        uint256 signedDate;        // Ngày ký
        string role;               // Vai trò của người ký
    }

    struct SharePermission {
        address grantee;           // Người được cấp quyền
        uint256 grantDate;         // Ngày cấp quyền
        uint256 expiryDate;        // Ngày hết hạn quyền
        bool canView;              // Có thể xem
        bool canVerify;            // Có thể xác minh
    }

    struct DocumentRecord {
        Diploma diploma;
        Signature[] signatures;
        SharePermission[] permissions;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ==================== State Variables ====================
    
    mapping(bytes32 => DocumentRecord) public documents;
    mapping(address => bytes32[]) public userDocuments;
    mapping(address => bool) public verifiers;
    mapping(address => bool) public issuers;
    
    address public admin;
    uint256 public documentCount;

    bytes32[] public allDocumentHashes;

    // ==================== Events ====================
    
    event DiplomaIssued(
        bytes32 indexed documentHash,
        address indexed issuer,
        address indexed owner,
        string documentType,
        uint256 timestamp
    );

    event DiplomaVerified(
        bytes32 indexed documentHash,
        address indexed verifier,
        bool isVerified,
        uint256 timestamp
    );

    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        string role,
        uint256 timestamp
    );

    event PermissionGranted(
        bytes32 indexed documentHash,
        address indexed owner,
        address indexed grantee,
        uint256 expiryDate,
        uint256 timestamp
    );

    event PermissionRevoked(
        bytes32 indexed documentHash,
        address indexed owner,
        address indexed grantee,
        uint256 timestamp
    );

    event IssuerAdded(address indexed issuer, uint256 timestamp);
    event VerifierAdded(address indexed verifier, uint256 timestamp);
    event IssuerRemoved(address indexed issuer, uint256 timestamp);
    event VerifierRemoved(address indexed verifier, uint256 timestamp);

    // ==================== Modifiers ====================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyIssuer() {
        require(issuers[msg.sender], "Only authorized issuers can issue documents");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Only authorized verifiers can verify");
        _;
    }

    modifier onlyDocumentOwner(bytes32 documentHash) {
        require(
            documents[documentHash].diploma.owner == msg.sender,
            "Only document owner can perform this action"
        );
        _;
    }

    modifier documentExists(bytes32 documentHash) {
        require(documents[documentHash].diploma.issuer != address(0), "Document does not exist");
        _;
    }

    modifier hasPermission(bytes32 documentHash) {
        DocumentRecord storage record = documents[documentHash];
        require(
            msg.sender == record.diploma.owner || 
            msg.sender == admin ||
            _checkSharePermission(documentHash, msg.sender),
            "No permission to access this document"
        );
        _;
    }

    // ==================== Constructor ====================
    
    constructor() {
        admin = msg.sender;
        issuers[msg.sender] = true;
        verifiers[msg.sender] = true;
        emit IssuerAdded(msg.sender, block.timestamp);
        emit VerifierAdded(msg.sender, block.timestamp);
    }

    // ==================== Admin Functions ====================
    
    function addIssuer(address _issuer) public onlyAdmin {
        require(_issuer != address(0), "Invalid issuer address");
        require(!issuers[_issuer], "Already an issuer");
        issuers[_issuer] = true;
        emit IssuerAdded(_issuer, block.timestamp);
    }

    function removeIssuer(address _issuer) public onlyAdmin {
        require(issuers[_issuer], "Not an issuer");
        require(_issuer != admin, "Cannot remove admin");
        issuers[_issuer] = false;
        emit IssuerRemoved(_issuer, block.timestamp);
    }

    function addVerifier(address _verifier) public onlyAdmin {
        require(_verifier != address(0), "Invalid verifier address");
        require(!verifiers[_verifier], "Already a verifier");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier, block.timestamp);
    }

    function removeVerifier(address _verifier) public onlyAdmin {
        require(verifiers[_verifier], "Not a verifier");
        require(_verifier != admin, "Cannot remove admin");
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier, block.timestamp);
    }

    // ==================== Document Functions ====================
    
    /**
     * @dev Cấp một tài liệu mới - Chỉ admin mới có thể cấp
     */
    function issueDiploma(
        bytes32 _documentHash,
        address _owner,
        string memory _documentURI,
        string memory _documentType
    ) public onlyAdmin {
        require(_owner != address(0), "Invalid owner address");
        require(documents[_documentHash].diploma.issuer == address(0), "Document already exists");
        require(bytes(_documentURI).length > 0, "Document URI cannot be empty");

        Diploma memory newDiploma = Diploma({
            documentHash: _documentHash,
            issuer: msg.sender,
            owner: _owner,
            issuedDate: block.timestamp,
            documentURI: _documentURI,
            isVerified: false,
            documentType: _documentType
        });

        documents[_documentHash].diploma = newDiploma;
        documents[_documentHash].createdAt = block.timestamp;
        documents[_documentHash].updatedAt = block.timestamp;

        userDocuments[_owner].push(_documentHash);
        allDocumentHashes.push(_documentHash);
        documentCount++;

        emit DiplomaIssued(_documentHash, msg.sender, _owner, _documentType, block.timestamp);
    }

    /**
     * @dev Xác minh tính xác thực của tài liệu - Chỉ admin mới có thể xác minh
     */
    function verifyDiploma(bytes32 _documentHash, bool _isVerified)
        public
        onlyAdmin
        documentExists(_documentHash)
    {
        documents[_documentHash].diploma.isVerified = _isVerified;
        documents[_documentHash].updatedAt = block.timestamp;
        emit DiplomaVerified(_documentHash, msg.sender, _isVerified, block.timestamp);
    }

    /**
     * @dev Ký một tài liệu
     */
    function signDocument(
        bytes32 _documentHash,
        bytes memory _signature,
        string memory _role
    ) public documentExists(_documentHash) {
        require(
            msg.sender == documents[_documentHash].diploma.issuer ||
            msg.sender == documents[_documentHash].diploma.owner ||
            verifiers[msg.sender],
            "Not authorized to sign"
        );

        Signature memory newSignature = Signature({
            signer: msg.sender,
            signature: _signature,
            signedDate: block.timestamp,
            role: _role
        });

        documents[_documentHash].signatures.push(newSignature);
        documents[_documentHash].updatedAt = block.timestamp;

        emit DocumentSigned(_documentHash, msg.sender, _role, block.timestamp);
    }

    // ==================== Share & Permission Functions ====================
    
    /**
     * @dev Cấp quyền truy cập cho một địa chỉ khác
     */
    function grantPermission(
        bytes32 _documentHash,
        address _grantee,
        uint256 _expiryDate,
        bool _canView,
        bool _canVerify
    ) public onlyDocumentOwner(_documentHash) documentExists(_documentHash) {
        require(_grantee != address(0), "Invalid grantee address");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        require(_canView || _canVerify, "Must grant at least one permission");

        SharePermission memory permission = SharePermission({
            grantee: _grantee,
            grantDate: block.timestamp,
            expiryDate: _expiryDate,
            canView: _canView,
            canVerify: _canVerify
        });

        documents[_documentHash].permissions.push(permission);
        documents[_documentHash].updatedAt = block.timestamp;

        emit PermissionGranted(_documentHash, msg.sender, _grantee, _expiryDate, block.timestamp);
    }

    /**
     * @dev Thu hồi quyền truy cập
     */
    function revokePermission(bytes32 _documentHash, address _grantee)
        public
        onlyDocumentOwner(_documentHash)
        documentExists(_documentHash)
    {
        SharePermission[] storage permissions = documents[_documentHash].permissions;
        for (uint256 i = 0; i < permissions.length; i++) {
            if (permissions[i].grantee == _grantee) {
                permissions[i] = permissions[permissions.length - 1];
                permissions.pop();
                documents[_documentHash].updatedAt = block.timestamp;
                emit PermissionRevoked(_documentHash, msg.sender, _grantee, block.timestamp);
                return;
            }
        }
        revert("Permission not found");
    }

    // ==================== View Functions ====================
    
    /**
     * @dev Lấy thông tin tài liệu
     */
    function getDiploma(bytes32 _documentHash)
        public
        view
        documentExists(_documentHash)
        returns (Diploma memory)
    {
        return documents[_documentHash].diploma;
    }

    /**
     * @dev Lấy các chữ ký của tài liệu
     */
    function getSignatures(bytes32 _documentHash)
        public
        view
        documentExists(_documentHash)
        returns (Signature[] memory)
    {
        return documents[_documentHash].signatures;
    }

    /**
     * @dev Lấy danh sách các tài liệu của người dùng
     */
    function getUserDocuments(address _user)
        public
        view
        returns (bytes32[] memory)
    {
        return userDocuments[_user];
    }

    /**
     * @dev Kiểm tra xác minh của tài liệu
     */
    function isDocumentVerified(bytes32 _documentHash)
        public
        view
        documentExists(_documentHash)
        returns (bool)
    {
        return documents[_documentHash].diploma.isVerified;
    }

    /**
     * @dev Lấy danh sách quyền chia sẻ
     */
    function getSharePermissions(bytes32 _documentHash)
        public
        view
        onlyDocumentOwner(_documentHash)
        documentExists(_documentHash)
        returns (SharePermission[] memory)
    {
        return documents[_documentHash].permissions;
    }

    /**
     * @dev Lấy tất cả tài liệu
     */
    function getAllDocuments() public view returns (bytes32[] memory) {
        return allDocumentHashes;
    }

    /**
     * @dev Lấy thông tin đầy đủ của tài liệu
     */
    function getFullDocumentRecord(bytes32 _documentHash)
        public
        view
        documentExists(_documentHash)
        returns (
            Diploma memory diploma,
            Signature[] memory signatures,
            uint256 createdAt,
            uint256 updatedAt
        )
    {
        DocumentRecord storage record = documents[_documentHash];
        return (
            record.diploma,
            record.signatures,
            record.createdAt,
            record.updatedAt
        );
    }

    // ==================== Internal Functions ====================
    
    /**
     * @dev Kiểm tra quyền chia sẻ
     */
    function _checkSharePermission(bytes32 _documentHash, address _user)
        internal
        view
        returns (bool)
    {
        SharePermission[] storage permissions = documents[_documentHash].permissions;
        for (uint256 i = 0; i < permissions.length; i++) {
            if (permissions[i].grantee == _user && 
                permissions[i].expiryDate > block.timestamp &&
                (permissions[i].canView || permissions[i].canVerify)) {
                return true;
            }
        }
        return false;
    }
}
