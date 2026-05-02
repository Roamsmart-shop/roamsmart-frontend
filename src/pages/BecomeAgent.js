// src/pages/BecomeAgent.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaMoneyBillWave, FaUsers, FaRocket, FaWhatsapp, FaEnvelope, FaClock, FaTimesCircle, FaSpinner, FaStore, FaCrown, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop',
  agentFee: 100
};

export default function BecomeAgent() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [uploadedProof, setUploadedProof] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const agentFee = COMPANY.agentFee;

  useEffect(() => {
    checkApplicationStatus();
  }, [user]);

  const checkApplicationStatus = async () => {
    try {
      const res = await api.get('/agent/application/status');
      setApplicationStatus(res.data.data);
    } catch (error) {
      console.error('Failed to check status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const benefits = [
    { icon: <FaMoneyBillWave />, title: 'Up to 25% Commission', desc: 'Earn commission on every sale you make' },
    { icon: <FaUsers />, title: 'Wholesale Prices', desc: 'Get data at wholesale rates, sell at your price' },
    { icon: <FaStore />, title: 'Your Own Store', desc: 'Get a branded online store with your name' },
    { icon: <FaRocket />, title: 'Instant Withdrawals', desc: 'Withdraw your earnings to mobile money anytime' },
    { icon: <FaCrown />, title: 'Agent Tiers', desc: 'Bronze → Silver → Gold → Platinum with higher commissions' },
    { icon: <FaShieldAlt />, title: '24/7 Support', desc: 'Dedicated support for all Roamsmart agents' }
  ];

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', agentFee);
      formData.append('phone', phoneNumber);
      formData.append('payment_method', paymentMethod);
      if (uploadedProof) {
        formData.append('proof', uploadedProof);
      }

      const res = await api.post('/agent/apply', formData);
      
      if (res.data.success) {
        toast.success(`Application submitted to ${COMPANY.name}! Admin will review within 24 hours.`);
        await checkApplicationStatus();
        if (refreshUser) await refreshUser();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Application failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // If user is already an agent, show message
  if (user?.is_agent && user?.agent_approved) {
    return (
      <motion.div 
        className="become-agent-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container">
          <div className="already-agent-card">
            <FaCheckCircle size={64} color="#28a745" />
            <h2>You are already a {COMPANY.shortName} Agent!</h2>
            <p>You have access to wholesale prices, your own store, and commission earnings.</p>
            <div className="agent-actions">
              <button className="btn-primary" onClick={() => navigate('/agent')}>
                Go to Agent Dashboard
              </button>
              <button className="btn-outline" onClick={() => navigate('/store/setup')}>
                Set Up Your Store
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show application status if pending
  if (applicationStatus?.has_applied && applicationStatus?.status === 'pending') {
    return (
      <motion.div 
        className="become-agent-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container">
          <div className="application-status-card pending">
            <FaClock size={64} color="#ffc107" />
            <h2>Application Pending Review</h2>
            <p>Your {COMPANY.shortName} agent application is being reviewed by our admin team.</p>
            <div className="status-details">
              <p><strong>Reference:</strong> {applicationStatus.payment_reference}</p>
              <p><strong>Submitted:</strong> {new Date(applicationStatus.submitted_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className="badge-pending">Pending Approval on Roamsmart</span></p>
            </div>
            <p className="info-text">You will receive an SMS and email once your application is approved.</p>
            <button className="btn-outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show rejection message if rejected
  if (applicationStatus?.has_applied && applicationStatus?.status === 'rejected') {
    return (
      <motion.div 
        className="become-agent-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="container">
          <div className="application-status-card rejected">
            <FaTimesCircle size={64} color="#dc3545" />
            <h2>Application Not Approved</h2>
            <p>{applicationStatus.rejection_reason || 'Your application was not approved at this time.'}</p>
            <p className="info-text">You can reapply after 30 days. Contact {COMPANY.email} for more information.</p>
            <button className="btn-outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show application form
  return (
    <motion.div 
      className="become-agent-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="agent-header">
          <h1>Become a {COMPANY.shortName} Agent</h1>
          <p>Start earning up to 25% commission on every sale - Join Ghana's fastest-growing digital service platform</p>
        </div>

        <div className="agent-grid">
          <div className="benefits-section">
            <h2>Why Become a Roamsmart Agent?</h2>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="benefit-card"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="benefit-icon">{benefit.icon}</div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="testimonial">
              <div className="testimonial-content">
                <p>"I've made over GHS 5,000 in my first month as a Roamsmart agent! The platform is reliable and support is excellent."</p>
                <div className="testimonial-author">
                  <strong>Kwame Asare</strong>
                  <span>Gold Agent - Roamsmart</span>
                </div>
              </div>
            </div>

            <div className="commission-info">
              <h3>Commission Tiers on Roamsmart</h3>
              <div className="tiers-list">
                <div className="tier bronze"><span>Bronze</span><span>0 - ₵500</span><span>10%</span></div>
                <div className="tier silver"><span>Silver</span><span>₵500 - ₵2,000</span><span>15%</span></div>
                <div className="tier gold"><span>Gold</span><span>₵2,000 - ₵10,000</span><span>20%</span></div>
                <div className="tier platinum"><span>Platinum</span><span>₵10,000+</span><span>25%</span></div>
              </div>
            </div>
          </div>

          <div className="application-section">
            <motion.div 
              className="application-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2>Apply to Become a Roamsmart Agent</h2>
              <div className="fee-display">
                <span>One-Time Registration Fee</span>
                <strong>₵{agentFee}</strong>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-methods">
                  <button 
                    className={`payment-method ${paymentMethod === 'mobile_money' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('mobile_money')}
                  >
                    <FaWhatsapp /> Mobile Money
                  </button>
                  <button 
                    className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                    disabled
                  >
                    <FaEnvelope /> Card (Coming Soon)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Your Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control"
                  placeholder="024XXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <small>We'll use this for your agent account and withdrawals</small>
              </div>

              <div className="form-group">
                <label>Payment Proof (Screenshot)</label>
                <input 
                  type="file" 
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setUploadedProof(e.target.files[0])}
                />
                <small>Upload screenshot of your mobile money payment</small>
              </div>

              <div className="payment-info">
                <p>Send <strong>₵{agentFee}</strong> to:</p>
                <div className="payment-details">
                  <strong>Mobile Money: {COMPANY.phone}</strong>
                  <small>Reference: AGENT_{user?.username?.toUpperCase() || 'YOURNAME'}</small>
                  <small>Network: MTN, Telecel, or AirtelTigo</small>
                </div>
              </div>

              <div className="terms-checkbox">
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
                    <a href="/privacy" target="_blank"> Privacy Policy</a> of {COMPANY.name}
                  </span>
                </label>
              </div>

              <button 
                className="btn-primary btn-block"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinning" /> : null}
                {loading ? ' Submitting to Roamsmart...' : ` Pay ₵${agentFee} & Apply Now`}
              </button>

              <p className="info-text">
                ✅ Your application will be reviewed within 24 hours<br/>
                ✅ Once approved, you'll get access to wholesale prices and your own store<br/>
                ✅ Start earning commission immediately after approval
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}