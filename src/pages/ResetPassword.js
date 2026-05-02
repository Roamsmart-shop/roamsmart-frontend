// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const COMPANY = {
  name: 'Roamsmart Digital Service'
};

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resetToken = params.get('token');
    
    if (!resetToken) {
      toast.error('Invalid reset link. Please request a new one.');
      navigate('/forgot-password');
      return;
    }
    
    setToken(resetToken);
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      
      if (response.data.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-header">
              <div className="logo">✅</div>
              <h1>Password Reset Successful!</h1>
              <p>Your password has been changed successfully.</p>
            </div>
            
            <div className="success-content">
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <p>You can now login with your new password.</p>
            </div>
            
            <Link to="/login" className="btn-primary btn-block">
              Go to Login
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <div className="logo">🔐</div>
            <h1>Create New Password</h1>
            <p>Enter your new password for {COMPANY.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <div className="input-icon">
                <FaLock />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter new password (min 6 characters)" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-icon">
                <FaLock />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm your new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? <FaSpinner className="spinning" /> : null}
              {loading ? ' Resetting...' : ' Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}