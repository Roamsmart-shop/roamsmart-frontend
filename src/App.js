// src/App.js - Fixed to only show user data on authenticated pages
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AnnouncementBanner from './components/AnnouncementBanner';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

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
import BecomeAgent from './pages/BecomeAgent';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landingpages'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
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
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // ========== SIDEBAR STATE WITH IMPROVED PERSISTENCE ==========
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const isMobileDevice = window.innerWidth <= 768;
    if (isMobileDevice) return false;
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) return JSON.parse(saved);
    return true;
  });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // ========== IMPROVED RESIZE HANDLING ==========
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        
        if (mobile) {
          setSidebarOpen(false);
          setIsMobileSidebarOpen(false);
        } else {
          const saved = localStorage.getItem('sidebar_open');
          if (saved === null && sidebarOpen === false) {
            setSidebarOpen(true);
          }
        }
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);
  
  // Save sidebar state to localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen, isMobile]);
  
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMobile]);
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Store the last dashboard in sessionStorage when user navigates
  useEffect(() => {
    if (user && location.pathname) {
      const currentPath = location.pathname;
      if (currentPath.startsWith('/admin') || 
          currentPath.startsWith('/agent') || 
          currentPath.startsWith('/dashboard') ||
          currentPath.startsWith('/store') ||
          currentPath.startsWith('/inventory')) {
        sessionStorage.setItem('last_dashboard', currentPath);
      }
    }
  }, [location.pathname, user]);
  
  // ========== CONDITIONAL RETURNS AFTER ALL HOOKS ==========
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  // ========== DASHBOARD DETERMINATION ==========
  let dashboardPath = '/';
  let actualIsAdmin = false;
  let actualIsAgent = false;
  
  if (user) {
    actualIsAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    actualIsAgent = user?.is_agent || false;
    
    const savedDashboard = sessionStorage.getItem('last_dashboard');
    const currentPath = location.pathname;
    const isOnDashboard = currentPath.startsWith('/admin') || 
                         currentPath.startsWith('/agent') || 
                         currentPath.startsWith('/dashboard');
    
    let correctDashboard = '/dashboard';
    if (actualIsAdmin) correctDashboard = '/admin';
    else if (actualIsAgent) correctDashboard = '/agent';
    
    if (savedDashboard && !isOnDashboard) {
      const isValidForRole = 
        (actualIsAdmin && savedDashboard.startsWith('/admin')) ||
        (actualIsAgent && (savedDashboard.startsWith('/agent') || savedDashboard.startsWith('/store') || savedDashboard.startsWith('/inventory'))) ||
        (!actualIsAdmin && !actualIsAgent && savedDashboard.startsWith('/dashboard'));
      
      if (isValidForRole) {
        dashboardPath = savedDashboard;
      } else {
        dashboardPath = correctDashboard;
      }
    } else if (!isOnDashboard) {
      dashboardPath = correctDashboard;
    }
  }
  
  // ========== FIX: REDIRECT LOGIC - EXCLUDE RESET-PASSWORD ==========
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.includes(location.pathname);
  const isResetPage = location.pathname === '/reset-password';
  
  // Only redirect for auth pages, NOT for reset-password
  if (user && isAuthPage && !isResetPage) {
    const redirectPath = actualIsAdmin ? '/admin' : (actualIsAgent ? '/agent' : '/dashboard');
    return <Navigate to={redirectPath} replace />;
  }
  
  // ========== DETERMINE IF SIDEBAR SHOULD BE SHOWN ==========
  // Sidebar only shows on dashboard routes when user is authenticated
  const isDashboardRoute = location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/agent') || 
                          location.pathname.startsWith('/dashboard') ||
                          location.pathname.startsWith('/store') ||
                          location.pathname.startsWith('/inventory') ||
                          location.pathname.startsWith('/profile') ||
                          location.pathname.startsWith('/transactions') ||
                          location.pathname.startsWith('/wallet') ||
                          location.pathname.startsWith('/earnings') ||
                          location.pathname.startsWith('/referrals') ||
                          location.pathname.startsWith('/waec-vouchers') ||
                          location.pathname.startsWith('/afa-registration') ||
                          location.pathname.startsWith('/2fa') ||
                          location.pathname.startsWith('/sessions') ||
                          location.pathname.startsWith('/become-agent');
  
  // ========== FIX: Determine if this is a public page ==========
  const isPublicPage = location.pathname === '/' || 
                       location.pathname === '/login' || 
                       location.pathname === '/register' ||
                       location.pathname === '/forgot-password' ||
                       location.pathname === '/reset-password' ||  // Add reset-password here
                       location.pathname === '/support' ||
                       location.pathname === '/faq' ||
                       location.pathname === '/privacy' ||
                       location.pathname === '/terms' ||
                       location.pathname === '/refund';
  
  // Navbar shows on ALL pages
  const showNavbar = true;
  const showSidebar = user && isDashboardRoute && !isResetPage; // Don't show sidebar on reset page
  
  // Sidebar visibility logic
  const isSidebarVisible = isMobile ? isMobileSidebarOpen : sidebarOpen;
  
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
  
  // ========== RENDER APP WITH NAVBAR ALWAYS VISIBLE ==========
  return (
    <>
      {user && <AnnouncementBanner />}
      
      <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Navbar - Always visible, but only show user data on non-public pages */}
        <Navbar 
          onMenuClick={toggleSidebar} 
          showMenu={showSidebar}
          isMobile={isMobile}
          onCollapse={toggleCollapse}
          isCollapsed={isCollapsed}
          sidebarOpen={isSidebarVisible}
          user={!isPublicPage && user ? user : null}  
        />
        
        {/* Main Content Area with Sidebar and Page Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Sidebar Overlay for Mobile */}
          {showSidebar && isMobileSidebarOpen && isMobile && (
            <div 
              className="sidebar-overlay show" 
              onClick={closeSidebar}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 999,
                transition: 'all 0.3s ease'
              }}
            />
          )}
          
          {/* Sidebar Container */}
          {showSidebar && (
            <div 
              className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}
              style={{
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                height: '100%',
                width: isCollapsed ? '80px' : '280px',
                backgroundColor: '#fff',
                boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                transform: isMobile ? (isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
                zIndex: 1000,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Sidebar 
                isOpen={isSidebarVisible} 
                onClose={closeSidebar} 
                user={user}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
              />
            </div>
          )}
          
          {/* Page Content - Scrollable Area */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              transition: 'margin-left 0.3s ease',
              marginLeft: !isMobile && showSidebar && isSidebarVisible ? (isCollapsed ? '80px' : '280px') : 0,
              width: '100%'
            }}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes - No Sidebar */}
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
                
                {/* User Routes - With Sidebar */}
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
                
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to={user ? (actualIsAdmin ? '/admin' : (actualIsAgent ? '/agent' : '/dashboard')) : '/'} replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: { background: '#333', color: '#fff', borderRadius: '12px' }
          }} 
        />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;