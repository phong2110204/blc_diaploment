require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==================== Local Storage Setup ====================

const DATA_DIR = path.join(__dirname, 'data');

// Create data directory if it doesn't exist
const initializeDataStorage = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('✓ Data directory created:', DATA_DIR);
    }
};

// Call on startup
initializeDataStorage();

// ==================== Local Storage Functions ====================

const saveDiplomaToFile = (diplomaData) => {
    try {
        const fileName = `diploma_${diplomaData.id}.json`;
        const filePath = path.join(DATA_DIR, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(diplomaData, null, 2));
        console.log(`✓ Diploma saved: ${fileName}`);
        return { success: true, fileName, filePath };
    } catch (error) {
        console.error('✗ Failed to save diploma:', error.message);
        return { success: false, error: error.message };
    }
};

const readDiplomaFromFile = (diplomaId) => {
    try {
        const fileName = `diploma_${diplomaId}.json`;
        const filePath = path.join(DATA_DIR, fileName);
        
        if (!fs.existsSync(filePath)) {
            return { success: false, error: `Diploma file not found: ${fileName}` };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const diplomaData = JSON.parse(content);
        return { success: true, data: diplomaData };
    } catch (error) {
        console.error('✗ Failed to read diploma:', error.message);
        return { success: false, error: error.message };
    }
};

const getAllDiplomas = () => {
    try {
        const files = fs.readdirSync(DATA_DIR);
        const diplomas = [];
        
        for (const file of files) {
            if (file.startsWith('diploma_') && file.endsWith('.json')) {
                const filePath = path.join(DATA_DIR, file);
                const content = fs.readFileSync(filePath, 'utf8');
                diplomas.push(JSON.parse(content));
            }
        }
        
        return { success: true, diplomas };
    } catch (error) {
        console.error('✗ Failed to list diplomas:', error.message);
        return { success: false, error: error.message };
    }
};

// ==================== Blockchain Setup ====================

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

// Load and validate ABI
let CONTRACT_ABI;
try {
    const CONTRACT_ARTIFACT = require('./abi/DiplomaManager.json');
    // Extract ABI - handle both formats: { abi: [...] } and direct array
    CONTRACT_ABI = Array.isArray(CONTRACT_ARTIFACT) ? CONTRACT_ARTIFACT : CONTRACT_ARTIFACT.abi;
    
    if (!Array.isArray(CONTRACT_ABI)) {
        throw new Error(`ABI is not an array. Type: ${typeof CONTRACT_ABI}`);
    }
} catch (error) {
    console.error('✗ Failed to load ABI:', error.message);
    CONTRACT_ABI = [];
}

let provider, signer, contract;
let ADMIN_ADDRESS = '';

const initializeBlockchain = async () => {
    try {
        // Validate configuration
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') {
            throw new Error('CONTRACT_ADDRESS not set in environment variables');
        }
        if (!PRIVATE_KEY || PRIVATE_KEY === '') {
            throw new Error('PRIVATE_KEY not set in environment variables');
        }
        if (CONTRACT_ABI.length === 0) {
            throw new Error('ABI is empty or invalid');
        }

        provider = new ethers.JsonRpcProvider(RPC_URL);
        signer = new ethers.Wallet(PRIVATE_KEY, provider);
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Set admin address from signer
        ADMIN_ADDRESS = signer.address;
        
        // Test the connection
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.warn('⚠️  Warning: No contract found at address. Contract may not be deployed.');
        }
        
        console.log('✓ Blockchain initialized successfully');
        console.log(`   Admin Address: ${ADMIN_ADDRESS}`);
        console.log(`   Contract: ${CONTRACT_ADDRESS}`);
        console.log(`   Provider: ${RPC_URL}`);
    } catch (error) {
        console.error('✗ Blockchain initialization failed:', error.message);
        contract = null;
    }
};

// ==================== Utility Functions ====================

const hashDocument = (data) => {
    return ethers.id(JSON.stringify(data));
};

const verifyDocumentSignature = (message, signature, address) => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
        return false;
    }
};

// Check if contract is initialized
const isContractReady = () => {
    if (!contract) {
        return { ready: false, error: 'Blockchain not initialized' };
    }
    return { ready: true };
};

