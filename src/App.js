// src/App.js
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AnnouncementBanner from './components/AnnouncementBanner';
import { Toaster } from 'react-hot-toast';

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

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landingpages'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
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
  const { user, loading, isAdmin, isAgent } = useAuth();
  const location = useLocation();
  
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

  if (loading) return <LoadingScreen />;

  const showSidebar = user && (isAdmin || isAgent || user.role === 'user');

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

  // Determine if sidebar should be visible
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