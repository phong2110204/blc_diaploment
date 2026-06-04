import React, { useState, useEffect } from 'react';
import { documentService } from '../services/api';
import DocumentCard from '../components/DocumentCard';
import './Dashboard.css';

function Dashboard({ account }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (account) {
      loadUserDocuments();
    }
  }, [account]);

  // Filter & Search Logic
  useEffect(() => {
    let results = documents;

    // Filter by document type
    if (filterType !== 'all') {
      results = results.filter(doc => doc.documentType === filterType);
    }

    // Filter by verification status
    if (filterStatus !== 'all') {
      if (filterStatus === 'verified') {
        results = results.filter(doc => doc.isVerified === true);
      } else if (filterStatus === 'pending') {
        results = results.filter(doc => doc.isVerified !== true);
      }
    }

    // Search by text
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(doc => {
        const hash = (doc.documentHash || '').toLowerCase();
        const type = (doc.documentType || '').toLowerCase();
        return hash.includes(term) || type.includes(term);
      });
    }

    setFilteredDocuments(results);
  }, [documents, searchTerm, filterType, filterStatus]);

  const loadUserDocuments = async () => {
    try {
      setLoading(true);
      console.log('Loading documents for account:', account);
      const result = await documentService.getUserDocuments(account);
      console.log('Documents loaded:', result);
      setIsAdmin(result.isAdmin || false);
      setDebugInfo(`Account: ${account}, Documents: ${result.documentCount}, IsAdmin: ${result.isAdmin}`);
      setDocuments(result.documents || []);
      setError(null);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDebugInfo(`Error: ${err.message}, Account: ${account}`);
      setError('Không thể tải tài liệu');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  // Get unique document types
  const documentTypes = [...new Set(documents.map(doc => doc.documentType).filter(Boolean))];
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterStatus !== 'all';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tài Liệu Của Tôi</h1>
        <p>Quản lý các tài liệu xác thực trên blockchain</p>
        {debugInfo && <p style={{fontSize: '0.8rem', color: '#999'}}>{debugInfo}</p>}
      </div>

      {/* Search & Filter Section */}
      {!loading && documents.length > 0 && (
        <div className="search-filter-section">
          {/* Search Bar */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo hash hoặc loại văn bằng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="filters">
            {/* Document Type Filter */}
            <div className="filter-group">
              <label htmlFor="typeFilter">Loại Văn Bằng</label>
              <select
                id="typeFilter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả loại</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="statusFilter">Trạng Thái</label>
              <select
                id="statusFilter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="verified">✓ Đã Xác Minh</option>
                <option value="pending">⏳ Chờ Xác Minh</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters}
                className="btn-clear-filters"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Results Info */}
          {hasActiveFilters && (
            <div className="filter-results-info">
              Tìm thấy <strong>{filteredDocuments.length}</strong> kết quả
              {searchTerm && <span> khớp với "{searchTerm}"</span>}
            </div>
          )}
        </div>
      )}

      {loading && <div className="loading">Đang tải tài liệu...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!loading && documents.length === 0 && (
        <div className="empty-state">
          <h2>Chưa có tài liệu</h2>
          <p>Bắt đầu bằng cách cấp văn bằng đầu tiên</p>
        </div>
      )}

      {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="empty-state">
          <h2>Không tìm thấy kết quả</h2>
          <p>Không có tài liệu phù hợp với bộ lọc của bạn</p>
          <button onClick={handleClearFilters} className="btn-primary">
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      <div className="documents-grid">
        {filteredDocuments.map((document) => (
          <DocumentCard 
            key={document.documentHash} 
            documentHash={document.documentHash}
            diploma={document}
            onRefresh={loadUserDocuments}
            account={account}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
