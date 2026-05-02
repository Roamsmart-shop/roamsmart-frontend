// src/pages/AdminPriceManagement.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDollarSign, FaEdit, FaSave, FaTimes, FaSpinner, 
  FaCheckCircle, FaChartLine, FaGraduationCap, FaUsers,
  FaMobileAlt, FaDatabase, FaLock, FaKey, FaEye, FaEyeSlash,
  FaShieldAlt, FaSignOutAlt, FaPlus
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import './AdminPriceManagement.css';
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function AdminPriceManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user_prices');
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [verifying, setVerifying] = useState(false); // NEW: Track verification state
  
  // Custom size adder states
  const [newSize, setNewSize] = useState('');
  const [newUserPrice, setNewUserPrice] = useState('');
  const [newAgentPrice, setNewAgentPrice] = useState('');
  const [showAddSize, setShowAddSize] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  
  // Price states
  const [userPrices, setUserPrices] = useState({
    mtn: { '1': 6.50, '2': 12.00, '5': 25.00, '10': 48.00, '20': 90.00 },
    telecel: { '1': 6.00, '2': 11.00, '5': 23.00, '10': 44.00, '20': 85.00 },
    airteltigo: { '1': 6.00, '2': 11.00, '5': 23.00, '10': 44.00, '20': 85.00 }
  });
  
  const [agentPrices, setAgentPrices] = useState({
    mtn: { '1': 5.50, '2': 10.00, '5': 22.00, '10': 42.00, '20': 80.00 },
    telecel: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 },
    airteltigo: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 }
  });
  
  const [waecPrices, setWaecPrices] = useState({
    WASSCE: 20.00,
    BECE: 15.00,
    'SHS Placement': 10.00
  });
  
  const [commissionRates, setCommissionRates] = useState({
    Bronze: 10,
    Silver: 15,
    Gold: 20,
    Platinum: 25
  });
  
  const [editingCell, setEditingCell] = useState(null);

  // Check for existing session on mount - DON'T auto-fetch prices
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Session validity checker (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && authToken) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get('/admin/prices/check-auth', {
            headers: { 'X-Price-Auth': authToken }
          });
          if (!res.data.authenticated) {
            toast.error('Session expired. Please re-enter password.');
            handleSessionExpired();
          }
        } catch (error) {
          console.error('Session check error:', error);
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authToken]);

  const checkExistingSession = async () => {
    const storedToken = sessionStorage.getItem('price_auth_token');
    const storedExpiry = sessionStorage.getItem('price_auth_expires');
    
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      try {
        const res = await api.get('/admin/prices/check-auth', {
          headers: { 'X-Price-Auth': storedToken }
        });
        if (res.data.authenticated) {
          setAuthToken(storedToken);
          setIsAuthenticated(true);
          await fetchPrices(storedToken);
        } else {
          sessionStorage.removeItem('price_auth_token');
          sessionStorage.removeItem('price_auth_expires');
        }
      } catch (error) {
        sessionStorage.removeItem('price_auth_token');
        sessionStorage.removeItem('price_auth_expires');
      }
    }
    setAuthChecking(false);
  };

  const handleSessionExpired = () => {
    sessionStorage.removeItem('price_auth_token');
    sessionStorage.removeItem('price_auth_expires');
    setIsAuthenticated(false);
    setAuthToken(null);
    setPassword('');
  };

  const handleLogin = async () => {
    if (!password) {
      toast.error('Please enter the price management password');
      return;
    }

    setVerifying(true); // Start verifying state
    try {
      const res = await api.post('/admin/prices/verify', { password });
      if (res.data.success) {
        const token = res.data.token;
        const expiresIn = res.data.expires_in || 3600;
        
        setAuthToken(token);
        setIsAuthenticated(true);
        sessionStorage.setItem('price_auth_token', token);
        sessionStorage.setItem('price_auth_expires', (Date.now() + (expiresIn * 1000)).toString());
        
        toast.success('Password verified! Loading prices...');
        await fetchPrices(token);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid password');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await api.post('/admin/prices/logout', {}, {
          headers: { 'X-Price-Auth': authToken }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('price_auth_token');
      sessionStorage.removeItem('price_auth_expires');
      setIsAuthenticated(false);
      setAuthToken(null);
      setPassword('');
      toast.success('Logged out of price management');
    }
  };

  const fetchPrices = async (token = null) => {
    setLoading(true);
    try {
      const headers = token ? { 'X-Price-Auth': token } : {};
      const res = await api.get('/admin/prices', { headers });
      if (res.data.success) {
        const data = res.data.data;
        if (data.user_prices) setUserPrices(data.user_prices);
        if (data.agent_prices) setAgentPrices(data.agent_prices);
        if (data.waec_prices) setWaecPrices(data.waec_prices);
        if (data.commission_rates) setCommissionRates(data.commission_rates);
      }
    } catch (error) {
      console.error('Fetch prices error:', error);
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error('Failed to load prices');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/admin/prices/update-password', {
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      if (res.data.success) {
        toast.success('Price management password updated!');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
        
        sessionStorage.removeItem('price_auth_token');
        sessionStorage.removeItem('price_auth_expires');
        setIsAuthenticated(false);
        setAuthToken(null);
        setPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const addCustomSize = async (network) => {
    if (!newSize || newSize < 1 || newSize > 100) {
      toast.error('Please enter a valid size (1-100GB)');
      return;
    }
    
    if (!newUserPrice || !newAgentPrice) {
      toast.error('Please enter both user and agent prices');
      return;
    }
    
    try {
      // Add user price
      await api.put('/admin/prices/user', {
        network,
        size_gb: parseInt(newSize),
        price: parseFloat(newUserPrice)
      }, { headers: { 'X-Price-Auth': authToken } });
      
      // Add agent price
      await api.put('/admin/prices/agent', {
        network,
        size_gb: parseInt(newSize),
        price: parseFloat(newAgentPrice)
      }, { headers: { 'X-Price-Auth': authToken } });
      
      toast.success(`Added ${newSize}GB pricing for ${network.toUpperCase()}`);
      setNewSize('');
      setNewUserPrice('');
      setNewAgentPrice('');
      setShowAddSize(false);
      fetchPrices(authToken); // Refresh prices
      
    } catch (error) {
      console.error('Add custom size error:', error);
      toast.error(error.response?.data?.error || 'Failed to add size');
    }
  };

  const updateUserPrice = async (network, sizeGb, newPrice) => {
    try {
      const res = await api.put('/admin/prices/user', {
        network,
        size_gb: parseInt(sizeGb),
        price: parseFloat(newPrice)
      }, {
        headers: { 'X-Price-Auth': authToken }
      });
      
      if (res.data.success) {
        setUserPrices(prev => ({
          ...prev,
          [network]: {
            ...prev[network],
            [sizeGb]: parseFloat(newPrice)
          }
        }));
        toast.success(res.data.message);
        return true;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(error.response?.data?.error || 'Update failed');
      }
      return false;
    }
  };

  const updateAgentPrice = async (network, sizeGb, newPrice) => {
    try {
      const res = await api.put('/admin/prices/agent', {
        network,
        size_gb: parseInt(sizeGb),
        price: parseFloat(newPrice)
      }, {
        headers: { 'X-Price-Auth': authToken }
      });
      
      if (res.data.success) {
        setAgentPrices(prev => ({
          ...prev,
          [network]: {
            ...prev[network],
            [sizeGb]: parseFloat(newPrice)
          }
        }));
        toast.success(res.data.message);
        return true;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(error.response?.data?.error || 'Update failed');
      }
      return false;
    }
  };

  const updateWaecPrice = async (examType, newPrice) => {
    try {
      const res = await api.put('/admin/prices/waec', {
        exam_type: examType,
        price: parseFloat(newPrice)
      }, {
        headers: { 'X-Price-Auth': authToken }
      });
      
      if (res.data.success) {
        setWaecPrices(prev => ({
          ...prev,
          [examType]: parseFloat(newPrice)
        }));
        toast.success(res.data.message);
        return true;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(error.response?.data?.error || 'Update failed');
      }
      return false;
    }
  };

  const updateCommissionRate = async (tier, newRate) => {
    try {
      const res = await api.put('/admin/prices/commission', {
        tier,
        rate: parseFloat(newRate)
      }, {
        headers: { 'X-Price-Auth': authToken }
      });
      
      if (res.data.success) {
        setCommissionRates(prev => ({
          ...prev,
          [tier]: parseFloat(newRate)
        }));
        toast.success(res.data.message);
        return true;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(error.response?.data?.error || 'Update failed');
      }
      return false;
    }
  };

  const handleEdit = (type, network, sizeGb, currentValue) => {
    setEditingCell({ type, network, sizeGb, value: currentValue });
  };

  const handleSave = async () => {
    if (!editingCell) return;
    
    const { type, network, sizeGb, value } = editingCell;
    let success = false;
    
    if (type === 'user') {
      success = await updateUserPrice(network, sizeGb, value);
    } else if (type === 'agent') {
      success = await updateAgentPrice(network, sizeGb, value);
    }
    
    if (success) {
      setEditingCell(null);
    }
  };

  const handleWaecEdit = (examType, currentValue) => {
    setEditingCell({ type: 'waec', examType, value: currentValue });
  };

  const handleWaecSave = async () => {
    if (!editingCell || editingCell.type !== 'waec') return;
    
    const success = await updateWaecPrice(editingCell.examType, editingCell.value);
    if (success) {
      setEditingCell(null);
    }
  };

  const handleCommissionEdit = (tier, currentValue) => {
    setEditingCell({ type: 'commission', tier, value: currentValue });
  };

  const handleCommissionSave = async () => {
    if (!editingCell || editingCell.type !== 'commission') return;
    
    const success = await updateCommissionRate(editingCell.tier, editingCell.value);
    if (success) {
      setEditingCell(null);
    }
  };

  const handleAddSizeClick = (network) => {
    setSelectedNetwork(network);
    setShowAddSize(true);
  };

  const networks = ['mtn', 'telecel', 'airteltigo'];
  const sizes = ['1', '2', '5', '10', '20'];

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="price-auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Password Login Screen - Centered
  if (!isAuthenticated) {
    return (
      <div className="price-auth-wrapper">
        <motion.div 
          className="price-auth-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="price-auth-card">
            <div className="price-auth-icon">
              <FaLock size={48} />
            </div>
            <h2>Price Management</h2>
            <p>Enter the price management password to access this section</p>
            
            <div className="price-password-group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter price management password"
                className="price-password-input"
                onKeyPress={(e) => e.key === 'Enter' && !verifying && handleLogin()}
                autoFocus
                disabled={verifying}
              />
              <button 
                className="price-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <button 
              className="price-auth-btn"
              onClick={handleLogin}
              disabled={verifying || !password}
            >
              {verifying ? <FaSpinner className="spinning" /> : <FaKey />}
              {verifying ? ' Verifying...' : ' Access Price Management'}
            </button>
            
            <div className="price-auth-footer">
              <button 
                className="price-link-btn"
                onClick={() => setShowChangePassword(true)}
              >
                Change Password (Super Admin Only)
              </button>
            </div>
          </div>

          {/* Change Password Modal */}
          {showChangePassword && (
            <div className="price-modal-overlay" onClick={() => setShowChangePassword(false)}>
              <div className="price-modal-content" onClick={e => e.stopPropagation()}>
                <button className="price-modal-close" onClick={() => setShowChangePassword(false)}>×</button>
                <h3><FaShieldAlt /> Change Price Management Password</h3>
                <p>This will change the password required to access price management</p>
                
                <div className="price-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="price-form-input"
                  />
                </div>
                
                <div className="price-form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="price-form-input"
                  />
                </div>
                
                <div className="price-modal-actions">
                  <button className="price-btn-secondary" onClick={() => setShowChangePassword(false)}>Cancel</button>
                  <button className="price-btn-primary" onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? <FaSpinner className="spinning" /> : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="price-loading">
        <div className="spinner"></div>
        <p>Loading price management...</p>
      </div>
    );
  }

  return (
    <div className="price-management-container">
      <div className="price-header">
        <div className="price-header-info">
          <h1><FaDollarSign /> Price Management - {COMPANY.name}</h1>
          <p>Manage user prices, agent wholesale prices, WAEC vouchers, and commission rates</p>
        </div>
        <button className="price-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Lock & Exit
        </button>
      </div>

      {/* Tabs */}
      <div className="price-tabs">
        <button 
          className={`price-tab ${activeTab === 'user_prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('user_prices')}
        >
          <FaUsers /> User Prices (Retail)
        </button>
        <button 
          className={`price-tab ${activeTab === 'agent_prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('agent_prices')}
        >
          <FaDatabase /> Agent Prices (Wholesale)
        </button>
        <button 
          className={`price-tab ${activeTab === 'waec' ? 'active' : ''}`}
          onClick={() => setActiveTab('waec')}
        >
          <FaGraduationCap /> WAEC Vouchers
        </button>
        <button 
          className={`price-tab ${activeTab === 'commission' ? 'active' : ''}`}
          onClick={() => setActiveTab('commission')}
        >
          <FaChartLine /> Commission Rates
        </button>
      </div>

      {/* User Prices Tab */}
      {activeTab === 'user_prices' && (
        <div className="price-table-wrapper">
          <div className="price-section-header">
            <h2><FaUsers /> User Retail Prices</h2>
            <p>Update prices for regular users buying data on Roamsmart</p>
          </div>
          
          <div className="price-table-responsive">
            <table className="price-data-table">
              <thead>
                <tr>
                  <th>Network</th>
                  {sizes.map(size => <th key={size}>{size}GB</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {networks.map(network => (
                  <tr key={network}>
                    <td className="price-network-cell">{network.toUpperCase()}</td>
                    {sizes.map(size => {
                      const isEditing = editingCell?.type === 'user' && 
                                       editingCell?.network === network && 
                                       editingCell?.sizeGb === size;
                      const currentPrice = userPrices[network]?.[size] || 0;
                      
                      return (
                        <td key={size} className="price-cell">
                          {isEditing ? (
                            <div className="price-edit-container">
                              <input
                                type="number"
                                step="0.5"
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                className="price-input"
                                autoFocus
                              />
                              <button onClick={handleSave} className="price-save-btn">
                                <FaCheckCircle />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="price-cancel-btn">
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <div className="price-display">
                              <span>₵{currentPrice.toFixed(2)}</span>
                              <button 
                                onClick={() => handleEdit('user', network, size, currentPrice)}
                                className="price-edit-btn"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="price-action-cell">
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => handleAddSizeClick(network)}
                      >
                        <FaPlus /> Add Size
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Prices Tab */}
      {activeTab === 'agent_prices' && (
        <div className="price-table-wrapper">
          <div className="price-section-header">
            <h2><FaDatabase /> Agent Wholesale Prices</h2>
            <p>Update wholesale prices for agents on Roamsmart</p>
          </div>
          
          <div className="price-table-responsive">
            <table className="price-data-table">
              <thead>
                <tr>
                  <th>Network</th>
                  {sizes.map(size => <th key={size}>{size}GB</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {networks.map(network => (
                  <tr key={network}>
                    <td className="price-network-cell">{network.toUpperCase()}</td>
                    {sizes.map(size => {
                      const isEditing = editingCell?.type === 'agent' && 
                                       editingCell?.network === network && 
                                       editingCell?.sizeGb === size;
                      const currentPrice = agentPrices[network]?.[size] || 0;
                      
                      return (
                        <td key={size} className="price-cell">
                          {isEditing ? (
                            <div className="price-edit-container">
                              <input
                                type="number"
                                step="0.5"
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                className="price-input"
                                autoFocus
                              />
                              <button onClick={handleSave} className="price-save-btn">
                                <FaCheckCircle />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="price-cancel-btn">
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <div className="price-display">
                              <span>₵{currentPrice.toFixed(2)}</span>
                              <button 
                                onClick={() => handleEdit('agent', network, size, currentPrice)}
                                className="price-edit-btn"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="price-action-cell">
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => handleAddSizeClick(network)}
                      >
                        <FaPlus /> Add Size
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="price-profit-margin">
            <h4>💰 Profit Margin Summary</h4>
            <div className="price-margin-grid">
              {networks.map(network => (
                <div key={network} className="price-margin-card">
                  <h5>{network.toUpperCase()}</h5>
                  {sizes.map(size => {
                    const userPrice = userPrices[network]?.[size] || 0;
                    const agentPrice = agentPrices[network]?.[size] || 0;
                    const margin = userPrice - agentPrice;
                    const marginPercent = (margin / userPrice * 100).toFixed(1);
                    
                    return (
                      <div key={size} className="price-margin-item">
                        <span>{size}GB:</span>
                        <span className="price-margin-amount">+₵{margin.toFixed(2)}</span>
                        <span className="price-margin-percent">({marginPercent}% profit)</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WAEC Prices Tab */}
      {activeTab === 'waec' && (
        <div className="price-table-wrapper">
          <div className="price-section-header">
            <h2><FaGraduationCap /> WAEC Voucher Prices</h2>
            <p>Update prices for WAEC result checker vouchers</p>
          </div>
          
          <div className="price-waec-grid">
            {Object.entries(waecPrices).map(([examType, price]) => {
              const isEditing = editingCell?.type === 'waec' && editingCell?.examType === examType;
              
              return (
                <div key={examType} className="price-waec-card">
                  <div className="price-waec-type">{examType}</div>
                  {isEditing ? (
                    <div className="price-edit-container">
                      <input
                        type="number"
                        step="0.5"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        className="price-input"
                        autoFocus
                      />
                      <button onClick={handleWaecSave} className="price-save-btn">
                        <FaCheckCircle />
                      </button>
                      <button onClick={() => setEditingCell(null)} className="price-cancel-btn">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="price-display large">
                      <span>₵{price.toFixed(2)}</span>
                      <button 
                        onClick={() => handleWaecEdit(examType, price)}
                        className="price-edit-btn"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commission Rates Tab */}
      {activeTab === 'commission' && (
        <div className="price-table-wrapper">
          <div className="price-section-header">
            <h2><FaChartLine /> Agent Commission Rates</h2>
            <p>Set commission percentages for each agent tier</p>
          </div>
          
          <div className="price-commission-grid">
            {Object.entries(commissionRates).map(([tier, rate]) => {
              const isEditing = editingCell?.type === 'commission' && editingCell?.tier === tier;
              
              return (
                <div key={tier} className={`price-commission-card ${tier.toLowerCase()}`}>
                  <div className="price-tier-name">
                    {tier === 'Bronze' && '🥉'}
                    {tier === 'Silver' && '🥈'}
                    {tier === 'Gold' && '🥇'}
                    {tier === 'Platinum' && '💎'}
                    {tier}
                  </div>
                  {isEditing ? (
                    <div className="price-edit-container">
                      <input
                        type="number"
                        step="1"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        className="price-rate-input"
                        autoFocus
                      />
                      <span className="price-percent-sign">%</span>
                      <button onClick={handleCommissionSave} className="price-save-btn">
                        <FaCheckCircle />
                      </button>
                      <button onClick={() => setEditingCell(null)} className="price-cancel-btn">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="price-rate-display">
                      <span className="price-rate-value">{rate}%</span>
                      <button 
                        onClick={() => handleCommissionEdit(tier, rate)}
                        className="price-edit-btn"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                  <div className="price-tier-requirement">
                    {tier === 'Bronze' && 'Default tier for all agents'}
                    {tier === 'Silver' && 'Requires ₵500+ in sales'}
                    {tier === 'Gold' && 'Requires ₵2000+ in sales'}
                    {tier === 'Platinum' && 'Requires ₵10000+ in sales'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Size Modal */}
      {showAddSize && (
        <div className="price-modal-overlay" onClick={() => setShowAddSize(false)}>
          <div className="price-modal-content add-size-modal" onClick={e => e.stopPropagation()}>
            <button className="price-modal-close" onClick={() => setShowAddSize(false)}>×</button>
            <h3><FaPlus /> Add Custom Size for {selectedNetwork.toUpperCase()}</h3>
            <p>Add a new data package size with custom pricing</p>
            
            <div className="price-form-group">
              <label>Data Size (GB)</label>
              <input
                type="number"
                placeholder="Enter size in GB (1-100)"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                min="1"
                max="100"
                className="price-form-input"
              />
            </div>
            
            <div className="price-form-group">
              <label>User Price (Retail) - ₵</label>
              <input
                type="number"
                placeholder="Enter user price"
                value={newUserPrice}
                onChange={(e) => setNewUserPrice(e.target.value)}
                step="0.5"
                min="0"
                className="price-form-input"
              />
            </div>
            
            <div className="price-form-group">
              <label>Agent Price (Wholesale) - ₵</label>
              <input
                type="number"
                placeholder="Enter agent price"
                value={newAgentPrice}
                onChange={(e) => setNewAgentPrice(e.target.value)}
                step="0.5"
                min="0"
                className="price-form-input"
              />
              <small className="price-form-hint">Agent price should be lower than user price</small>
            </div>
            
            <div className="price-modal-actions">
              <button className="price-btn-secondary" onClick={() => setShowAddSize(false)}>
                Cancel
              </button>
              <button 
                className="price-btn-primary" 
                onClick={() => addCustomSize(selectedNetwork)}
              >
                Add {newSize}GB Package
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="price-footer">
        <p className="price-footer-text">
          <small>Prices updated here will take effect immediately on Roamsmart platform</small>
        </p>
      </div>
    </div>
  );
}