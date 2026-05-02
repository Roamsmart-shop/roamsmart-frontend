// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoginVerification from '../components/LoginVerification';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  email: 'support@roamsmart.shop'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);
    
    console.log('Login result:', result);
    
    if (result.success) {
      toast.success('Login successful! Redirecting...');
      navigate(result.redirect || '/dashboard');
    } else if (result.requires_verification) {
      // Show verification page for unverified email
      setPendingEmail(result.email || email);
      setShowVerification(true);
      toast.success('Please verify your email to continue');
    } else if (result.requires_2fa) {
      // Handle 2FA verification
      toast.loading('2FA verification required');
      // Navigate to 2FA page
      navigate('/2fa/setup', { state: { userId: result.user_id } });
    } else {
      toast.error(result.error || 'Login failed. Invalid credentials.');
    }
  };

  // Show verification screen
  if (showVerification) {
    return (
      <LoginVerification 
        email={pendingEmail}
        onVerified={(data) => {
          // Store token and user data
          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          toast.success('Email verified! Redirecting...');
          navigate(data.redirect || '/dashboard');
        }}
        onCancel={() => setShowVerification(false)}
      />
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
            <div className="logo">🚀</div>
            <h1>Welcome Back</h1>
            <p>Login to your {COMPANY.name} account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon">
                <FaEnvelope />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon">
                <FaLock />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? <FaSpinner className="spinning" /> : null}
              {loading ? ' Logging in...' : ' Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          </div>
          
          <div className="auth-support">
            <p>Need help? Contact <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}