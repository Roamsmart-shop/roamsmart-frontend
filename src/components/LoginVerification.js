// src/components/LoginVerification.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaWhatsapp, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function LoginVerification({ email, onVerified, onCancel, isRegistration = false }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    // Focus first input
    document.getElementById('code-input-0')?.focus();
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Auto-submit when all digits are filled
    if (index === 5 && value && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleVerify = async (verificationCode = null) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let res;
      if (isRegistration) {
        // For registration verification
        res = await api.post('/auth/verify-code', { code: finalCode });
      } else {
        // For login verification
        res = await api.post('/auth/verify-login-code', { 
          code: finalCode,
          email: email 
        });
      }
      
      console.log('Verification response:', res.data);
      
      if (res.data.success) {
        toast.success(`Email verified successfully on ${COMPANY.shortName}!`);
        if (onVerified) {
          onVerified(res.data);
        }
      } else {
        setError(res.data.error || 'Invalid verification code');
        toast.error(res.data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.error || 'Verification failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before requesting another code`);
      return;
    }
    
    setResending(true);
    try {
      let res;
      if (isRegistration) {
        // For registration resend
        res = await api.post('/auth/resend-registration-code', { email: email });
      } else {
        // For login resend
        res = await api.post('/auth/resend-verification', { email: email });
      }
      
      console.log('Resend response:', res.data);
      
      if (res.data.success) {
        toast.success(`New verification code sent to ${email}`);
        setCountdown(60);
        // Reset code inputs
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-input-0')?.focus();
      } else {
        toast.error(res.data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div 
      className="verification-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="verification-card">
        <button className="back-btn" onClick={onCancel}>
          <FaArrowLeft /> Back to {isRegistration ? 'Registration' : 'Login'}
        </button>
        
        <div className="verification-icon">
          <FaShieldAlt />
        </div>
        
        <h2>Verify Your Email for {COMPANY.shortName}</h2>
        <p>
          We've sent a verification code to:<br />
          <strong>{email}</strong>
        </p>
        
        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              className={`code-input ${error ? 'error' : ''}`}
              autoFocus={index === 0}
              disabled={loading}
            />
          ))}
        </div>
        
        {error && (
          <div className="verification-error">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        )}
        
        <button 
          className="btn-primary btn-block"
          onClick={() => handleVerify()}
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
          {loading ? ' Verifying...' : ' Verify & Continue to Roamsmart'}
        </button>
        
        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button 
            className="btn-link"
            onClick={handleResendCode}
            disabled={resending || countdown > 0}
          >
            {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>
        
        <div className="verification-help">
          <small>
            💡 Check your spam folder if you don't see the email from {COMPANY.name}.<br />
            📞 Need help? Contact us on WhatsApp: <strong>{COMPANY.phone}</strong>
          </small>
        </div>
      </div>
    </motion.div>
  );
}