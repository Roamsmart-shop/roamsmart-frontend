// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash, FaGift, FaSpinner } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Verification from '../components/Verification';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  email: 'support@roamsmart.shop'
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referral_code: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    // Validate Ghana phone number format
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        referral_code: formData.referral_code?.trim() || null
      });
      
      if (res.data.success) {
        setRegisteredEmail(formData.email);
        setShowVerification(true);
        toast.success(`Verification code sent to ${formData.email}!`);
      } else {
        toast.error(res.data.error || 'Registration failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (data) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    toast.success('Registration complete! Welcome to Roamsmart Digital Service!');
    navigate('/dashboard');
  };

  if (showVerification) {
    return (
      <Verification 
        type="email"
        email={registeredEmail}
        purpose="registration"
        onVerified={handleVerificationSuccess}
        redirectOnSuccess={true}
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
            <h1>Create Account</h1>
            <p>Join {COMPANY.name} today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username *</label>
              <div className="input-icon">
                <FaUser />
                <input 
                  type="text" 
                  name="username"
                  placeholder="Choose a username" 
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-icon">
                <FaEnvelope />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <div className="input-icon">
                <FaPhone />
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="024XXXXXXX" 
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                />
              </div>
              <small className="form-hint">Enter your MTN, Telecel, or AirtelTigo number</small>
            </div>

            <div className="form-group">
              <label>Referral Code (Optional)</label>
              <div className="input-icon">
                <FaGift />
                <input 
                  type="text" 
                  name="referral_code"
                  placeholder="Enter referral code to get bonus" 
                  value={formData.referral_code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="input-icon">
                <FaLock />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  placeholder="Create a password (min. 6 characters)" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="input-icon">
                <FaLock />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="confirmPassword"
                  placeholder="Confirm your password" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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
                <input type="checkbox" required />
                <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
              </label>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? <FaSpinner className="spinning" /> : null}
              {loading ? ' Creating Account...' : ' Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
          
          <div className="auth-support">
            <p>By signing up, you agree to receive account notifications from {COMPANY.name}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}