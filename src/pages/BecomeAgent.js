// src/pages/BecomeAgent.js - Complete working version
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaMoneyBillWave, FaUsers, FaRocket, FaClock, FaTimesCircle, FaSpinner, FaStore, FaCrown, FaShieldAlt, FaMobileAlt, FaUniversity, FaArrowRight, FaUpload, FaCopy, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
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
  const [uploadedProof, setUploadedProof] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const copyReference = (reference) => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    toast.success('Reference code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
  if (!agreeTerms) {
    toast.error('Please agree to the terms and conditions');
    return;
  }

  setLoading(true);
  try {
    // Prepare JSON payload
    const payload = {
      payment_method: 'manual',
      phone: user?.phone || ''
    };
    
    console.log('📤 Sending payload:', payload);
    
    // Convert file to base64 if uploaded
    if (uploadedProof) {
      const base64 = await convertFileToBase64(uploadedProof);
      payload.proof_base64 = base64;
      payload.proof_filename = uploadedProof.name;
      console.log('📎 File attached:', uploadedProof.name);
    }

    // Make sure we're sending JSON
    const res = await api.post('/agent/apply', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response:', res.data);
    
    // ... rest of success handling
  } catch (error) {
    console.error('❌ Full error:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    console.error('❌ Error message:', error.response?.data?.error);
    
    // Show the actual error message from backend
    const errorMsg = error.response?.data?.error || 'Application failed. Please try again.';
    toast.error(errorMsg);
    
    // Show detailed error in console
    if (error.response?.data) {
      console.log('Backend error details:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    setLoading(false);
  }
};
  // If user is already an agent
  if (user?.is_agent && user?.agent_approved) {
    return (
      <motion.div className="become-agent-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
      <motion.div className="become-agent-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="container">
          <div className="application-status-card pending">
            <FaClock size={64} color="#ffc107" />
            <h2>Application Pending Review</h2>
            <p>Your {COMPANY.shortName} agent application is being reviewed by our admin team.</p>
            <div className="status-details">
              <p><strong>Reference:</strong> {applicationStatus.payment_reference}</p>
              <p><strong>Submitted:</strong> {new Date(applicationStatus.submitted_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className="badge-pending">Pending Approval</span></p>
            </div>
            <p className="info-text">You will receive an email once your application is approved.</p>
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
      <motion.div className="become-agent-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
    <motion.div className="become-agent-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
            <motion.div className="application-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <h2>Apply to Become a Roamsmart Agent</h2>
              
              <div className="fee-display">
                <span>One-Time Registration Fee</span>
                <strong>₵{COMPANY.agentFee}</strong>
              </div>

              <div className="payment-info">
                <h4 style={{ marginBottom: '10px' }}>📱 Payment Instructions:</h4>
                <p style={{ marginBottom: '10px' }}>Send <strong>₵{COMPANY.agentFee}</strong> to:</p>
                <div className="payment-details-box">
                  <div className="detail-row">
                    <span>Mobile Money:</span>
                    <strong>{COMPANY.phone}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Reference:</span>
                    <strong>AGENT_{user?.username?.toUpperCase() || 'YOURNAME'}</strong>
                  </div>
                </div>
                <p className="info-text" style={{ marginTop: '10px', fontSize: '12px' }}>
                  ⚠️ After payment, upload your transaction screenshot below
                </p>
              </div>

              <div className="form-group">
                <label>Upload Payment Proof (Screenshot)</label>
                <div className="file-upload-area">
                  <input 
                    type="file" 
                    id="proof-upload"
                    accept="image/*,.pdf"
                    onChange={(e) => setUploadedProof(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="proof-upload" className="upload-label">
                    {uploadedProof ? (
                      <><FaCheck color="#28a745" /> {uploadedProof.name}</>
                    ) : (
                      <><FaUpload /> Click to upload payment screenshot</>
                    )}
                  </label>
                </div>
                <small>Upload screenshot of your mobile money payment (PNG, JPG, or PDF)</small>
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
                {loading ? <FaSpinner className="spinning" /> : <FaArrowRight />}
                {loading ? ' Submitting Application...' : ' Submit Application'}
              </button>

              <p className="info-text">
                ✅ Application reviewed within 24 hours<br/>
                ✅ Start earning commission after approval<br/>
                ✅ Dedicated support for all agents
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}