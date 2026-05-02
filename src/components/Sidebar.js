// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaDatabase, FaShoppingCart, FaWallet, 
  FaUsers, FaChartLine, FaCog, FaSignOutAlt, FaHeadset,
  FaUserPlus, FaGift, FaHistory, FaStore, FaMoneyBillWave,
  FaExchangeAlt, FaChartPie, FaBell, FaShieldAlt, FaRobot,
  FaCloudUploadAlt, FaPlug, FaQrcode, FaTrophy, FaStar,
  FaMedal, FaCrown, FaFire, FaRocket, FaBoxes, FaTruck,
  FaHourglassHalf, FaUserCheck, FaUserTimes, FaCreditCard,
  FaUniversity, FaMobileAlt, FaWhatsapp, FaTelegram,
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFileInvoice,
  FaDownload, FaPrint, FaEye, FaEdit, FaTrash, FaPlus,
  FaMinus, FaArrowUp, FaArrowDown, FaChartBar, FaPieChart,
  FaLineChart, FaBarChart, FaCalendarAlt, FaClock, FaFilter,
  FaArrowRight, FaArrowLeft, FaDollarSign  // Added FaDollarSign
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { FaUserGraduate, FaGraduationCap } from 'react-icons/fa';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
};

export default function Sidebar({ isOpen, onClose, user: propUser, isCollapsed, onToggleCollapse }) {
  const { logout, updateUserContext, user: contextUser } = useAuth(); 
  const navigate = useNavigate();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  
  // Use user from context or props (prioritize context)
  const user = contextUser || propUser;
  
  // DEBUG: Log user data on mount and when it changes
  useEffect(() => {
    console.log('========== SIDEBAR DEBUG ==========');
    console.log('Sidebar: User from context/props:', user);
    console.log('Sidebar: User ID:', user?.id);
    console.log('Sidebar: Username:', user?.username);
    console.log('Sidebar: User role:', user?.role);
    console.log('Sidebar: isAdmin:', user?.role === 'admin');
    console.log('Sidebar: isAgent:', user?.is_agent);
    console.log('Sidebar: isSuperAdmin:', user?.role === 'super_admin');
    console.log('Sidebar: Avatar URL:', user?.avatar_url);
    console.log('Sidebar: isOpen:', isOpen);
    console.log('Sidebar: isCollapsed:', isCollapsed);
    console.log('===================================');
  }, [user, isOpen, isCollapsed]);
  
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.is_agent === true;
  const isSuperAdmin = user?.role === 'super_admin';
  
  // DEBUG: Log role determinations
  useEffect(() => {
    console.log('Sidebar Role Check:', {
      isAdmin,
      isAgent,
      isSuperAdmin,
      userRole: user?.role,
      userIsAgent: user?.is_agent
    });
  }, [isAdmin, isAgent, isSuperAdmin, user]);
  
  useEffect(() => {
    console.log('Sidebar: Component mounted');
    console.log('Sidebar: user?.avatar_url:', user?.avatar_url);
    
    const handleAvatarUpdate = (event) => {
      console.log('Sidebar: Avatar update event received', event.detail);
      setAvatarTimestamp(Date.now());
    };

    const handleUserUpdate = (event) => {
      console.log('Sidebar: User update event received', event.detail);
      setAvatarTimestamp(Date.now());
    };

    const handleStorageChange = (e) => {
      console.log('Sidebar: Storage change detected', e.key);
      if (e.key === 'user' || e.key === 'roamsmart_user') {
        console.log('Sidebar: User data changed in localStorage');
        setAvatarTimestamp(Date.now());
        try {
          const newUserData = JSON.parse(e.newValue);
          if (newUserData && updateUserContext) {
            updateUserContext(newUserData);
          }
        } catch (err) {
          console.error('Failed to parse user data:', err);
        }
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate);
    window.addEventListener('user-context-updated', handleUserUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
      window.removeEventListener('user-context-updated', handleUserUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUserContext, user?.avatar_url]);

  const getAvatarUrl = () => {
    const avatarUrl = user?.avatar_url || user?.avatar;
    
    console.log('Sidebar getAvatarUrl:', {
      avatarUrl,
      userAvatarUrl: user?.avatar_url,
      userAvatar: user?.avatar,
      timestamp: avatarTimestamp
    });
    
    if (avatarUrl) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const avatarPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
      const fullUrl = `${baseUrl}${avatarPath}?t=${avatarTimestamp}`;
      console.log('Sidebar: Full avatar URL:', fullUrl);
      return fullUrl;
    }
    
    const username = user?.username || 'Guest';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=100&bold=true`;
    console.log('Sidebar: Using fallback avatar URL:', fallbackUrl);
    return fallbackUrl;
  };

  // ========== USER LINKS ==========
  const userLinks = [
    { to: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard', description: 'Overview & Stats on Roamsmart' },
    { to: '/dashboard#bundles', icon: <FaDatabase />, label: 'Buy Data', description: 'Purchase data bundles on Roamsmart' },
    { to: '/wallet/transactions', icon: <FaHistory />, label: 'Wallet History', description: 'View all Roamsmart transactions' },
    { to: '/transactions', icon: <FaExchangeAlt />, label: 'Data Orders', description: 'Your purchase history on Roamsmart' },
    { to: '/afa-registration', icon: <FaUserGraduate />, label: 'AFA Registration', description: 'Register for AFA via Roamsmart' },
    { to: '/waec-vouchers', icon: <FaGraduationCap />, label: 'WAEC Vouchers', description: 'Purchase WAEC result checker on Roamsmart' },
    { to: '/earnings', icon: <FaMoneyBillWave />, label: 'Earnings', description: 'Track your Roamsmart commissions' },
    { to: '/become-agent', icon: <FaUserPlus />, label: 'Become Roamsmart Agent', description: 'Start earning more' },
    { to: '/referrals', icon: <FaGift />, label: 'Referrals', description: 'Invite & earn on Roamsmart' },
    { to: '/support', icon: <FaHeadset />, label: 'Support', description: 'Get Roamsmart help 24/7' },
    { to: '/profile', icon: <FaCog />, label: 'Settings', description: 'Account settings on Roamsmart' }
  ];

  // ========== AGENT LINKS ==========
  const agentLinks = [
    { to: '/agent/orders', icon: <FaShoppingCart />, label: 'Orders', description: 'Track customer orders on Roamsmart' },
    { to: '/agent/store', icon: <FaStore />, label: 'My Store', description: 'Your Roamsmart online store dashboard' },
    { to: '/inventory', icon: <FaBoxes />, label: 'Inventory', description: 'Track your Roamsmart data stock' },
    { to: '/agent', icon: <FaTachometerAlt />, label: 'Dashboard', description: 'Agent overview on Roamsmart' },
    { to: '/agent#sell', icon: <FaDatabase />, label: 'Sell Data', description: 'Wholesale prices on Roamsmart' },
    { to: '/agent/cart', icon: <FaShoppingCart />, label: 'Cart', description: 'Bulk purchases on Roamsmart' },
    { to: '/store/setup', icon: <FaStore />, label: 'My Store Setup', description: 'Configure your Roamsmart store' },
    { to: '/earnings', icon: <FaMoneyBillWave />, label: 'Earnings', description: 'Commission & withdrawals from Roamsmart' },
    { to: '/wallet/transactions', icon: <FaHistory />, label: 'Wallet History', description: 'All Roamsmart transactions' },
    { to: '/agent/customers', icon: <FaUsers />, label: 'Customers', description: 'Your customer base on Roamsmart' },
    { to: '/transactions', icon: <FaExchangeAlt />, label: 'Sales History', description: 'Your Roamsmart sales records' },
    { to: '/support', icon: <FaHeadset />, label: 'Support', description: 'Get Roamsmart help' },
    { to: '/profile', icon: <FaCog />, label: 'Settings', description: 'Account settings on Roamsmart' }
  ];

  // ========== ADMIN LINKS (UPDATED with Price Management) ==========
  const adminLinks = [
    { to: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', description: 'Roamsmart Overview & KPIs' },
    { to: '/admin#analytics', icon: <FaChartLine />, label: 'Analytics', description: 'Roamsmart Advanced analytics' },
    { to: '/admin/prices', icon: <FaDollarSign />, label: 'Price Management', description: 'Update user and agent prices on Roamsmart' }, // ADDED THIS
    { to: '/admin#users', icon: <FaUsers />, label: 'Users', description: 'Manage Roamsmart users' },
    { to: '/admin#agents', icon: <FaUserPlus />, label: 'Agents', description: 'Manage Roamsmart agents' },
    { to: '/admin#payments', icon: <FaWallet />, label: 'Payments', description: 'Manual payments on Roamsmart' },
    { to: '/admin#withdrawals', icon: <FaMoneyBillWave />, label: 'Withdrawals', description: 'Agent withdrawals from Roamsmart' },
    { to: '/admin#kyc', icon: <FaShieldAlt />, label: 'KYC Verification', description: 'Verify Roamsmart users' },
    { to: '/admin#webhooks', icon: <FaPlug />, label: 'Webhooks', description: 'Roamsmart API integrations' },
    { to: '/admin#backup', icon: <FaCloudUploadAlt />, label: 'Backup', description: 'Roamsmart database backup' },
    { to: '/admin#settings', icon: <FaCog />, label: 'Settings', description: 'Roamsmart system settings' }
  ];

  // ========== SUPER ADMIN LINKS (Additional) ==========
  const superAdminLinks = [
    { to: '/admin/roles', icon: <FaUserCheck />, label: 'Admin Roles', description: 'Manage Roamsmart admins' },
    { to: '/admin/audit', icon: <FaHistory />, label: 'Audit Logs', description: 'Admin actions on Roamsmart' },
    { to: '/admin/system', icon: <FaRobot />, label: 'System Health', description: 'Roamsmart server status' }
  ];

  // Combine links based on role
  let links = [];
  if (isAdmin) {
    links = adminLinks;
    console.log('Sidebar: Using ADMIN links');
  } else if (isAgent) {
    links = agentLinks;
    console.log('Sidebar: Using AGENT links');
  } else {
    links = userLinks;
    console.log('Sidebar: Using USER links');
  }
  
  if (isSuperAdmin) {
    links = [...adminLinks, ...superAdminLinks];
    console.log('Sidebar: Added SUPER ADMIN links');
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout from Roamsmart?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      logout();
      navigate('/login');
      onClose();
    }
  };

  const getUserTier = () => {
    if (isAdmin) return { name: 'Roamsmart Administrator', icon: <FaCrown />, color: '#ffd700' };
    if (isAgent) {
      const tier = user?.agent_tier || 'Bronze';
      const tierColors = {
        Bronze: '#cd7f32',
        Silver: '#c0c0c0',
        Gold: '#ffd700',
        Platinum: '#e5e4e2'
      };
      return { name: `${tier} Agent on Roamsmart`, icon: <FaMedal />, color: tierColors[tier] };
    }
    return { name: 'Roamsmart Customer', icon: <FaStar />, color: '#8B0000' };
  };

  const userTier = getUserTier();

  // DEBUG: Log links being rendered
  console.log('Sidebar: Rendering with links count:', links.length);
  console.log('Sidebar: Links:', links.map(l => l.label));

  return (
    <>
      <button className="sidebar-collapse-toggle" onClick={onToggleCollapse}>
        {isCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
      </button>
      
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header with User Info */}
        <div className="sidebar-header">
          <div className="user-avatar-wrapper">
            <img 
              src={getAvatarUrl()} 
              alt={user?.username || 'User'} 
              className="user-avatar-large"
              onError={(e) => {
                console.error('Sidebar: Avatar failed to load, using fallback');
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=8B0000&color=fff&size=100&bold=true`;
              }}
            />
            {isAgent && (
              <div className="tier-badge-sidebar" style={{ background: userTier.color }}>
                {userTier.icon} {userTier.name}
              </div>
            )}
          </div>
          
          <div className="user-info-sidebar">
            <h3>{user?.username || 'Guest'}</h3>
            <p className="user-role">
              {userTier.icon} {userTier.name}
            </p>
          </div>

          {/* Wallet Balance for Non-Admins */}
          {!isAdmin && (
            <div className="sidebar-wallet">
              <FaWallet />
              <span>₵{user?.wallet_balance?.toFixed(2) || '0.00'}</span>
            </div>
          )}

          {/* Agent Commission Preview */}
          {isAgent && (
            <div className="sidebar-commission">
              <FaMoneyBillWave />
              <span>Roamsmart Commission: {user?.commission_rate || 10}%</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {links && links.length > 0 ? (
            links.map((link, index) => (
              <NavLink 
                key={index} 
                to={link.to} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} 
                onClick={onClose}
                title={link.description}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
                {link.badge && <span className="nav-badge">{link.badge}</span>}
              </NavLink>
            ))
          ) : (
            <div className="no-links-message">Loading menu...</div>
          )}
        </nav>

        {/* Quick Actions for Agents */}
        {isAgent && (
          <div className="sidebar-quick-actions">
            <div className="quick-actions-title">
              <FaFire /> Roamsmart Quick Actions
            </div>
            <div className="quick-actions-grid">
              <button onClick={() => { navigate('/agent#sell'); onClose(); }} className="quick-action-btn">
                <FaDatabase /> Sell on Roamsmart
              </button>
              <button onClick={() => { navigate('/store/setup'); onClose(); }} className="quick-action-btn">
                <FaStore /> Store Setup
              </button>
              <button onClick={() => { navigate('/earnings'); onClose(); }} className="quick-action-btn">
                <FaMoneyBillWave /> Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Support & Help Section */}
        <div className="sidebar-support">
          <div className="support-links">
            <a href={`https://wa.me/233${COMPANY.phone}`} target="_blank" rel="noopener noreferrer" className="support-link">
              <FaWhatsapp /> Roamsmart WhatsApp
            </a>
            <a href={`tel:${COMPANY.phone}`} className="support-link">
              <FaPhoneAlt /> Call Roamsmart
            </a>
            <a href={`mailto:${COMPANY.email}`} className="support-link">
              <FaEnvelope /> Email Roamsmart
            </a>
          </div>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout from Roamsmart
          </button>
          <div className="sidebar-version">
            <small>{COMPANY.name} v2.0.0</small>
          </div>
        </div>
      </aside>
    </>
  );
}