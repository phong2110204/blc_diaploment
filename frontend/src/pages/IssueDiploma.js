import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import { signMessage } from '../services/blockchain';
import './IssueDiploma.css';

function IssueDiploma({ account }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ownerAddress: '',
    documentType: 'Bằng Đại Học',
    documentURI: '',
    recipientName: '',
    institution: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin address and check if current account is admin
  useEffect(() => {
    const fetchAdminAddress = async () => {
      try {
        const config = await documentService.getConfig();
        setAdminAddress(config.adminAddress);
        if (account) {
          const isAdminUser = account.toLowerCase() === config.adminAddress.toLowerCase();
          setIsAdmin(isAdminUser);
        }
      } catch (err) {
        console.error('Error fetching admin address:', err);
      }
    };
    fetchAdminAddress();
  }, [account]);

  // Auto-fill owner address from account on component mount
  useEffect(() => {
    if (account) {
      setFormData(prev => ({
        ...prev,
        ownerAddress: account
      }));
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin
      if (!isAdmin) {
        throw new Error('Chỉ admin mới có thể cấp văn bằng. Vui lòng kết nối ví admin.');
      }

      if (!formData.ownerAddress) {
        throw new Error('Địa chỉ ví là bắt buộc');
      }

      if (!formData.documentURI) {
        throw new Error('URI tài liệu là bắt buộc (ví dụ: IPFS hash)');
      }

      // Sign the document to prove issuer authenticity
      const messageToSign = `Cấp văn bằng cho ${formData.ownerAddress} lúc ${Date.now()}`;
      console.log('🔐 Requesting signature from MetaMask...');
      const signature = await signMessage(messageToSign);
      console.log('✅ Signature received:', signature);
      console.log('   Message:', messageToSign);

      // Call backend API to issue diploma - pass issuerAddress and signature
      console.log('📤 Sending to backend with signature...');
      const result = await documentService.issueDiploma(
        formData.ownerAddress,
        formData.documentURI,
        formData.documentType,
        account,  // Pass issuerAddress (current account)
        signature,  // Pass the digital signature
        messageToSign  // Pass the message that was signed
      );
      console.log('✅ Backend response:', result);

      setSuccess(true);
      setFormData({
        ownerAddress: account || '',
        documentType: 'Bằng Đại Học',
        documentURI: '',
        recipientName: '',
        institution: ''
      });

      setTimeout(() => {
        navigate(`/view/${result.documentHash}`);
      }, 2000);
    } catch (err) {
      console.error('Error issuing diploma:', err);
      setError(err.message || 'Không thể cấp văn bằng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issue-diploma">
      <div className="container">
        <h1>Cấp Văn Bằng Mới</h1>
        
        {!isAdmin ? (
          <div className="admin-only-message">
            <div className="error-message">
              <strong>⚠️ Truy Cập Bị Từ Chối</strong>
              <p>Chỉ admin mới có thể cấp văn bằng.</p>
              <p>Admin Address: <code>{adminAddress}</code></p>
              <p>Your Address: <code>{account}</code></p>
              <p>Vui lòng kết nối ví admin để tiếp tục.</p>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="issue-form">
          <div className="form-group">
            <label htmlFor="recipientName">Tên Người Nhận</label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Họ tên đầy đủ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerAddress">Địa Chỉ Ví Người Nhận</label>
            <input
              type="text"
              id="ownerAddress"
              name="ownerAddress"
              value={formData.ownerAddress}
              onChange={handleChange}
              placeholder="0x..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="institution">Tên Trường/Tổ Chức</label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Tên tổ chức cấp bằng"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="documentType">Loại Văn Bằng</label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
            >
              <option>Bằng Cấp 3</option>
              <option>Bằng Đại Học</option>
              <option>Bằng Thạc Sĩ</option>
              <option>Bằng Tiến Sĩ</option>
              <option>Chứng Chỉ</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="documentURI">URI Tài Liệu (IPFS/Arweave)</label>
            <input
              type="text"
              id="documentURI"
              name="documentURI"
              value={formData.documentURI}
              onChange={handleChange}
              placeholder="QmXxxx hoặc ar://..."
              required
            />
            <small>Lưu tài liệu trên IPFS hoặc Arweave và dán URI tại đây</small>
          </div>

          <div className="issuer-info">
            <p><strong>Người Cấp (Admin):</strong> {account}</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Cấp văn bằng thành công!</div>}

          <button 
            type="submit" 
            className="btn-submit" 
            disabled={loading}
          >
            {loading ? 'Đang Cấp...' : 'Cấp Văn Bằng'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

export default IssueDiploma;
