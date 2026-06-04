import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import './ShareDocument.css';

function ShareDocument({ account }) {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    recipientAddress: '',
    canView: true,
    canVerify: false,
    expiryDays: 30
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch document and check permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get admin address
        const config = await documentService.getConfig();
        setAdminAddress(config.adminAddress);
        
        if (account) {
          const isAdminUser = account.toLowerCase() === config.adminAddress.toLowerCase();
          setIsAdmin(isAdminUser);
        }

        // Get document
        const result = await documentService.getDocument(hash, account);
        if (result.success) {
          setDocument(result);
          // Check if current account is the owner
          if (account && result.diploma?.owner) {
            const isOwnerUser = account.toLowerCase() === result.diploma.owner.toLowerCase();
            setIsOwner(isOwnerUser);
          }
        } else {
          setError('Không thể tải tài liệu');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Lỗi khi tải dữ liệu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      fetchData();
    }
  }, [hash, account]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Permission check
    if (!isOwner && !isAdmin) {
      setError('Chỉ chủ sở hữu hay admin mới có thể chia sẻ tài liệu');
      return;
    }
    
    if (!formData.recipientAddress) {
      setError('Vui lòng nhập địa chỉ người nhận');
      return;
    }

    if (!formData.canView && !formData.canVerify) {
      setError('Vui lòng chọn ít nhất một quyền hạn');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await documentService.grantPermission(
        hash,
        formData.recipientAddress,
        parseInt(formData.expiryDays),
        formData.canView,
        formData.canVerify
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/view/${hash}`);
        }, 2000);
      } else {
        setError('Không thể chia sẻ tài liệu');
      }
    } catch (err) {
      console.error('Share Document Error:', err);
      setError('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="share-document">
        <div className="container">
          <div className="loading">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error && !isOwner && !isAdmin) {
    return (
      <div className="share-document">
        <div className="container">
          <div className="breadcrumb">
            <button onClick={() => navigate('/dashboard')}>← Quay lại</button>
          </div>
          <div className="error-message">
            <h2>⚠️ Truy Cập Bị Từ Chối</h2>
            <p>Chỉ chủ sở hữu hay admin mới có thể chia sẻ tài liệu.</p>
            <p>Nếu bạn không phải chủ sở hữu của tài liệu này, vui lòng quay lại.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="share-document">
        <div className="container">
          <div className="success-message">
            <h2>✓ Chia Sẻ Thành Công</h2>
            <p>Tài liệu đã được chia sẻ với {formData.recipientAddress}</p>
            <p>Đang chuyển hướng...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-document">
      <div className="container">
        <div className="breadcrumb">
          <button onClick={() => navigate(`/view/${hash}`)}>← Quay lại</button>
        </div>

        <h1>Chia Sẻ Tài Liệu</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="share-form">
          <div className="form-group">
            <label htmlFor="recipientAddress">Địa Chỉ Người Nhận *</label>
            <input
              type="text"
              id="recipientAddress"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              placeholder="0x..."
              required
              disabled={loading}
            />
            <small>Nhập địa chỉ ví Ethereum của người nhận</small>
          </div>

          <div className="permissions">
            <h3>Cấp Quyền Hạn</h3>
            
            <div className="form-check">
              <input
                type="checkbox"
                id="canView"
                name="canView"
                checked={formData.canView}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="canView">Có Thể Xem Tài Liệu</label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                id="canVerify"
                name="canVerify"
                checked={formData.canVerify}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="canVerify">Có Thể Xác Minh Tài Liệu</label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expiryDays">Hết Hạn (ngày) *</label>
            <input
              type="number"
              id="expiryDays"
              name="expiryDays"
              value={formData.expiryDays}
              onChange={handleChange}
              min="1"
              max="365"
              disabled={loading}
            />
            <small>Quyền hạn sẽ hết hạn sau số ngày được chỉ định</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : '✓ Chia Sẻ'}
            </button>
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => navigate(`/view/${hash}`)}
              disabled={loading}
            >
              ✕ Hủy
            </button>
          </div>
        </form>

        <div className="share-info">
          <h3>Thông Tin Chia Sẻ</h3>
          <ul>
            <li>Người nhận sẽ có thể xem tài liệu theo quyền hạn được cấp</li>
            <li>Bạn có thể thu hồi quyền hạn bất cứ lúc nào</li>
            <li>Mỗi chia sẻ được ghi lại trên blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ShareDocument;
