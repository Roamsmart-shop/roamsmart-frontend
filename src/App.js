// src/App.js
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AnnouncementBanner from './components/AnnouncementBanner';
import { Toaster } from 'react-hot-toast';
import api from './services/api';
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

function AppContent() {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Track if this is a refresh/reload
  const [isRestoring, setIsRestoring] = useState(true);
  
  // Add this missing state
  const [verifyingRole, setVerifyingRole] = useState(false);
  
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
  
  // Add loading timeout state
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingStartTime = useRef(Date.now());

  // Save current dashboard path when navigating (for refresh restore)
  useEffect(() => {
    if (user && location.pathname && !isRestoring) {
      const currentPath = location.pathname;
      // Only save dashboard paths
      if (currentPath.startsWith('/admin') || 
          currentPath.startsWith('/agent') || 
          currentPath.startsWith('/dashboard') ||
          currentPath.startsWith('/store') ||
          currentPath.startsWith('/inventory')) {
        sessionStorage.setItem('roamsmart_last_dashboard', currentPath);
        console.log('Saved dashboard path:', currentPath);
      }
    }
  }, [location.pathname, user, isRestoring]);

  // Check loading duration - FIXED
  useEffect(() => {
    const checkLoading = setInterval(() => {
      const isLoading = loading || verifyingRole || isRestoring;
      if (isLoading && (Date.now() - loadingStartTime.current) > 8000) {
        console.log('Loading taking too long - forcing render');
        setLoadingTimeout(true);
        setIsRestoring(false); // Force exit restoring state
      }
    }, 1000);
    
    return () => clearInterval(checkLoading);
  }, [loading, verifyingRole, isRestoring]);

  // Restore dashboard after refresh
  useEffect(() => {
    if (!loading && user && isRestoring && !loadingTimeout) {
      const lastDashboard = sessionStorage.getItem('roamsmart_last_dashboard');
      const currentPath = location.pathname;
      
      // Determine correct role-based dashboard
      const isSuperAdmin = user?.role === 'super_admin';
      const isAdminUser = user?.role === 'admin';
      const isAgentUser = user?.is_agent;
      const correctDashboard = isSuperAdmin || isAdminUser ? '/admin' : (isAgentUser ? '/agent' : '/dashboard');
      
      console.log('Restoring dashboard - Current:', currentPath, 'Last:', lastDashboard, 'Correct:', correctDashboard);
      
      // If we have a last dashboard and it's different from current, restore it
      if (lastDashboard && lastDashboard !== currentPath) {
        // Verify the last dashboard is valid for this user's role
        const isValidForRole = 
          ((isSuperAdmin || isAdminUser) && lastDashboard.startsWith('/admin')) ||
          (isAgentUser && (lastDashboard.startsWith('/agent') || lastDashboard.startsWith('/store') || lastDashboard.startsWith('/inventory'))) ||
          (!isSuperAdmin && !isAdminUser && !isAgentUser && lastDashboard.startsWith('/dashboard'));
        
        if (isValidForRole) {
          console.log('Restoring last dashboard:', lastDashboard);
          navigate(lastDashboard, { replace: true });
        } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
          console.log('Redirecting to correct dashboard:', correctDashboard);
          navigate(correctDashboard, { replace: true });
        }
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        // First time login or on public route
        console.log('First visit - redirecting to:', correctDashboard);
        navigate(correctDashboard, { replace: true });
      }
      
      setIsRestoring(false);
    }
  }, [loading, user, location.pathname, navigate, isRestoring, loadingTimeout]);

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

  // Show loading while restoring or loading - FIXED CONDITION
  if ((loading || verifyingRole || isRestoring) && !loadingTimeout) {
    return <LoadingScreen />;
  }

  // If timeout occurred, show retry option
  if (loadingTimeout) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Connection issue detected</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '20px', padding: '10px 20px', background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Tap to Retry
        </button>
      </div>
    );
  }

  // Determine user role
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminUser = user?.role === 'admin';
  const isAgentUser = user?.is_agent;
  
  // Special case for admin email
  let actualIsAdmin = isSuperAdmin || isAdminUser;
  let actualIsAgent = isAgentUser;
  
  if (user?.email === 'admin@roamsmart.shop' && !actualIsAdmin) {
    console.log('Admin email detected - forcing super_admin role');
    actualIsAdmin = true;
    actualIsAgent = false;
  }
  
  // Determine which dashboard to show
  let dashboardPath = null;
  
  if (actualIsAdmin) {
    dashboardPath = '/admin';
  } else if (actualIsAgent) {
    dashboardPath = '/agent';
  } else {
    dashboardPath = '/dashboard';
  }
  
  const currentPath = location.pathname;
  
  // Only redirect if on wrong dashboard and not on a valid page
  const shouldRedirect = () => {
    if (!user) return false;
    
    // Don't redirect if already on correct dashboard
    if (dashboardPath === '/admin' && currentPath.startsWith('/admin')) return false;
    if (dashboardPath === '/agent' && (currentPath.startsWith('/agent') || currentPath.startsWith('/store') || currentPath.startsWith('/inventory'))) return false;
    if (dashboardPath === '/dashboard' && currentPath.startsWith('/dashboard')) return false;
    
    // Don't redirect on public routes
    if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') return false;
    
    return true;
  };
  
  if (shouldRedirect()) {
    console.log(`Redirecting to ${dashboardPath} from ${currentPath}`);
    return <Navigate to={dashboardPath} replace />;
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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;