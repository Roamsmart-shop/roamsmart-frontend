// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('roamsmart_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/user/stats');
      setUser(res.data.user);
    } catch (error) {
      localStorage.removeItem('roamsmart_token');
      localStorage.removeItem('roamsmart_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', { email, password, remember_me: rememberMe });
      if (res.data.success) {
        localStorage.setItem('roamsmart_token', res.data.token);
        localStorage.setItem('roamsmart_user', JSON.stringify(res.data.user));
        
        // Set token expiry based on remember me
        const expiryDays = rememberMe ? 30 : 7;
        const expiry = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
        localStorage.setItem('roamsmart_token_expiry', expiry.toString());
        
        setUser(res.data.user);
        toast.success(`Welcome back to ${COMPANY.shortName}, ${res.data.user.username}!`);
        return { success: true, redirect: res.data.redirect };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      // Check for verification required
      if (error.response?.status === 403 || error.response?.data?.requires_verification) {
        return { 
          success: false, 
          requires_verification: true, 
          email: email,
          message: error.response?.data?.message || 'Please verify your email to continue on Roamsmart'
        };
      }
      // Check for 2FA requirement
      if (error.response?.data?.requires_2fa) {
        return { 
          success: false, 
          requires_2fa: true, 
          user_id: error.response?.data?.user_id,
          message: error.response?.data?.message || '2FA verification required for Roamsmart'
        };
      }
      return { success: false, error: error.response?.data?.error || `Login failed on ${COMPANY.shortName}` };
    }
  };

  const logout = async () => {
    const result = await Swal.fire({
      title: `Logout from ${COMPANY.shortName}?`,
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await api.post('/auth/log-activity', { action: 'logout' }).catch(() => {});
    } catch (error) {
      // Ignore errors on logout
    }
    
    localStorage.removeItem('roamsmart_token');
    localStorage.removeItem('roamsmart_user');
    localStorage.removeItem('roamsmart_token_expiry');
    sessionStorage.clear();
    
    setUser(null);
    toast.success(`Logged out from ${COMPANY.shortName}`);
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data.success) {
        toast.success(`Verification code sent to ${userData.email} from ${COMPANY.shortName}!`);
        return { success: true, data: res.data };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || `Registration failed on ${COMPANY.shortName}` };
    }
  };

  const verifyRegistrationCode = async (code, email) => {
    try {
      const res = await api.post('/auth/verify-code', { code, email });
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('roamsmart_token', res.data.token);
          localStorage.setItem('roamsmart_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
        toast.success(`Email verified successfully on ${COMPANY.shortName}!`);
        return { success: true, data: res.data };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Verification failed' };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/user/profile', updates);
      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.user };
        setUser(updatedUser);
        localStorage.setItem('roamsmart_user', JSON.stringify(updatedUser));
        toast.success(`Profile updated on ${COMPANY.shortName}`);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Update failed' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.data.success) {
        toast.success(`Password changed successfully on ${COMPANY.shortName}`);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Password change failed' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success(`Password reset link sent to ${email} from ${COMPANY.shortName}`);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Failed to send reset link' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { token, new_password: newPassword });
      if (res.data.success) {
        toast.success(`Password reset successfully on ${COMPANY.shortName}`);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isAgent = user?.is_agent || false;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      verifyRegistrationCode,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      isAdmin,
      isAgent,
      isSuperAdmin,
      companyName: COMPANY.name
    }}>
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