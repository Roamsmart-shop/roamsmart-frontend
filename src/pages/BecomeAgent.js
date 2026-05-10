// src/pages/BecomeAgent.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaMoneyBillWave, FaUsers, FaRocket, FaWhatsapp, FaEnvelope, FaClock, FaTimesCircle, FaSpinner, FaStore, FaCrown, FaShieldAlt, FaCreditCard, FaMobileAlt, FaUniversity } from 'react-icons/fa';
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
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [uploadedProof, setUploadedProof] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const agentFee = COMPANY.agentFee;

  // Payment methods configuration - ALL ACTIVATED
  const paymentOptions = [
    { 
      id: 'mobile_money', 
      name: 'MTN MoMo', 
      icon: <FaMobileAlt />, 
      color: '#FFC107',
      description: 'Instant payment via mobile money'
    },
    { 
      id: 'paystack', 
      name: 'Paystack', 
      icon: <FaCreditCard />, 
      color: '#00B3E6',
      description: 'Pay with card or bank transfer'
    },
    { 
      id: 'manual', 
      name: 'Manual Transfer', 
      icon: <FaUniversity />, 
      color: '#28a745',
      description: 'Bank transfer or mobile money'
    }
  ];

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

  // Paystack Payment Handler
  const handlePaystackPayment = async () => {
    setProcessingPayment(true);
    try {
      const amount = agentFee;
      const email = user?.email;
      const phone = phoneNumber;

      if (!email) {
        toast.error('Email is required. Please update your profile.');
        setProcessingPayment(false);
        return;
      }

      // Initialize Paystack transaction
      const response = await api.post('/payment/paystack/initialize', {
        amount: amount,
        email: email,
        phone: phone,
        metadata: {
          type: 'agent_registration',
          username: user?.username
        }
      });

      const { authorization_url, reference } = response.data.data;

      // Open Paystack popup
      const paystackPopup = window.open(authorization_url, '_blank', 'width=600,height=700');

      // Poll for payment verification
      const checkPaymentInterval = setInterval(async () => {
        try {
          const verifyResponse = await api.get(`/payment/paystack/verify/${reference}`);
          if (verifyResponse.data.data.status === 'success') {
            clearInterval(checkPaymentInterval);
            paystackPopup?.close();
            
            // Submit agent application after successful payment
            await submitAgentApplication(reference);
          }
        } catch (error) {
          console.error('Verification error:', error);
        }
      }, 5000);

      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkPaymentInterval);
        if (processingPayment) {
          setProcessingPayment(false);
        }
      }, 300000);

    } catch (error) {
      console.error('Paystack payment error:', error);
      toast.error(error.response?.data?.error || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  // MTN MoMo Payment Handler
  const handleMomoPayment = async () => {
    setProcessingPayment(true);
    try {
      if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
        toast.error('Please enter a valid phone number for MTN MoMo');
        setProcessingPayment(false);
        return;
      }

      // Initialize MoMo payment
      const response = await api.post('/payment/momo/initialize', {
        amount: agentFee,
        phone: phoneNumber,
        name: user?.username || 'Agent Applicant',
        metadata: {
          type: 'agent_registration',
          username: user?.username
        }
      });

      const { reference, paymentReference } = response.data.data;

      // Show pending dialog
      Swal.fire({
        title: 'Payment Initiated',
        text: 'Please check your phone and authorize the payment.',
        icon: 'info',
        confirmButtonColor: '#FFC107',
        allowOutsideClick: false,
        willClose: () => {
          // Verify payment after dialog closes
          verifyMomoPayment(reference);
        }
      });

    } catch (error) {
      console.error('MoMo payment error:', error);
      toast.error(error.response?.data?.error || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  const verifyMomoPayment = async (reference) => {
    setProcessingPayment(true);
    try {
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max wait
      
      const checkInterval = setInterval(async () => {
        attempts++;
        try {
          const verifyResponse = await api.get(`/payment/momo/verify/${reference}`);
          
          if (verifyResponse.data.data.status === 'success') {
            clearInterval(checkInterval);
            // Submit agent application after successful payment
            await submitAgentApplication(reference);
          } else if (verifyResponse.data.data.status === 'failed') {
            clearInterval(checkInterval);
            toast.error('Payment failed. Please try again.');
            setProcessingPayment(false);
          }
        } catch (error) {
          console.error('Verification error:', error);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          toast.warning('Payment verification timeout. Please contact support.');
          setProcessingPayment(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error('MoMo verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
      setProcessingPayment(false);
    }
  };

  // Manual Payment Handler
  const handleManualPayment = async () => {
    setProcessingPayment(true);
    try {
      if (!uploadedProof) {
        toast.error('Please upload your payment proof/screenshot');
        setProcessingPayment(false);
        return;
      }

      // Submit application with manual payment
      await submitAgentApplication(null, true);
      
    } catch (error) {
      console.error('Manual payment error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit application');
      setProcessingPayment(false);
    }
  };

  const submitAgentApplication = async (paymentReference = null, isManual = false) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', agentFee);
      formData.append('phone', phoneNumber);
      formData.append('payment_method', paymentMethod);
      formData.append('payment_reference', paymentReference || '');
      
      if (uploadedProof) {
        formData.append('proof', uploadedProof);
      }

      const res = await api.post('/agent/apply', formData);
      
      if (res.data.success) {
        toast.success(`Application submitted to ${COMPANY.name}! Admin will review within 24 hours.`);
        await checkApplicationStatus();
        if (refreshUser) await refreshUser();
        
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted!',
          html: `
            <p>Your Roamsmart agent application has been submitted successfully.</p>
            <p>We will review your application and get back to you within 24 hours.</p>
            <p><strong>Reference:</strong> ${res.data.data?.reference || paymentReference}</p>
          `,
          confirmButtonColor: '#8B0000'
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Application failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // src/pages/BecomeAgent.js - Updated handleSubmit to use JSON
const handleSubmit = async () => {
  if (!agreeTerms) {
    toast.error('Please agree to the terms and conditions');
    return;
  }

  setLoading(true);
  try {
    // Use JSON instead of FormData
    const payload = {
      payment_method: paymentMethod,
      phone: phoneNumber
    };
    
    // If there's a proof file, convert to base64
    let proofBase64 = null;
    if (uploadedProof) {
      proofBase64 = await convertFileToBase64(uploadedProof);
      payload.proof_base64 = proofBase64;
      payload.proof_filename = uploadedProof.name;
    }

    console.log('Submitting with payload:', payload);

    const res = await api.post('/agent/apply', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (res.data.success) {
      toast.success(res.data.message || `Application submitted to ${COMPANY.name}!`);
      
      // Show payment instructions
      const instructions = res.data.data?.instructions;
      if (instructions) {
        Swal.fire({
          icon: 'info',
          title: 'Payment Instructions',
          html: `
            <div style="text-align: left;">
              <p><strong>Amount to Pay:</strong> GHS ${instructions.amount}</p>
              <p><strong>Send Money To:</strong> ${instructions.phone}</p>
              <p><strong>Reference:</strong> <code>${instructions.reference}</code></p>
              <hr/>
              <p><strong>Steps to complete payment:</strong></p>
              <ol style="text-align: left;">
                <li>Go to your mobile money wallet</li>
                <li>Select "Send Money"</li>
                <li>Enter number: <strong>${instructions.phone}</strong></li>
                <li>Enter amount: <strong>GHS ${instructions.amount}</strong></li>
                <li>Enter reference: <strong>${instructions.reference}</strong></li>
                <li>Complete the transaction</li>
                <li>Keep the transaction ID for reference</li>
              </ol>
            </div>
          `,
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'I Understand'
        });
      }
      
      await checkApplicationStatus();
      if (refreshUser) await refreshUser();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Application failed. Please try again.';
    toast.error(errorMsg);
    console.error('Application error:', error.response?.data);
  } finally {
    setLoading(false);
  }
};

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

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
                  {paymentOptions.map(method => (
                    <button 
                      key={method.id}
                      className={`payment-method ${paymentMethod === method.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{ 
                        borderColor: paymentMethod === method.id ? method.color : '#ddd',
                        background: paymentMethod === method.id ? `${method.color}10` : 'white'
                      }}
                    >
                      <span style={{ color: method.color }}>{method.icon}</span>
                      {method.name}
                      <small>{method.description}</small>
                    </button>
                  ))}
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

              {paymentMethod === 'manual' && (
                <div className="form-group">
                  <label>Payment Proof (Screenshot)</label>
                  <input 
                    type="file" 
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setUploadedProof(e.target.files[0])}
                  />
                  <small>Upload screenshot of your payment</small>
                </div>
              )}

              {paymentMethod === 'manual' && (
                <div className="payment-info">
                  <p>Send <strong>₵{agentFee}</strong> to:</p>
                  <div className="payment-details">
                    <strong>Mobile Money: {COMPANY.phone}</strong>
                    <small>Reference: AGENT_{user?.username?.toUpperCase() || 'YOURNAME'}</small>
                    <small>Network: MTN, Telecel, or AirtelTigo</small>
                  </div>
                </div>
              )}

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
                disabled={loading || processingPayment}
              >
                {(loading || processingPayment) ? <FaSpinner className="spinning" /> : null}
                {(loading || processingPayment) ? ' Processing...' : ` Pay ₵${agentFee} & Apply Now`}
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