import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../services/api';
import './DocumentCard.css';

function DocumentCard({ documentHash, diploma, onRefresh, account, isAdmin }) {
  const [docInfo, setDocInfo] = useState(diploma || null);
  const [loading, setLoading] = useState(!diploma);
  const [verifying, setVerifying] = useState(false);

  const loadDocumentInfo = useCallback(async () => {
    try {
      const result = await documentService.getDocument(documentHash, account);
      if (result.success) {
        setDocInfo(result.diploma);
      }
    } catch (err) {
      console.error('Error loading document info:', err);
    } finally {
      setLoading(false);
    }
  }, [documentHash, account]);

  useEffect(() => {
    // Only load if no diploma data was provided
    if (!diploma) {
      loadDocumentInfo();
    } else {
      setLoading(false);
    }
  }, [documentHash, diploma, account, loadDocumentInfo]);

  const handleVerify = async () => {
    // Permission check
    if (!isAdmin) {
      alert('❌ Chỉ admin mới có thể xác minh tài liệu');
      return;
    }

    setVerifying(true);
    try {
      await documentService.verifyDiploma(documentHash, true, account);
      // Refresh the document info
      await loadDocumentInfo();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error verifying document:', err);
      alert('Lỗi xác minh tài liệu: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="document-card loading-state">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="document-card">
      <div className="card-header">
        <span className="doc-type">
          {docInfo?.documentType === 'Bằng Đại Học' ? '🎓' : '📜'} 
          {docInfo?.documentType || 'Văn Bằng'}
        </span>
        <span className="doc-hash" title={documentHash}>
          {documentHash.slice(0, 12)}...
        </span>
      </div>

      <div className="card-body">
        <div className="status">
          <span className={`badge ${docInfo?.isVerified ? 'badge-verified' : 'badge-pending'}`}>
            {docInfo?.isVerified ? '✓ Đã Xác Minh' : '⏳ Chờ Xác Minh'}
          </span>
        </div>

        <div className="card-info">
          <p><strong>Cấp ngày:</strong> {formatDate(docInfo?.issueDate)}</p>
          <p><strong>Loại:</strong> {docInfo?.documentType || '-'}</p>
          {isAdmin && (
            <p><strong>Chủ sở hữu:</strong> {docInfo?.owner?.slice(0, 8)}...{docInfo?.owner?.slice(-6)}</p>
          )}
        </div>

        <p className="card-text">
          {isAdmin ? 'Quản lý tài liệu' : 'Xem chi tiết tài liệu'}
        </p>
      </div>

      <div className="card-actions">
        {/* Nút xem chi tiết - hiển thị cho cả admin và user thường */}
        <Link to={`/view/${documentHash}`} className="btn-view">
          👁️ Xem Chi Tiết
        </Link>

        {/* Admin - Nút xác minh chỉ hiển thị khi chưa xác minh */}
        {isAdmin && !docInfo?.isVerified && (
          <button 
            onClick={handleVerify} 
            className="btn-verify"
            disabled={verifying}
          >
            {verifying ? '⏳ Xác Minh...' : '✓ Xác Minh'}
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
