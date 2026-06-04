import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import './ViewDocument.css';

function ViewDocument({ account }) {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminAddress, setAdminAddress] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Fetch admin address and check permissions
  useEffect(() => {
    const fetchAdminAddress = async () => {
      try {
        const config = await documentService.getConfig();
        setAdminAddress(config.adminAddress);
        if (account) {
          const isAdminUser = account.toLowerCase() === config.adminAddress.toLowerCase();
          setIsAdmin(isAdminUser);
          console.log(`ViewDoc Admin check: isAdmin=${isAdminUser}`);
        }
      } catch (err) {
        console.error('Error fetching admin address:', err);
      } finally {
        setAdminCheckLoading(false);
      }
    };
    setAdminCheckLoading(true);
    fetchAdminAddress();
  }, [account]);

  useEffect(() => {
    if (hash) {
      loadDocument(hash);
    } else {
      setError('Không có tài liệu được chỉ định');
      setLoading(false);
    }
  }, [hash, account]);

  const loadDocument = async (documentHash) => {
    try {
      setLoading(true);
      const result = await documentService.getDocument(documentHash, account);
      if (result.success) {
        setDocument(result);
        setError(null);
        // Check if current account is the owner
        if (account && result.diploma?.owner) {
          const isOwnerUser = account.toLowerCase() === result.diploma.owner.toLowerCase();
          setIsOwner(isOwnerUser);
        }
      } else {
        setError('Không thể tải tài liệu');
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Lỗi khi tải tài liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return '-';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  if (loading) {
    return (
      <div className="view-document">
        <div className="container">
          <div className="loading">Đang tải tài liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-document">
        <div className="container">
          <div className="error-message">{error}</div>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="view-document">
        <div className="container">
          <div className="empty-state">Không tìm thấy tài liệu</div>
        </div>
      </div>
    );
  }

  const diploma = document.diploma;
  const signatures = document.signatures || [];

  return (
    <div className="view-document">
      <div className="container">
        <div className="breadcrumb">
          <button onClick={() => navigate('/dashboard')}>← Quay lại</button>
        </div>

        <h1>Chi Tiết Tài Liệu</h1>
        
        <div className="document-view">
          <div className="header-section">
            <h2>Thông Tin Văn Bằng</h2>
            <div className={`status-badge ${diploma.isVerified ? 'verified' : 'unverified'}`}>
              {diploma.isVerified ? 'Đã Xác Minh ✓' : 'Chưa Xác Minh'}
            </div>
          </div>

          <div className="info-section">
            <div className="info-group">
              <label>Loại Tài Liệu:</label>
              <p>{diploma.documentType || '-'}</p>
            </div>

            <div className="info-group">
              <label>Người Cấp:</label>
              <p className="monospace" title={diploma.issuer}>{diploma.issuer && diploma.issuer !== '-' ? formatAddress(diploma.issuer) : '-'}</p>
            </div>

            <div className="info-group">
              <label>Chủ Sở Hữu:</label>
              <p className="monospace" title={diploma.owner}>{formatAddress(diploma.owner)}</p>
            </div>

            <div className="info-group">
              <label>Ngày Cấp:</label>
              <p>{formatDate(diploma.issueDate)}</p>
            </div>

            <div className="info-group">
              <label>URI Tài Liệu:</label>
              <p className="monospace" title={diploma.documentURI}>
                {diploma.documentURI ? diploma.documentURI.substring(0, 50) + '...' : '-'}
              </p>
            </div>

            <div className="info-group">
              <label>Hash Tài Liệu:</label>
              <p className="monospace" title={hash}>{formatAddress(hash)}</p>
            </div>

            <div className="info-group">
              <label>Transaction Hash:</label>
              <p className="monospace" title={diploma.transactionHash || '-'}>
                {diploma.transactionHash ? formatAddress(diploma.transactionHash) : '-'}
              </p>
            </div>
          </div>

          <div className="signatures-section">
            <h3>Chữ Ký Điện Tử ({signatures.length})</h3>
            <div className="signatures-list">
              {signatures.length === 0 ? (
                <p className="empty">Chưa có chữ ký</p>
              ) : (
                <div className="signatures-table">
                  {signatures.map((sig, index) => (
                    <div key={index} className="signature-item">
                      <div className="signature-header">
                        <strong>Chữ ký #{index + 1}</strong>
                        <span className="role-badge">{sig.role}</span>
                      </div>
                      <div className="signature-details">
                        <p><strong>Người ký:</strong> <span className="monospace" title={sig.signer}>{formatAddress(sig.signer)}</span></p>
                        <p><strong>Ngày ký:</strong> {formatDate(sig.signedDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="actions">
            <button className="btn-download">⬇️ Tải Xuống</button>
            {!adminCheckLoading && isAdmin && (
              <button 
                className="btn-verify"
                onClick={() => navigate(`/verify/${hash}`)}
              >
                ✓ Xác Minh
              </button>
            )}
            {!adminCheckLoading && !isAdmin && (
              <button 
                className="btn-verify"
                disabled
                title="Chỉ admin mới có thể xác minh"
                style={{opacity: 0.5, cursor: 'not-allowed'}}
              >
                🔒 Xác Minh (Admin Only)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewDocument;
