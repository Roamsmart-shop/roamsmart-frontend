// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const COMPANY = {
  name: 'Roamsmart Digital Service',
  email: 'support@roamsmart.shop'
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Reset link sent to your email!');
      } else {
        toast.error(response.data.error || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
              <div className="logo">📧</div>
              <h1>Check Your Email</h1>
              <p>We've sent a password reset link to</p>
              <p className="email-highlight">{email}</p>
            </div>
            
            <div className="success-content">
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <p>Click the link in the email to reset your password.</p>
              <p className="small-text">The link will expire in 24 hours.</p>
            </div>
            
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
            <div className="logo">🔒</div>
            <h1>Forgot Password?</h1>
            <p>Enter your email to reset your {COMPANY.name} password</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon">
                <FaEnvelope />
                <input 
                  type="email" 
                  placeholder="Enter your registered email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? <FaSpinner className="spinning" /> : null}
              {loading ? ' Sending...' : ' Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
          
          <div className="auth-support">
            <p>Need help? Contact <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}