// ==================== Helper Functions ====================

/**
 * Build signatures array combining local (JSON) and blockchain signatures
 */
const buildSignaturesArray = (diploma, contractData) => {
    const signatures = [];
    
    // Add local issuer signature from JSON file
    if (diploma.issuerSignature && diploma.signatureMessage) {
        signatures.push({
            signer: diploma.issuerAddress || ADMIN_ADDRESS,
            signature: diploma.issuerSignature,
            signedDate: diploma.issueDate ? new Date(diploma.issueDate).getTime() : null,
            role: 'Issuer'
        });
    }
    
    // Add blockchain signatures (if any)
    if (contractData?.signatures && Array.isArray(contractData.signatures)) {
        signatures.push(...contractData.signatures);
    }
    
    console.log(`📋 Returning ${signatures.length} signatures for diploma`);
    return signatures;
};

// ==================== API Routes ====================

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Diploma Management Backend API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            issue: 'POST /api/documents/issue',
            verify: 'POST /api/documents/verify',
            sign: 'POST /api/documents/sign'
        }
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

// Get Configuration (admin address, contract address)
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        adminAddress: ADMIN_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        network: process.env.NETWORK || 'hardhat'
    });
});

// 1. Issue a Diploma - Only admin can issue
app.post('/api/documents/issue', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { ownerAddress, documentURI, documentType, recipientData, issuerAddress, signature, messageToSign } = req.body;

        if (!ownerAddress || !documentURI || !documentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Permission check: Only admin can issue diplomas
        if (issuerAddress) {
            const isAdmin = issuerAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
            if (!isAdmin) {
                console.warn(`Permission denied: ${issuerAddress} tried to issue diploma but only admin can`);
                return res.status(403).json({ 
                    error: 'Only admin can issue diplomas. Your wallet is not authorized to issue.'
                });
            }
        }

        // Generate unique diploma ID
        const diplomaId = `diploma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const issueDate = new Date().toISOString();

        // Create diploma data object to be saved locally
        const diplomaData = {
            id: diplomaId,
            issueDate: issueDate,
            documentType: documentType,
            ownerAddress: ownerAddress,
            issuerAddress: issuerAddress || ADMIN_ADDRESS,
            documentURI: documentURI,
            recipientData: recipientData || {},
            documentHash: null, // Will be updated after blockchain
            transactionHash: null, // Will be updated after blockchain
            createdAt: issueDate,
            issuerSignature: signature || null, // Store the issuer's digital signature
            signatureMessage: messageToSign || null // Store the message that was signed
        };

        // Calculate hash from diploma data
        const documentHash = hashDocument(diplomaData);
        diplomaData.documentHash = documentHash;

        // Save diploma to local JSON file
        const saveResult = saveDiplomaToFile(diplomaData);
        if (!saveResult.success) {
            return res.status(500).json({ error: 'Failed to save diploma locally', details: saveResult.error });
        }

        // Issue diploma on blockchain (send hash)
        const tx = await contract.issueDiploma(
            documentHash,
            ownerAddress,
            documentURI,
            documentType
        );

        await tx.wait();

        // Update diploma data with transaction hash
        diplomaData.transactionHash = tx.hash;
        saveDiplomaToFile(diplomaData);

        // Step 2: Automatically sign the document to add issuer's signature to blockchain
        let signTxHash = null;
        if (signature && messageToSign) {
            try {
                console.log(`📝 Attempting to sign document...`);
                console.log(`   Document Hash: ${documentHash}`);
                console.log(`   Signature Length: ${signature.length}`);
                console.log(`   Message: ${messageToSign}`);
                console.log(`   Role: Issuer`);
                
                const signTx = await contract.signDocument(
                    documentHash,
                    signature,  // The digital signature from MetaMask
                    'Issuer'    // Role
                );
                console.log(`   📤 Transaction sent: ${signTx.hash}`);
                
                await signTx.wait();
                signTxHash = signTx.hash;
                console.log(`✅ Document signed successfully: ${signTxHash}`);
            } catch (signError) {
                console.error('❌ Could not sign document automatically:', signError.message);
                console.error('   Error details:', signError);
                // Don't fail the entire issue if signing fails
            }
        } else {
            console.warn('⚠️  No signature provided to auto-sign document');
            if (!signature) console.warn('   Missing: signature');
            if (!messageToSign) console.warn('   Missing: messageToSign');
        }

        res.json({
            success: true,
            message: 'Diploma issued successfully',
            diplomaId: diplomaId,
            documentHash: documentHash,
            transactionHash: tx.hash,
            signatureTransactionHash: signTxHash, // Return signature tx hash
            owner: ownerAddress,
            documentType: documentType,
            issueDate: issueDate,
            fileName: saveResult.fileName,
            hasSigner: !!signTxHash
        });
    } catch (error) {
        console.error('Issue Diploma Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Verify a Diploma - Only admin can verify
app.post('/api/documents/verify', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { documentHash, isVerified, verifierAddress } = req.body;

        if (!documentHash) {
            return res.status(400).json({ error: 'Document hash is required' });
        }

        // Permission check: Only admin can verify diplomas
        if (verifierAddress) {
            const isAdmin = verifierAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
            if (!isAdmin) {
                console.warn(`Permission denied: ${verifierAddress} tried to verify diploma but only admin can`);
                return res.status(403).json({ 
                    error: 'Only admin can verify diplomas. Your wallet is not authorized to verify.'
                });
            }
        }

        // Verify on blockchain
        const tx = await contract.verifyDiploma(documentHash, isVerified);
        await tx.wait();

        // Update local diploma file with verification status
        const result = getAllDiplomas();
        if (result.success) {
            const diploma = result.diplomas.find(d => d.documentHash === documentHash);
            if (diploma) {
                diploma.isVerified = isVerified;
                diploma.verificationTx = tx.hash;
                diploma.verificationDate = new Date().toISOString();
                saveDiplomaToFile(diploma);
            }
        }

        res.json({
            success: true,
            message: `Document ${isVerified ? 'verified' : 'unverified'} successfully`,
            documentHash: documentHash,
            transactionHash: tx.hash,
            isVerified: isVerified
        });
    } catch (error) {
        console.error('Verify Diploma Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Sign a Document
app.post('/api/documents/sign', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { documentHash, signature, role } = req.body;

        if (!documentHash || !signature || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const tx = await contract.signDocument(
            documentHash,
            signature,
            role
        );

        await tx.wait();

        res.json({
            success: true,
            message: 'Document signed successfully',
            documentHash: documentHash,
            role: role,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Sign Document Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Grant Permission
app.post('/api/documents/grant-permission', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { documentHash, granteeAddress, expiryDays, canView, canVerify } = req.body;

        if (!documentHash || !granteeAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const expiryDate = Math.floor(Date.now() / 1000) + (expiryDays || 30) * 86400;

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
            message: 'Permission granted successfully',
            documentHash: documentHash,
            grantee: granteeAddress,
            expiryDate: new Date(expiryDate * 1000),
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Grant Permission Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Revoke Permission
app.post('/api/documents/revoke-permission', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { documentHash, granteeAddress } = req.body;

        if (!documentHash || !granteeAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const tx = await contract.revokePermission(documentHash, granteeAddress);
        await tx.wait();

        res.json({
            success: true,
            message: 'Permission revoked successfully',
            documentHash: documentHash,
            grantee: granteeAddress,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Revoke Permission Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Get Document (from local storage by hash) - with permission check
app.get('/api/documents/:documentHash', async (req, res) => {
    try {
        const { documentHash } = req.params;
        const { userAddress } = req.query;

        if (!documentHash) {
            return res.status(400).json({ error: 'Document hash is required' });
        }

        // Search for diploma with matching hash in local storage
        const result = getAllDiplomas();
        if (!result.success) {
            console.error('Failed to get diplomas:', result.error);
            return res.status(500).json({ error: result.error });
        }

        console.log(`Searching for document hash: ${documentHash}, Found ${result.diplomas.length} total diplomas`);

        const diploma = result.diplomas.find(d => d.documentHash === documentHash);
        
        if (!diploma) {
            console.warn(`Document not found with hash: ${documentHash}`);
            return res.status(404).json({ 
                error: `Document not found with hash: ${documentHash}`
            });
        }

        // Permission check: Only owner or admin can access
        if (userAddress) {
            const isOwner = diploma.ownerAddress && diploma.ownerAddress.toLowerCase() === userAddress.toLowerCase();
            const isAdmin = userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
            
            if (!isOwner && !isAdmin) {
                console.warn(`Permission denied for user ${userAddress} to access document ${documentHash}`);
                return res.status(403).json({ 
                    error: 'You do not have permission to access this document'
                });
            }
        }

        // Try to get detailed info from smart contract
        let contractData = null;
        if (contract) {
            try {
                const documentRecord = await contract.documents(documentHash);
                if (documentRecord && documentRecord.diploma && documentRecord.diploma.issuer !== ethers.ZeroAddress) {
                    // Get signatures from contract
                    let signatures = [];
                    let permissions = [];
                    
                    try {
                        const rawSignatures = await contract.getSignatures(documentHash);
                        console.log(`✓ Got ${rawSignatures?.length || 0} signatures for document ${documentHash}`);
                        
                        // Format signatures from blockchain
                        signatures = rawSignatures.map(sig => ({
                            signer: sig.signer,
                            signature: sig.signature,  // Already hex format from ethers
                            signedDate: sig.signedDate ? Number(sig.signedDate) * 1000 : null,  // Convert to milliseconds
                            role: sig.role
                        }));
                        
                        console.log('Formatted signatures:', JSON.stringify(signatures, null, 2));
                    } catch (sigError) {
                        console.warn('Could not fetch signatures:', sigError.message);
                    }

                    contractData = {
                        issuer: documentRecord.diploma.issuer,
                        isVerified: documentRecord.diploma.isVerified,
                        createdAt: documentRecord.createdAt ? Number(documentRecord.createdAt) * 1000 : null,
                        updatedAt: documentRecord.updatedAt ? Number(documentRecord.updatedAt) * 1000 : null,
                        signatures: signatures || [],
                        permissions: permissions || []
                    };
                }
            } catch (contractError) {
                console.warn('Could not fetch data from smart contract:', contractError.message);
            }
        }

        res.json({
            success: true,
            diploma: {
                id: diploma.id,
                documentHash: diploma.documentHash,
                issuer: contractData?.issuer || diploma.issuerAddress || ADMIN_ADDRESS,
                owner: diploma.ownerAddress,
                documentType: diploma.documentType,
                documentURI: diploma.documentURI,
                issueDate: diploma.issueDate,
                isVerified: contractData?.isVerified !== undefined ? contractData.isVerified : (diploma.isVerified || false),
                transactionHash: diploma.transactionHash,
                recipientData: diploma.recipientData || {},
                createdAt: diploma.createdAt,
                updatedAt: contractData?.updatedAt || null
            },
            signatures: buildSignaturesArray(diploma, contractData),
            permissions: contractData?.permissions || []
        });
    } catch (error) {
        console.error('Get Document Error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// 7. Get User Documents (from local storage)
app.get('/api/documents/user/:userAddress', async (req, res) => {
    try {
        const { userAddress } = req.params;

        if (!userAddress) {
            return res.status(400).json({ error: 'User address is required' });
        }

        console.log(`\n📋 Getting documents for user: ${userAddress}`);

        // Get all diplomas from local storage
        const result = getAllDiplomas();
        if (!result.success) {
            console.error('Failed to get all diplomas:', result.error);
            return res.status(500).json({ error: result.error });
        }

        console.log(`Found total diplomas: ${result.diplomas.length}`);
        
        // Check if user is admin
        const isAdmin = userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
        console.log(`User: ${userAddress}, Is Admin: ${isAdmin}`);

        // If admin: get all documents
        // If user: get only documents where they are the owner
        let userDocuments;
        if (isAdmin) {
            userDocuments = result.diplomas;
            console.log(`Admin - showing all ${userDocuments.length} documents`);
        } else {
            userDocuments = result.diplomas.filter(diploma =>
                diploma.ownerAddress && diploma.ownerAddress.toLowerCase() === userAddress.toLowerCase()
            );
            console.log(`User - showing ${userDocuments.length} documents owned`);
        }

        // Format documents to include issuer (default to admin if not set)
        const formattedDocuments = userDocuments.map(doc => ({
            ...doc,
            issuer: doc.issuerAddress || ADMIN_ADDRESS
        }));

        res.json({
            success: true,
            userAddress: userAddress,
            isAdmin: isAdmin,
            documentCount: formattedDocuments.length,
            documents: formattedDocuments
        });
    } catch (error) {
        console.error('Get User Documents Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== Local Diploma Storage Routes ====================

// Debug: List all available hashes
app.get('/api/debug/hashes', (req, res) => {
    try {
        const result = getAllDiplomas();
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        const hashes = result.diplomas.map(d => ({
            id: d.id,
            hash: d.documentHash,
            owner: d.ownerAddress,
            type: d.documentType
        }));

        res.json({
            success: true,
            totalCount: result.diplomas.length,
            hashes: hashes
        });
    } catch (error) {
        console.error('Debug Hashes Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List all local diplomas
app.get('/api/diplomas', (req, res) => {
    try {
        const result = getAllDiplomas();
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({
            success: true,
            count: result.diplomas.length,
            diplomas: result.diplomas
        });
    } catch (error) {
        console.error('Get Diplomas Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific diploma from local storage
app.get('/api/diplomas/:diplomaId', (req, res) => {
    try {
        const { diplomaId } = req.params;

        const result = readDiplomaFromFile(diplomaId);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json({
            success: true,
            diploma: result.data
        });
    } catch (error) {
        console.error('Get Diploma Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify diploma - compare local hash with blockchain
app.post('/api/diplomas/:diplomaId/verify', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { diplomaId } = req.params;

        // Read diploma from local file
        const readResult = readDiplomaFromFile(diplomaId);
        if (!readResult.success) {
            return res.status(404).json({ error: readResult.error });
        }

        const diplomaData = readResult.data;
        const storedHash = diplomaData.documentHash;

        // Calculate fresh hash
        const freshHash = hashDocument(diplomaData);

        // Verify with blockchain if hash matches
        let blockchainVerified = false;
        if (storedHash === freshHash && storedHash) {
            try {
                const isVerified = await contract.isDocumentVerified(storedHash);
                blockchainVerified = isVerified;
            } catch (blockchainError) {
                console.warn('Could not verify with blockchain:', blockchainError.message);
            }
        }

        res.json({
            success: true,
            diplomaId: diplomaId,
            localHashMatch: storedHash === freshHash,
            blockchainVerified: blockchainVerified,
            documentHash: storedHash,
            issueDate: diplomaData.issueDate,
            documentType: diplomaData.documentType,
            ownerAddress: diplomaData.ownerAddress
        });
    } catch (error) {
        console.error('Verify Diploma Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== Blockchain Verification Routes ====================

// 8. Check Document Verification Status
app.get('/api/documents/:documentHash/verification-status', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { documentHash } = req.params;

        const isVerified = await contract.isDocumentVerified(documentHash);

        res.json({
            success: true,
            documentHash: documentHash,
            isVerified: isVerified
        });
    } catch (error) {
        console.error('Check Verification Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 9. Add Issuer
app.post('/api/admin/add-issuer', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { issuerAddress } = req.body;

        if (!issuerAddress) {
            return res.status(400).json({ error: 'Issuer address is required' });
        }

        const tx = await contract.addIssuer(issuerAddress);
        await tx.wait();

        res.json({
            success: true,
            message: 'Issuer added successfully',
            issuer: issuerAddress,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Add Issuer Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 10. Add Verifier
app.post('/api/admin/add-verifier', async (req, res) => {
    try {
        // Check if contract is initialized
        const contractCheck = isContractReady();
        if (!contractCheck.ready) {
            return res.status(503).json({ error: contractCheck.error });
        }

        const { verifierAddress } = req.body;

        if (!verifierAddress) {
            return res.status(400).json({ error: 'Verifier address is required' });
        }

        const tx = await contract.addVerifier(verifierAddress);
        await tx.wait();

        res.json({
            success: true,
            message: 'Verifier added successfully',
            verifier: verifierAddress,
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Add Verifier Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// ==================== Start Server ====================

const PORT = process.env.PORT || 5000;

initializeBlockchain().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Backend server running on port ${PORT}`);
        console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
    });
});

module.exports = app;
