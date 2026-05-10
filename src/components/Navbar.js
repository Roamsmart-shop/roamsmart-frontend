// src/components/Navbar.js - Only added click functionality for profile
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaWallet,
  FaShoppingCart, FaEnvelope, FaSearch, FaTimes, FaAngleLeft, FaAngleRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
};

// Logo Configuration - Updated with reliable paths
const LOGO_CONFIG = {
  // Try multiple possible logo locations
  primaryLogo: '/logo192.png',
  primaryLogoAlt: '/logo.png',
  primaryLogoFallback: '/assets/logo.png',
  // Mobile logo options
  mobileLogo: '/favicon-32x32.png',
  mobileLogoAlt: '/favicon.ico',
  // Fallback text when logo fails to load
  fallbackText: 'Roamsmart',
  // Logo dimensions
  width: 120,
  height: 40,
  // Logo alt text
  alt: 'Roamsmart Digital Service'
};

export default function Navbar({ onMenuClick, showMenu, isMobile, onCollapse, isCollapsed, sidebarOpen, user: propUser }) {
  const { user: authUser, logout, unreadCount, markAllNotificationsRead, notifications, updateUserContext } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use propUser if provided, otherwise use authUser
  const user = propUser || authUser;
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false); // NEW: State for user dropdown
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [avatarError, setAvatarError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth <= 768);

  // NEW: Refs for dropdowns
  const userMenuRef = useRef(null);
  const userDropdownRef = useRef(null);

  // List of logo URLs to try
  const logoUrls = [
    process.env.PUBLIC_URL + '/logo192.png',
    process.env.PUBLIC_URL + '/logo.png',
    process.env.PUBLIC_URL + '/logo512.png',
    process.env.PUBLIC_URL + '/favicon-32x32.png',
    process.env.PUBLIC_URL + '/favicon.ico',
    'https://ui-avatars.com/api/?name=RS&background=8B0000&color=fff&size=120&bold=true',
    'https://ui-avatars.com/api/?name=Roamsmart&background=8B0000&color=fff&size=120&bold=true'
  ];

  // NEW: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userMenuRef.current?.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Monitor screen size for responsive logo
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for avatar updates    
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      console.log('Navbar: Avatar update received', event.detail);
      setAvatarTimestamp(Date.now());
      setAvatarError(false);
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
    setShowUserDropdown(false); // Close dropdown before logout
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

  // NEW: Toggle user dropdown
  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // Get avatar URL - handles both 'avatar_url' and 'avatar' field names
  const getAvatarUrl = () => {
    const avatarField = user?.avatar_url || user?.avatar;
    
    if (avatarField && !avatarError) {
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://roamsmart-backend-production.up.railway.app';
      const avatarPath = avatarField.startsWith('/') ? avatarField : `/${avatarField}`;
      const fullUrl = `${baseUrl}${avatarPath}?t=${avatarTimestamp}`;
      return fullUrl;
    }
    
    const username = user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=40&bold=true`;
  };

  // Try next logo URL if current fails
  const handleLogoError = () => {
    if (currentLogoIndex < logoUrls.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1);
    } else {
      setLogoError(true);
    }
  };

  // Get current logo URL
  const getCurrentLogoUrl = () => {
    return logoUrls[currentLogoIndex];
  };

  return (
    <nav className={`navbar ${isCollapsed ? 'collapsed' : ''}`} style={{ 
      backgroundColor: '#fff', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '0 20px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 1001
    }}>
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showMenu && (
          <>
            {/* Mobile menu button */}
            <button 
              className="menu-btn mobile-menu-btn" 
              onClick={onMenuClick}
              aria-label="Open menu"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px'
              }}
            >
              <FaBars />
            </button>
            
            {/* Desktop collapse/expand button */}
            <button 
              className="collapse-btn desktop-only" 
              onClick={toggleCollapse} 
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: isMobileScreen ? 'none' : 'block'
              }}
            >
              {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
            </button>
          </>
        )}
        
        <Link to="/" className="logo" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none',
          gap: '10px'
        }}>
          {/* Logo Image - Always show company brand */}
          {!logoError && (
            <img 
              src={getCurrentLogoUrl()} 
              alt={LOGO_CONFIG.alt}
              style={{ 
                height: '40px',
                width: 'auto',
                maxWidth: '120px',
                objectFit: 'contain'
              }}
              onError={handleLogoError}
            />
          )}
          
          {/* Brand Text - Always visible as backup */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#8B0000',
              lineHeight: 1.2
            }}>
              {COMPANY.shortName}
            </span>
            {!isMobileScreen && (
              <span style={{ 
                fontSize: '10px', 
                color: '#666',
                letterSpacing: '0.5px'
              }}>
                Digital Service
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="navbar-center" style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'center' }}>
        {user && (
          <div className="wallet-chip" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f5f5f5',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span className="wallet-icon">💰</span>
            <span className="wallet-amount">₵{user.wallet_balance?.toFixed(2) || '0.00'}</span>
          </div>
        )}
        
        {/* Search Bar */}
        <div className={`search-container ${showSearch ? 'active' : ''}`} style={{ position: 'relative' }}>
          {showSearch ? (
            <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', gap: '5px' }}>
              <input 
                type="text" 
                placeholder="Search products, orders on Roamsmart..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  width: '250px'
                }}
              />
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FaSearch />
              </button>
              <button type="button" onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </form>
          ) : (
            <button className="search-btn" onClick={() => setShowSearch(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaSearch />
            </button>
          )}
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="notification-dropdown" style={{ position: 'relative' }}>
              <button 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '18px' }}
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge" style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '10px'
                  }}>{unreadCount}</span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    className="notification-panel"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      right: '0',
                      width: '300px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      zIndex: 1000
                    }}
                  >
                    <div className="notification-header" style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                      <h4>Roamsmart Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="mark-read-btn">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
            
            {/* User Menu - WITH CLICK FUNCTIONALITY ADDED */}
            <div className="user-menu" style={{ position: 'relative' }} ref={userMenuRef}>
              <img 
                src={getAvatarUrl()} 
                alt={user?.username || 'User'} 
                className="user-avatar"
                onClick={toggleUserDropdown}  // NEW: Added click handler
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  setAvatarError(true);
                  const username = user?.username || 'User';
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=40&bold=true`;
                }}
              />
              
              {/* CHANGED: Dropdown now shows based on state, not CSS hover */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div 
                    ref={userDropdownRef}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="user-dropdown"
                    style={{
                      position: 'absolute',
                      top: '50px',
                      right: '0',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      minWidth: '200px',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Added user info header */}
                    <div style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #eee',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {user?.username || 'User'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {user?.email}
                      </div>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setShowUserDropdown(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#333' }}
                    >
                      <FaUserCircle /> Profile
                    </Link>
                    <Link 
                      to="/wallet/transactions" 
                      onClick={() => setShowUserDropdown(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#333' }}
                    >
                      <FaWallet /> Wallet
                    </Link>
                    {user.is_agent && (
                      <Link 
                        to="/earnings" 
                        onClick={() => setShowUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#333' }}
                      >
                        <FaShoppingCart /> Earnings on Roamsmart
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout} 
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #eee', color: '#dc3545' }}
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="auth-buttons" style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn-login" style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#8B0000',
              border: '1px solid #8B0000',
              borderRadius: '4px',
              textDecoration: 'none'
            }}>Login to Roamsmart</Link>
            <Link to="/register" className="btn-register" style={{
              padding: '8px 16px',
              backgroundColor: '#8B0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none'
            }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}