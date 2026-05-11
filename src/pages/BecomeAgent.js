// src/pages/BecomeAgent.js - Manual payment only
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaMoneyBillWave, FaUsers, FaRocket, FaClock, FaTimesCircle, FaSpinner, FaStore, FaCrown, FaShieldAlt, FaMobileAlt, FaArrowRight, FaUpload, FaCheck } from 'react-icons/fa';
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
      // Simple payload - only what's needed
      const payload = {
        phone: user?.phone || ''
      };
      
      // Convert file to base64 if uploaded
      if (uploadedProof) {
        const base64 = await convertFileToBase64(uploadedProof);
        payload.proof_base64 = base64;
        payload.proof_filename = uploadedProof.name;
      }

      console.log('📤 Submitting application...');
      
      const res = await api.post('/agent/apply', payload);
      
      if (res.data.success) {
        const instructions = res.data.data?.instructions;
        const reference = instructions?.reference || res.data.data?.reference;
        
        Swal.fire({
          icon: 'info',
          title: 'Application Submitted!',
          html: `
            <div style="text-align: left;">
              <p>Your application has been received. Please complete payment to activate your agent account.</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p><strong>Amount:</strong> GHS ${instructions?.amount || COMPANY.agentFee}</p>
                <p><strong>Mobile Money:</strong> ${instructions?.phone || COMPANY.phone}</p>
                <p><strong>Reference:</strong> <code>${reference}</code></p>
                <button id="copyRefBtn" style="margin-top: 10px; background: #8B0000; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                  Copy Reference
                </button>
              </div>
              
              <p><strong>Steps:</strong></p>
              <ol>
                <li>Go to your mobile money wallet</li>
                <li>Send GHS ${instructions?.amount || COMPANY.agentFee} to ${instructions?.phone || COMPANY.phone}</li>
                <li>Use reference: <strong>${reference}</strong></li>
                <li>Your application will be reviewed within 24 hours</li>
              </ol>
            </div>
          `,
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'OK',
          didOpen: () => {
            const copyBtn = document.getElementById('copyRefBtn');
            if (copyBtn) {
              copyBtn.onclick = () => copyReference(reference);
            }
          }
        });
        
        await checkApplicationStatus();
        if (refreshUser) await refreshUser();
      }
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.error || 'Application failed. Please try again.');
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
              <button className="btn-primary" onClick={() => navigate('/agent')}>Go to Agent Dashboard</button>
              <button className="btn-outline" onClick={() => navigate('/store/setup')}>Set Up Your Store</button>
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
            <p>Your agent application is being reviewed by our admin team.</p>
            <div className="status-details">
              <p><strong>Reference:</strong> {applicationStatus.payment_reference}</p>
              <p><strong>Submitted:</strong> {new Date(applicationStatus.submitted_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className="badge-pending">Pending Approval</span></p>
            </div>
            <button className="btn-outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
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
            <button className="btn-outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
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
          <p>Start earning up to 25% commission - Join Ghana's fastest-growing digital service platform</p>
        </div>

        <div className="agent-grid">
          <div className="benefits-section">
            <h2>Why Become a Roamsmart Agent?</h2>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <motion.div key={index} className="benefit-card" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                  <div className="benefit-icon">{benefit.icon}</div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="application-section">
            <motion.div className="application-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <h2>Apply to Become an Agent</h2>
              
              <div className="fee-display">
                <span>Registration Fee</span>
                <strong>₵{COMPANY.agentFee}</strong>
              </div>

              <div className="payment-info">
                <h4>📱 Payment Instructions:</h4>
                <p>Send <strong>₵{COMPANY.agentFee}</strong> to:</p>
                <div className="payment-details-box">
                  <div className="detail-row"><span>Mobile Money:</span><strong>{COMPANY.phone}</strong></div>
                  <div className="detail-row"><span>Reference:</span><strong>AGENT_{user?.username?.toUpperCase() || 'YOURNAME'}</strong></div>
                </div>
              </div>

              <div className="form-group">
                <label>Upload Payment Proof</label>
                <div className="file-upload-area">
                  <input type="file" id="proof-upload" accept="image/*,.pdf" onChange={(e) => setUploadedProof(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="proof-upload" className="upload-label">
                    {uploadedProof ? <><FaCheck color="#28a745" /> {uploadedProof.name}</> : <><FaUpload /> Click to upload screenshot</>}
                  </label>
                </div>
              </div>

              <div className="terms-checkbox">
                <label className="checkbox">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a></span>
                </label>
              </div>

              <button className="btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
                {loading ? <FaSpinner className="spinning" /> : <FaArrowRight />}
                {loading ? ' Submitting...' : ' Submit Application'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}