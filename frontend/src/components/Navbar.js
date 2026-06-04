import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../services/api';
import './Navbar.css';

function Navbar({ account, onConnect }) {
  const displayAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected';
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const config = await documentService.getConfig();
        if (account) {
          const isAdminUser = account.toLowerCase() === config.adminAddress.toLowerCase();
          setIsAdmin(isAdminUser);
        }
      } catch (err) {
        console.error('Error checking admin:', err);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    setAdminCheckLoading(true);
    checkAdmin();
  }, [account]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          📜 Quản Lý Văn Bằng
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">Trang Chủ</Link>
          {!adminCheckLoading && isAdmin && (
            <Link to="/issue" className="nav-link">Cấp Văn Bằng</Link>
          )}
          <Link to="/dashboard" className="nav-link">Tài Liệu Của Tôi</Link>
        </div>

        <div className="nav-account">
          {account ? (
            <div className="account-info">
              <span className="account-address">{displayAddress}</span>
              <div className="account-status connected">
                {!adminCheckLoading && isAdmin ? '👑 Admin' : 'Đã Kết Nối'}
              </div>
            </div>
          ) : (
            <button onClick={onConnect} className="btn-connect">
              Kết Nối Ví
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
