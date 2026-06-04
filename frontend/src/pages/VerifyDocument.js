import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import './VerifyDocument.css';

function VerifyDocument({ account }) {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [adminAddress, setAdminAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const result = await documentService.getDocument(hash, account);
      if (result.success) {
        setDocument(result);
        setError(null);
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

  // Fetch admin address and check if current account is admin
  useEffect(() => {
    const fetchAdminAddress = async () => {
      try {
        const config = await documentService.getConfig();
        setAdminAddress(config.adminAddress);
        if (account) {
          const isAdminUser = account.toLowerCase() === config.adminAddress.toLowerCase();
          setIsAdmin(isAdminUser);
          console.log(`Admin check: account=${account}, adminAddress=${config.adminAddress}, isAdmin=${isAdminUser}`);
        }
      } catch (err) {
        console.error('Error fetching admin address:', err);
        setError('Lỗi khi kiểm tra quyền admin');
      } finally {
        setAdminCheckLoading(false);
      }
    };
    setAdminCheckLoading(true);
    fetchAdminAddress();
  }, [account]);

  const handleVerify = async () => {
    if (!isAdmin) {
      setError('❌ Bạn không có quyền xác minh tài liệu. Chỉ admin mới có thể xác minh.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const result = await documentService.verifyDiploma(hash, true, account);
      if (result.success) {
        await loadDocument();
      } else {
        setError('Không thể xác minh tài liệu');
      }
    } catch (err) {
      console.error('Verify Error:', err);
      setError('Lỗi khi xác minh: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (hash) {
      loadDocument();
    } else {
      setError('Không có tài liệu được chỉ định');
      setLoading(false);
    }
  }, [hash, account]);

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
      <div className="verify-document">
        <div className="container">
          <div className="loading">Đang tải tài liệu...</div>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="verify-document">
        <div className="container">
          <div className="error-message">{error}</div>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const diploma = document?.diploma;

  return (
    <div className="verify-document">
      <div className="container">
        <div className="breadcrumb">
          <button onClick={() => navigate(`/view/${hash}`)}>← Quay lại</button>
        </div>

        <h1>Xác Minh Tài Liệu</h1>
        
        <div className="verify-card">
          <div className="status-display">
            {diploma?.isVerified ? (
              <div className="status-verified">
                ✓ Tài Liệu Đã Xác Minh
              </div>
            ) : (
              <div className="status-pending">
                ⏳ Đang Chờ Xác Minh
              </div>
            )}
          </div>

          <div className="verification-details">
            <h2>Chi Tiết Tài Liệu</h2>
            <div className="detail-row">
              <span className="label">Loại Tài Liệu:</span>
              <span className="value">{diploma?.documentType || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Người Cấp:</span>
              <span className="value monospace" title={diploma?.issuer}>{formatAddress(diploma?.issuer)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Chủ Sở Hữu:</span>
              <span className="value monospace" title={diploma?.owner}>{formatAddress(diploma?.owner)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Ngày Cấp:</span>
              <span className="value">{formatDate(diploma?.issuedDate)}</span>
            </div>
            <div className="detail-row">
              <span className="label">URI Tài Liệu:</span>
              <span className="value monospace" title={diploma?.documentURI}>
                {diploma?.documentURI ? diploma.documentURI.substring(0, 40) + '...' : '-'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Chữ Ký:</span>
              <span className="value">{document?.signatures?.length || 0}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
adminCheckLoading && (
            <div className="info-message">⏳ Đang kiểm tra quyền...</div>
          )}

          {!diploma?.isVerified && !adminCheckLoading && isAdmin && (
            <button 
              className="btn-verify" 
              onClick={handleVerify}
              disabled={verifying || adminCheckLoading}
            >
              {verifying ? 'Đang xác minh...' : '✓ Xác Minh Tài Liệu'}
            </button>
          )}

          {!diploma?.isVerified && !adminCheckLoading && !isAdmin && (
            <div className="admin-only-info">
              <p>🔒 Chỉ admin mới có thể xác minh tài liệu này.</p>
              <p style={{fontSize: '0.9em', marginTop: '8px'}}>Admin: <code>{formatAddress(adminAddress)}</code></p>
            </div>
          )}

          {diploma?.isVerified && (
            <div className="verification-confirmed">
              <p>✓ Tài liệu đã được xác minh bởi hệ thống</p>
            </div>
          )}
        </div>

        <div className="verify-info">
          <h3>Quy Trình Xác Minh</h3>
          <ol>
            <li>Hệ thống kiểm tra chữ ký của người cấp</li>
            <li>Xác nhận thông tin tài liệu trên blockchain</li>
            <li>Cập nhật trạng thái xác minh</li>
            <li>Ghi lại sự kiện xác minh trên blockchain</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default VerifyDocument;
