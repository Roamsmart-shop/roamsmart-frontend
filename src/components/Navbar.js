// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaWallet,
  FaShoppingCart, FaEnvelope, FaSearch, FaTimes, FaAngleLeft, FaAngleRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function Navbar({ onMenuClick, showMenu, isMobile, onCollapse, isCollapsed, sidebarOpen }) {
  const { user, logout, unreadCount, markAllNotificationsRead, notifications, updateUserContext } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [avatarError, setAvatarError] = useState(false);

  // Listen for avatar updates    
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      console.log('Navbar: Avatar update received', event.detail);
      setAvatarTimestamp(Date.now());
      setAvatarError(false); // Reset error state on new avatar
    };
    
    const handleUserUpdate = (event) => {
      console.log('Navbar: User update received', event.detail);
      setAvatarTimestamp(Date.now());
      setAvatarError(false);
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    window.addEventListener('user-context-updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
      window.removeEventListener('user-context-updated', handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const toggleCollapse = () => {
    if (onCollapse) {
      onCollapse();
    }
  };

  // Get avatar URL - handles both 'avatar_url' and 'avatar' field names
  const getAvatarUrl = () => {
    // Check both possible field names
    const avatarField = user?.avatar_url || user?.avatar;
    
    console.log('Navbar: Getting avatar URL, avatarField:', avatarField);
    console.log('Navbar: User object:', user);
    
    if (avatarField && !avatarError) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Ensure the path starts with a slash if needed
      const avatarPath = avatarField.startsWith('/') ? avatarField : `/${avatarField}`;
      const fullUrl = `${baseUrl}${avatarPath}?t=${avatarTimestamp}`;
      console.log('Navbar: Full avatar URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback to avatar generator
    const username = user?.username || 'User';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=40&bold=true`;
    console.log('Navbar: Using fallback avatar URL:', fallbackUrl);
    return fallbackUrl;
  };

  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="navbar-left">
        {showMenu && (
          <>
            <button className="menu-btn" onClick={onMenuClick}>
              <FaBars />
            </button>
            {/* Collapse/Expand Button */}
            <button 
              className="collapse-btn" 
              onClick={toggleCollapse} 
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
            </button>
          </>
        )}
        <Link to="/" className="logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">Roamsmart<span>Digital Service</span></span>
        </Link>
      </div>

      <div className="navbar-center">
        {user && (
          <div className="wallet-chip">
            <span className="wallet-icon">💰</span>
            <span className="wallet-amount">₵{user.wallet_balance?.toFixed(2) || '0.00'}</span>
          </div>
        )}
        
        {/* Search Bar */}
        <div className={`search-container ${showSearch ? 'active' : ''}`}>
          {showSearch ? (
            <form onSubmit={handleSearch} className="search-form">
              <input 
                type="text" 
                placeholder="Search products, orders on Roamsmart..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit"><FaSearch /></button>
              <button type="button" onClick={() => setShowSearch(false)}><FaTimes /></button>
            </form>
          ) : (
            <button className="search-btn" onClick={() => setShowSearch(true)}>
              <FaSearch />
            </button>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="notification-dropdown">
              <button 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    className="notification-panel"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="notification-header">
                      <h4>Roamsmart Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="mark-read-btn">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications?.length === 0 ? (
                        <p className="no-notifications">No notifications from Roamsmart</p>
                      ) : (
                        notifications?.slice(0, 5).map(notif => (
                          <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                            <div className="notification-content">
                              <p>{notif.message}</p>
                              <small>{new Date(notif.created_at).toLocaleString()}</small>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications?.length > 5 && (
                      <div className="notification-footer">
                        <Link to="/notifications">View all notifications on Roamsmart</Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Menu */}
            <div className="user-menu">
              <img 
                src={getAvatarUrl()} 
                alt={user?.username || 'User'} 
                className="user-avatar"
                onError={(e) => {
                  console.error('Navbar: Avatar failed to load for user:', user?.username);
                  console.error('Navbar: Failed avatar URL was:', getAvatarUrl());
                  setAvatarError(true);
                  // Use a reliable fallback
                  const username = user?.username || 'User';
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=40&bold=true`;
                }}
              />
              <div className="user-dropdown">
                <Link to="/profile"><FaUserCircle /> Profile</Link>
                <Link to="/wallet/transactions"><FaWallet /> Wallet</Link>
                {user.is_agent && <Link to="/earnings"><FaShoppingCart /> Earnings on Roamsmart</Link>}
                <button onClick={handleLogout}><FaSignOutAlt /> Logout</button>
              </div>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn-login">Login to Roamsmart</Link>
            <Link to="/register" className="btn-register">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}