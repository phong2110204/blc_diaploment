import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getCurrentAccount, connectWallet } from './services/blockchain';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IssueDiploma from './pages/IssueDiploma';
import ViewDocument from './pages/ViewDocument';
import ShareDocument from './pages/ShareDocument';
import VerifyDocument from './pages/VerifyDocument';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const initializeApp = async () => {
    try {
      const acc = await getCurrentAccount();
      setAccount(acc);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountsChanged = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const handleConnect = async () => {
    try {
      const acc = await connectWallet();
      setAccount(acc);
    } catch (error) {
      alert('Không thể kết nối ví: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar account={account} onConnect={handleConnect} />
        <main className="main-container">
          {account ? (
            <Routes>
              <Route path="/" element={<Dashboard account={account} />} />
              <Route path="/dashboard" element={<Dashboard account={account} />} />
              <Route path="/issue" element={<IssueDiploma account={account} />} />
              <Route path="/view/:hash" element={<ViewDocument account={account} />} />
              <Route path="/share/:hash" element={<ShareDocument account={account} />} />
              <Route path="/verify/:hash" element={<VerifyDocument account={account} />} />
            </Routes>
          ) : (
            <div className="connect-wallet-prompt">
              <h1>Chào mừng đến Hệ Thống Quản Lý Văn Bằng</h1>
              <p>Vui lòng kết nối ví để tiếp tục</p>
              <button onClick={handleConnect} className="btn-primary">
                Kết Nối MetaMask
              </button>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
