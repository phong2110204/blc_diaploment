import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL
});

export const documentService = {
  // Get configuration
  getConfig: async () => {
    const response = await api.get('/config');
    return response.data;
  },

  // Issue a diploma
  issueDiploma: async (ownerAddress, documentURI, documentType, issuerAddress, signature, messageToSign) => {
    const response = await api.post('/documents/issue', {
      ownerAddress,
      documentURI,
      documentType,
      issuerAddress,
      signature,
      messageToSign
    });
    return response.data;
  },

  // Verify a diploma
  verifyDiploma: async (documentHash, isVerified, verifierAddress) => {
    const response = await api.post('/documents/verify', {
      documentHash,
      isVerified,
      verifierAddress
    });
    return response.data;
  },

  // Sign a document
  signDocument: async (documentHash, signature, role) => {
    const response = await api.post('/documents/sign', {
      documentHash,
      signature,
      role
    });
    return response.data;
  },

  // Grant permission
  grantPermission: async (documentHash, granteeAddress, expiryDays, canView, canVerify) => {
    const response = await api.post('/documents/grant-permission', {
      documentHash,
      granteeAddress,
      expiryDays,
      canView,
      canVerify
    });
    return response.data;
  },

  // Revoke permission
  revokePermission: async (documentHash, granteeAddress) => {
    const response = await api.post('/documents/revoke-permission', {
      documentHash,
      granteeAddress
    });
    return response.data;
  },

  // Get document
  getDocument: async (documentHash, userAddress) => {
    const response = await api.get(`/documents/${documentHash}`, {
      params: { userAddress }
    });
    return response.data;
  },

  // Get user documents
  getUserDocuments: async (userAddress) => {
    const response = await api.get(`/documents/user/${userAddress}`);
    return response.data;
  },

  // Check verification status
  getVerificationStatus: async (documentHash) => {
    const response = await api.get(`/documents/${documentHash}/verification-status`);
    return response.data;
  },

  // Add issuer (admin)
  addIssuer: async (issuerAddress) => {
    const response = await api.post('/admin/add-issuer', {
      issuerAddress
    });
    return response.data;
  },

  // Add verifier (admin)
  addVerifier: async (verifierAddress) => {
    const response = await api.post('/admin/add-verifier', {
      verifierAddress
    });
    return response.data;
  }
};

export default api;
