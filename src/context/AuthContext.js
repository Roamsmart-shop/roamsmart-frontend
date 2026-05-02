// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const AuthContext = createContext();

// Storage keys - MUST match api.js
const STORAGE_KEYS = {
  TOKEN: 'roamsmart_token',
  USER: 'roamsmart_user',
  TOKEN_EXPIRY: 'roamsmart_token_expiry'
};

// Company configuration
const COMPANY_CONFIG = {
  name: 'Roamsmart Digital Service',
  email: {
    support: 'support@roamsmart.shop',
    admin: 'admin@roamsmart.shop',
    payment: 'payment@roamsmart.shop'
  },
  website: 'https://roamsmart.shop'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();

  // Session timeout duration (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Check if token is expired
        const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          handleSessionExpired();
        } else {
          fetchUser();
          startSessionTimer();
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
        setLoading(false);
      }
    } else if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
    
    // Listen for tab close to logout
    window.addEventListener('beforeunload', handleBeforeUnload);
    // Listen for storage changes across tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
      if (sessionTimeout) clearTimeout(sessionTimeout);
    };
  }, []);

  // Handle storage changes from other tabs
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEYS.USER && e.newValue) {
      try {
        const updatedUser = JSON.parse(e.newValue);
        setUser(updatedUser);
        console.log('User updated from another tab:', updatedUser);
      } catch (error) {
        console.error('Failed to parse user from storage:', error);
      }
    }
    if (e.key === STORAGE_KEYS.TOKEN && !e.newValue) {
      // Token was removed in another tab
      logout();
    }
  };

  // ========== FETCH USER DATA ==========
  const fetchUser = async () => {
    try {
      // Use /user/stats endpoint
      const res = await api.get('/user/stats');
      
      console.log('Fetch user response:', res.data);
      
      // Handle different response structures
      let userData;
      if (res.data.user) {
        userData = res.data.user;
      } else if (res.data.data?.user) {
        userData = res.data.data.user;
      } else if (res.data.data) {
        userData = res.data.data;
      } else {
        userData = res.data;
      }
      
      // Ensure userData has all required fields
      if (!userData.role) {
        userData.role = userData.is_agent ? 'agent' : 'user';
      }
      
      // Map avatar field to avatar_url for consistency
      if (userData.avatar && !userData.avatar_url) {
        userData.avatar_url = userData.avatar;
      }
      if (userData.avatar_url && !userData.avatar) {
        userData.avatar = userData.avatar_url;
      }
      
      console.log('Processed user data:', userData);
      console.log('Avatar URL:', userData.avatar_url);
      
      setUser(userData);
      
      // Store user in localStorage using consistent keys
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      
      // Set token expiry (7 days from now) if not already set
      if (!localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)) {
        const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
      }
      
      // Fetch user permissions
      if (userData.role === 'admin' || userData.role === 'super_admin') {
        fetchPermissions();
      }
      
      // Fetch notifications
      fetchNotifications();
      
      startSessionTimer();
      
      // Dispatch event for user update
      window.dispatchEvent(new CustomEvent('user-context-updated', { 
        detail: { user: userData }
      }));
      
      return userData;
      
    } catch (error) {
      console.error('Failed to fetch user:', error);
      
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Using stored user data as fallback:', parsedUser);
          setUser(parsedUser);
          return parsedUser;
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      
      if (error.response?.status === 401) {
        handleSessionExpired();
      }
      
      // Don't clear token on 405 errors
      if (error.response?.status !== 405) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserContext = (updatedUserData) => {
    console.log('updateUserContext called with:', updatedUserData);
    
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedUserData };
      // Update localStorage using consistent keys
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('user-context-updated', { 
        detail: { user: newUser }
      }));
      
      return newUser;
    });
  };

  // ========== FETCH USER PERMISSIONS ==========
  const fetchPermissions = async () => {
    try {
      const res = await api.get('/user/permissions');
      setPermissions(res.data.permissions || []);
    } catch (error) {
      console.error('Failed to fetch permissions');
    }
  };

  // ========== FETCH NOTIFICATIONS ==========
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/user/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  // ========== SESSION MANAGEMENT ==========
  const startSessionTimer = () => {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    
    const timeout = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
    
    setSessionTimeout(timeout);
  };

  const resetSessionTimer = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      startSessionTimer();
    }
  };

  const handleSessionTimeout = async () => {
    const result = await Swal.fire({
      title: 'Session Timeout',
      text: 'Your session is about to expire due to inactivity. Do you want to stay logged in?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Stay Logged In',
      cancelButtonText: 'Logout',
      timer: 60000,
      timerProgressBar: true
    });
    
    if (result.isConfirmed) {
      try {
        await api.post('/auth/refresh');
        resetSessionTimer();
        toast.success('Session extended');
      } catch (error) {
        handleSessionExpired();
      }
    } else {
      logout();
    }
  };

  const handleSessionExpired = () => {
    Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      icon: 'info',
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Login Again'
    }).then(() => {
      logout();
      navigate('/login');
    });
  };

  const handleBeforeUnload = () => {};

  // ========== ACTIVITY TRACKING ==========
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (user) {
        resetSessionTimer();
      }
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  // ========== LOGIN FUNCTION ==========
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', { email, password, remember_me: rememberMe });
      
      if (res.data.success) {
        const { token, user: userData, redirect } = res.data;
        
        // Store token and user data using consistent keys
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        
        // Set token expiry (remember me = 30 days, else 7 days)
        const expiryDays = rememberMe ? 30 : 7;
        const expiry = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
        
        setUser(userData);
        
        // Fetch permissions for admin
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          fetchPermissions();
        }
        
        // Fetch notifications
        fetchNotifications();
        
        // Start session timer
        startSessionTimer();
        
        toast.success(`Welcome back, ${userData.username}!`);
        
        // Log login activity
        api.post('/auth/log-activity', { action: 'login' }).catch(err => {
          console.warn('Could not log activity:', err);
        });
        
        return { success: true, redirect };
      }
      
      return { success: false, error: res.data.error };
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 403 || error.response?.data?.requires_verification) {
        return { 
          success: false, 
          requires_verification: true, 
          email: error.response?.data?.data?.email || email,
          message: error.response?.data?.message || 'Please verify your email to continue'
        };
      }
      
      if (error.response?.data?.requires_2fa) {
        return { 
          success: false, 
          requires_2fa: true, 
          user_id: error.response?.data?.user_id,
          message: error.response?.data?.message || '2FA verification required'
        };
      }
      
      return { success: false, error: error.response?.data?.error || 'Invalid credentials' };
    }
  };

  // ========== REGISTER FUNCTION ==========
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      
      if (res.data.success) {
        toast.success('Verification code sent to your email!');
        return { success: true, data: res.data };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  // ========== VERIFY REGISTRATION CODE ==========
  const verifyRegistrationCode = async (code, email) => {
    try {
      const res = await api.post('/auth/verify-code', { code, email });
      
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
        toast.success('Email verified successfully!');
        return { success: true, data: res.data };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Verification failed' };
    }
  };

  // ========== LOGOUT FUNCTION ==========
  const logout = async () => {
    try {
      await api.post('/auth/log-activity', { action: 'logout' }).catch(() => {});
    } catch (error) {}
    
    // Clear all storage using consistent keys
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    sessionStorage.clear();
    
    // Clear state
    setUser(null);
    setPermissions([]);
    setNotifications([]);
    setUnreadCount(0);
    
    // Clear session timer
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // ========== UPDATE USER PROFILE ==========
  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/user/profile', updates);
      
      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.user };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
        return { success: true };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Update failed' };
    }
  };

  // ========== CHANGE PASSWORD ==========
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (res.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Password change failed' };
    }
  };

  // ========== FORGOT PASSWORD ==========
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      
      if (res.data.success) {
        toast.success('Reset link sent to your email');
        return { success: true };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Failed to send reset link' };
    }
  };

  // ========== RESET PASSWORD ==========
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { token, new_password: newPassword });
      
      if (res.data.success) {
        toast.success('Password reset successfully');
        return { success: true };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  };

  // ========== MARK NOTIFICATION AS READ ==========
  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(`/user/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.post('/user/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  // ========== PERMISSION CHECKS ==========
  const hasPermission = (permission) => {
    if (user?.role === 'super_admin') return true;
    return permissions.includes(permission);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role) || (user.is_agent && roles.includes('agent'));
  };

  // ========== REFRESH USER DATA ==========
  const refreshUser = async () => {
    try {
      const userData = await fetchUser();
      return userData;
    } catch (error) {
      console.error('Refresh user failed:', error);
      return null;
    }
  };

  // ========== TWO-FACTOR AUTHENTICATION ==========
  const enable2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/enable');
      return { success: true, qrCode: res.data.qr_code, secret: res.data.secret };
    } catch (error) {
      return { success: false, error: 'Failed to enable 2FA' };
    }
  };

  const verify2FA = async (code) => {
    try {
      const res = await api.post('/auth/2fa/verify', { code });
      if (res.data.success) {
        toast.success('2FA enabled successfully');
        return { success: true };
      }
      return { success: false, error: 'Invalid code' };
    } catch (error) {
      return { success: false, error: 'Verification failed' };
    }
  };

  const disable2FA = async () => {
    try {
      await api.post('/auth/2fa/disable');
      toast.success('2FA disabled');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to disable 2FA' };
    }
  };

  // ========== SOCIAL LOGIN ==========
  const socialLogin = async (provider, token) => {
    try {
      const res = await api.post(`/auth/${provider}`, { token });
      
      if (res.data.success) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success(`Welcome ${res.data.user.username}!`);
        return { success: true, redirect: res.data.redirect };
      }
      
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Social login failed' };
    }
  };

  // ========== DEVICE MANAGEMENT ==========
  const getActiveSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      return res.data.sessions || [];
    } catch (error) {
      return [];
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session revoked');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to revoke session' };
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      await api.delete('/auth/sessions/others');
      toast.success('All other sessions revoked');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to revoke sessions' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
        notifications,
        unreadCount,
        companyConfig: COMPANY_CONFIG,
        login,
        register,
        verifyRegistrationCode,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        refreshUser,
        updateUserContext,
        hasPermission,
        hasRole,
        markNotificationRead,
        markAllNotificationsRead,
        fetchNotifications,
        enable2FA,
        verify2FA,
        disable2FA,
        socialLogin,
        getActiveSessions,
        revokeSession,
        revokeAllOtherSessions,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        isAgent: user?.is_agent || false,
        isSuperAdmin: user?.role === 'super_admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { COMPANY_CONFIG };