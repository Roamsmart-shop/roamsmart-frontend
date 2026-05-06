// src/App.js
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AnnouncementBanner from './components/AnnouncementBanner';
import { Toaster } from 'react-hot-toast';
import api from './services/api';

// Direct imports for core components
import AgentOrders from './pages/AgentOrders';
import AgentInventory from './pages/AgentInventory';
import AgentStoreDashboard from './pages/AgentStoreDashboard';
import AgentCustomers from './pages/AgentCustomers';
import AFARegistration from './pages/AFARegistration';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WAECVouchersPage from './pages/WAECVouchersPage';
import AdminPriceManagement from './pages/AdminPriceManagement';
import AdminDashboard from './pages/AdminDashboard';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landingpages'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const BecomeAgent = lazy(() => import('./pages/BecomeAgent'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const WalletTransactions = lazy(() => import('./pages/WalletTransactions'));
const Earnings = lazy(() => import('./pages/Earnings'));
const StoreSetup = lazy(() => import('./pages/StoreSetup'));
const ProductsPricing = lazy(() => import('./pages/ProductsPricing'));
const StoreOrders = lazy(() => import('./pages/StoreOrders'));
const StoreClients = lazy(() => import('./pages/StoreClients'));
const AgentCart = lazy(() => import('./pages/AgentCart'));
const Referrals = lazy(() => import('./pages/Referrals'));
const KYCVerification = lazy(() => import('./pages/KYCVerification'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const BackupManager = lazy(() => import('./pages/BackupManager'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const FAQ = lazy(() => import('./pages/FAQ'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const Sessions = lazy(() => import('./pages/Sessions'));

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading Roamsmart...</p>
  </div>
);

function AppContent() {
  const { user, loading, isAdmin, isAgent, refreshUser } = useAuth();
  const location = useLocation();
  
  // State for role overrides (to prevent wrong redirects on refresh)
  const [verifiedRole, setVerifiedRole] = useState(null);
  const [verifyingRole, setVerifyingRole] = useState(true);
  
  // Load saved state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth > 768;
  });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // CRITICAL: Verify user role from backend on page load (prevents wrong redirects on refresh)
  useEffect(() => {
    const verifyUserRole = async () => {
      const token = localStorage.getItem('roamsmart_token');
      if (!token) {
        setVerifyingRole(false);
        return;
      }
      
      try {
        const res = await api.get('/user/stats');
        const userData = res.data.user || res.data.data?.user;
        
        if (userData) {
          console.log('Verified user role from backend:', userData.role);
          setVerifiedRole(userData.role);
          
          // If role is different from stored, update localStorage
          const storedUser = localStorage.getItem('roamsmart_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== userData.role) {
              console.log('Updating stored user role from', parsedUser.role, 'to', userData.role);
              parsedUser.role = userData.role;
              localStorage.setItem('roamsmart_user', JSON.stringify(parsedUser));
            }
          }
        }
      } catch (error) {
        console.error('Failed to verify user role:', error);
      } finally {
        setVerifyingRole(false);
      }
    };
    
    verifyUserRole();
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Handle window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOpen(false);
        setIsMobileSidebarOpen(false);
      } else {
        const saved = localStorage.getItem('sidebar_open');
        if (saved === null) {
          setSidebarOpen(true);
        }
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Don't render until we've verified the role
  if (loading || verifyingRole) {
    return <LoadingScreen />;
  }

  // Determine actual role (prioritize verified role from backend)
  let actualRole = user?.role;
  let actualIsAgent = user?.is_agent;
  let actualIsAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Override with verified role if available (prevents wrong redirects on refresh)
  if (verifiedRole) {
    actualRole = verifiedRole;
    actualIsAdmin = verifiedRole === 'admin' || verifiedRole === 'super_admin';
    actualIsAgent = false; // Admin is not an agent
  }
  
  // Special case for admin email
  if (user?.email === 'admin@roamsmart.shop' && actualRole !== 'super_admin') {
    console.log('Admin email detected - forcing super_admin role');
    actualRole = 'super_admin';
    actualIsAdmin = true;
    actualIsAgent = false;
  }
  
  // Determine which dashboard to show based on verified role
  let dashboardToShow = null;
  
  if (actualRole === 'super_admin' || actualRole === 'admin') {
    dashboardToShow = 'admin';
  } else if (actualIsAgent || user?.is_agent) {
    dashboardToShow = 'agent';
  } else {
    dashboardToShow = 'user';
  }
  
  console.log('Dashboard determination:', { 
    actualRole, 
    actualIsAdmin, 
    dashboardToShow,
    userEmail: user?.email 
  });
  
  // Force redirect based on current path
  const currentPath = location.pathname;
  
  // If user is on wrong dashboard, redirect
  if (dashboardToShow === 'admin' && !currentPath.startsWith('/admin')) {
    console.log('Redirecting admin to /admin');
    window.location.href = '/admin';
    return null;
  }
  
  if (dashboardToShow === 'agent' && !currentPath.startsWith('/agent') && !currentPath.startsWith('/store') && !currentPath.startsWith('/inventory')) {
    console.log('Redirecting agent to /agent');
    window.location.href = '/agent';
    return null;
  }
  
  if (dashboardToShow === 'user' && currentPath === '/admin') {
    console.log('User trying to access admin - redirecting to /dashboard');
    window.location.href = '/dashboard';
    return null;
  }

  const showSidebar = user && (actualIsAdmin || actualIsAgent || user.role === 'user');

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    } else {
      setSidebarOpen(false);
    }
  };

  const isSidebarVisible = isMobile ? isMobileSidebarOpen : sidebarOpen;

  return (
    <>
      {user && <AnnouncementBanner />}
      
      <div className="app">
        {/* Sidebar Overlay for Mobile */}
        {showSidebar && isSidebarVisible && isMobile && (
          <div className="sidebar-overlay show" onClick={closeSidebar} />
        )}
        
        {/* Sidebar - This will push content on desktop */}
        {showSidebar && (
          <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${isSidebarVisible ? 'open' : 'closed'}`}>
            <Sidebar 
              isOpen={isSidebarVisible} 
              onClose={closeSidebar} 
              user={user}
              isCollapsed={isCollapsed}
              onToggleCollapse={toggleCollapse}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className={`main-content ${showSidebar && isSidebarVisible ? 'with-sidebar' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Navbar 
            onMenuClick={toggleSidebar} 
            showMenu={showSidebar}
            isMobile={isMobile}
            onCollapse={toggleCollapse}
            isCollapsed={isCollapsed}
            sidebarOpen={isSidebarVisible}
          />
          
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/support" element={<Support />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/refund" element={<RefundPolicy />} />
              
              {/* User Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/waec-vouchers" element={
                <PrivateRoute>
                  <WAECVouchersPage />
                </PrivateRoute>
              } />
              
              <Route path="/admin/prices" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminPriceManagement />
                </PrivateRoute>
              } />
              
              <Route path="/afa-registration" element={
                <PrivateRoute>
                  <AFARegistration />
                </PrivateRoute>
              } />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              
              <Route path="/transactions" element={
                <PrivateRoute>
                  <Transactions />
                </PrivateRoute>
              } />
              
              <Route path="/wallet/transactions" element={
                <PrivateRoute>
                  <WalletTransactions />
                </PrivateRoute>
              } />
              
              <Route path="/earnings" element={
                <PrivateRoute>
                  <Earnings />
                </PrivateRoute>
              } />
              
              <Route path="/become-agent" element={
                <PrivateRoute>
                  <BecomeAgent />
                </PrivateRoute>
              } />
              
              <Route path="/referrals" element={
                <PrivateRoute>
                  <Referrals />
                </PrivateRoute>
              } />
              
              <Route path="/2fa/setup" element={
                <PrivateRoute>
                  <TwoFactorSetup />
                </PrivateRoute>
              } />
              
              <Route path="/sessions" element={
                <PrivateRoute>
                  <Sessions />
                </PrivateRoute>
              } />
              
              {/* Agent Inventory & Store Routes */}
              <Route path="/inventory" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <AgentInventory />
                </PrivateRoute>
              } />
              
              <Route path="/agent/store" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <AgentStoreDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/agent/orders" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <AgentOrders />
                </PrivateRoute>
              } />

              <Route path="/agent" element={
                <PrivateRoute allowedRoles={['agent', 'admin']}>
                  <AgentDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/agent/cart" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <AgentCart />
                </PrivateRoute>
              } />
              
              <Route path="/agent/customers" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <AgentCustomers />
                </PrivateRoute>
              } />
              
              <Route path="/store/setup" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <StoreSetup />
                </PrivateRoute>
              } />
              
              <Route path="/store/products" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <ProductsPricing />
                </PrivateRoute>
              } />
              
              <Route path="/store/orders" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <StoreOrders />
                </PrivateRoute>
              } />
              
              <Route path="/store/clients" element={
                <PrivateRoute allowedRoles={['agent']}>
                  <StoreClients />
                </PrivateRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/admin/kyc" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <KYCVerification />
                </PrivateRoute>
              } />
              
              <Route path="/admin/webhooks" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <Webhooks />
                </PrivateRoute>
              } />
              
              <Route path="/admin/backup" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <BackupManager />
                </PrivateRoute>
              } />
              
              <Route path="/admin/audit" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <AuditLogs />
                </PrivateRoute>
              } />
              
              <Route path="/admin/health" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <SystemHealth />
                </PrivateRoute>
              } />
              
              <Route path="/admin/roles" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <AdminRoles />
                </PrivateRoute>
              } />
              
              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#28a745',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc3545',
                secondary: '#fff',
              },
            },
          }} 
        />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;