// src/components/Verification.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, FaSpinner, FaCheckCircle, FaTimesCircle, 
  FaArrowLeft, FaMobileAlt, FaShieldAlt, FaKey, FaUserCheck 
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

/**
 * Verification Component - Handles all verification types:
 * 1. Email Verification (Registration)
 * 2. 2FA Verification (Login with 2FA enabled)
 * 3. Password Reset Verification
 * 4. Phone Verification
 */
export default function Verification({ 
  type = 'email',           // 'email', '2fa', 'password_reset', 'phone'
  email = '',               // For email verification
  phone = '',               // For phone verification
  userId = null,            // For 2FA verification
  purpose = 'registration', // 'registration', 'login', 'password_reset'
  onVerified,               // Callback on successful verification
  onCancel,                 // Callback on cancel
  redirectOnSuccess = true, // Auto redirect on success
  redirectUrl = '/dashboard' // Redirect URL after success
}) {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [verificationSent, setVerificationSent] = useState(false);

  // Get the display identifier (email or phone)
  const displayIdentifier = type === 'email' ? email : phone;

  // Get title and description based on verification type
  const getVerificationContent = () => {
    switch(type) {
      case 'email':
        return {
          title: `Verify Your Email for ${COMPANY.shortName}`,
          icon: <FaEnvelope />,
          description: `We've sent a 6-digit verification code to`,
          identifier: email,
          resendMessage: 'Didn\'t receive the email?',
          helpText: '💡 Check your spam folder if you don\'t see the email from Roamsmart.'
        };
      case '2fa':
        return {
          title: `${COMPANY.shortName} - Two-Factor Authentication`,
          icon: <FaShieldAlt />,
          description: `Enter the 6-digit code from your authenticator app`,
          identifier: '',
          resendMessage: 'Didn\'t receive the code?',
          helpText: '🔐 This code is required for enhanced security on Roamsmart.'
        };
      case 'phone':
        return {
          title: `Verify Your Phone for ${COMPANY.shortName}`,
          icon: <FaMobileAlt />,
          description: `We've sent a 6-digit verification code to`,
          identifier: phone,
          resendMessage: 'Didn\'t receive the SMS?',
          helpText: '📱 Check your network signal and try again.'
        };
      case 'password_reset':
        return {
          title: `Reset Your ${COMPANY.shortName} Password`,
          icon: <FaKey />,
          description: `Enter the 6-digit code sent to`,
          identifier: email,
          resendMessage: 'Didn\'t receive the code?',
          helpText: '🔑 This code will allow you to reset your Roamsmart password.'
        };
      default:
        return {
          title: `${COMPANY.shortName} Verification Required`,
          icon: <FaUserCheck />,
          description: 'Enter the verification code',
          identifier: '',
          resendMessage: 'Didn\'t receive the code?',
          helpText: `Please enter the code sent to your device from ${COMPANY.name}.`
        };
    }
  };

  const content = getVerificationContent();

  // Auto-focus first input on mount
  useEffect(() => {
    document.getElementById('code-input-0')?.focus();
  }, []);

  // Start countdown for resend button
  useEffect(() => {
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
      let response;
      
      // Different API endpoints based on verification type
      switch(type) {
        case 'email':
          response = await api.post('/auth/verify-code', { 
            code: finalCode,
            email: email
          });
          break;
        case '2fa':
          response = await api.post('/auth/verify-2fa', { 
            user_id: userId, 
            code: finalCode 
          });
          break;
        case 'phone':
          response = await api.post('/auth/verify-phone', { 
            phone: phone, 
            code: finalCode 
          });
          break;
        case 'password_reset':
          response = await api.post('/auth/verify-reset-code', { 
            email: email, 
            code: finalCode 
          });
          break;
        default:
          response = await api.post('/auth/verify-code', { 
            code: finalCode,
            email: email
          });
      }
      
      console.log('Verification response:', response.data);
      
      if (response.data.success) {
        // Success message based on type
        const successMessages = {
          email: `Email verified successfully on ${COMPANY.shortName}!`,
          '2fa': `${COMPANY.shortName} 2FA verification successful!`,
          phone: `Phone number verified successfully on ${COMPANY.shortName}!`,
          password_reset: 'Code verified! You can now reset your Roamsmart password.'
        };
        
        toast.success(successMessages[type] || `Verification successful on ${COMPANY.shortName}!`);
        
        if (onVerified) {
          onVerified(response.data);
        }
        
        // Handle redirects based on type and purpose
        if (redirectOnSuccess) {
          if (type === 'password_reset') {
            navigate(`/reset-password?token=${response.data.reset_token}`);
          } else if (type === '2fa') {
            if (response.data.redirect) {
              navigate(response.data.redirect);
            } else {
              navigate('/dashboard');
            }
          } else if (type === 'email' && purpose === 'registration') {
            if (response.data.token) {
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            navigate('/dashboard');
          } else {
            navigate(redirectUrl);
          }
        }
      } else {
        setError(response.data.error || 'Invalid verification code');
        toast.error(response.data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.error || 'Verification failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before requesting again`);
      return;
    }
    
    setResending(true);
    try {
      let response;
      
      // Different API endpoints for resend based on type
      switch(type) {
        case 'email':
          response = await api.post('/auth/resend-verification', { email });
          break;
        case 'phone':
          response = await api.post('/auth/resend-phone-verification', { phone });
          break;
        case 'password_reset':
          response = await api.post('/auth/reset-password', { email });
          break;
        default:
          response = await api.post('/auth/resend-verification', { email });
      }
      
      if (response.data.success) {
        const successMessages = {
          email: `Verification code resent to ${email} from Roamsmart!`,
          phone: `Verification code resent via SMS from Roamsmart!`,
          password_reset: `Password reset code resent to ${email}!`
        };
        
        toast.success(successMessages[type] || 'Code resent successfully!');
        setCountdown(60);
        
        // Reset timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clear code inputs
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-input-0')?.focus();
        setVerificationSent(true);
      } else {
        toast.error(response.data.error || 'Failed to resend code');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // src/components/Verification.js - Fixed return section
// src/components/Verification.js - Complete fixed return
return (
  <div className="verification-page">
    <div className="verification-wrapper">
      <motion.div 
        className="verification-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="verification-card">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back to Roamsmart
          </button>
          
          <div className="verification-icon" style={{ 
            background: type === '2fa' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 
                         type === 'phone' ? 'linear-gradient(135deg, #25D366, #128C7E)' :
                         'linear-gradient(135deg, #8B0000, #D2691E)' 
          }}>
            {content.icon}
          </div>
          
          <h2>{content.title}</h2>
          <p>
            {content.description}
            {content.identifier && (
              <>
                <br />
                <strong>{content.identifier}</strong>
              </>
            )}
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
            {loading ? ` Verifying on ${COMPANY.shortName}...` : ` Verify for ${COMPANY.shortName}`}
          </button>
          
          <div className="resend-section">
            <p>{content.resendMessage}</p>
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
              {content.helpText}
              {type === 'email' && ' 📧 Check your spam folder for roamsmart.shop emails.'}
              {type === '2fa' && ' 🔑 This code changes every 30 seconds.'}
              {type === 'phone' && ' 📱 Ensure your phone number is correct.'}
              <br />
              📞 Need help? Contact Roamsmart support: <strong>{COMPANY.phone}</strong>
            </small>
          </div>
          
          <div className="verification-progress">
            <div className="progress-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <small>Step 1 of 2 - Roamsmart Verification</small>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
)};