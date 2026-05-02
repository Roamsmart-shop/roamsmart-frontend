// src/pages/TwoFactorSetup.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaQrcode, FaCheckCircle, FaGoogle, FaMobileAlt, FaDownload } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function TwoFactorSetup() {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const enable2FA = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/enable');
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setStep(2);
      toast.success('Scan the QR code with Google Authenticator');
    } catch (error) {
      toast.error('Failed to enable 2FA on Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { code: verificationCode });
      setEnabled(true);
      setStep(3);
      toast.success(`2FA enabled successfully on ${COMPANY.shortName}!`);
    } catch (error) {
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const result = await Swal.fire({
      title: 'Disable 2FA?',
      text: `Are you sure you want to disable two-factor authentication on your ${COMPANY.shortName} account?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Disable',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await api.post('/auth/2fa/disable');
      setEnabled(false);
      setStep(1);
      toast.success('2FA disabled on Roamsmart');
    } catch (error) {
      toast.error('Failed to disable 2FA');
    }
  };

  const downloadBackupCodes = () => {
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    
    const content = `ROAMSMART 2FA BACKUP CODES\n\nKeep these codes in a safe place.\nEach code can be used only once.\n\n${backupCodes.join('\n')}\n\n${COMPANY.name} - ${new Date().toLocaleDateString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamsmart_2fa_backup_codes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <motion.div 
      className="twofactor-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="twofactor-card">
          <h1><FaShieldAlt /> Two-Factor Authentication</h1>
          <p>Add an extra layer of security to your {COMPANY.name} account</p>

          {step === 1 && (
            <div className="step-content">
              <div className="benefits">
                <h3>Why enable 2FA on Roamsmart?</h3>
                <ul>
                  <li>🔐 Extra protection for your wallet balance</li>
                  <li>🛡️ Prevent unauthorized access to your account</li>
                  <li>💰 Required for withdrawals over ₵500</li>
                  <li>📱 Works with Google Authenticator or any 2FA app</li>
                </ul>
              </div>
              
              {enabled ? (
                <div className="already-enabled">
                  <FaCheckCircle size={48} color="#28a745" />
                  <h3>2FA is Enabled</h3>
                  <p>Your Roamsmart account is protected with two-factor authentication</p>
                  <button className="btn-danger" onClick={disable2FA}>
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button className="btn-primary" onClick={enable2FA} disabled={loading}>
                  {loading ? 'Setting up...' : 'Enable 2FA on Roamsmart'}
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h3><FaQrcode /> Scan QR Code</h3>
              <div className="qr-container">
                <img src={qrCode} alt="2FA QR Code for Roamsmart" />
              </div>
              <p>Or enter this code manually in Google Authenticator:</p>
              <code className="secret-code">{secret}</code>
              
              <div className="instructions">
                <h4><FaGoogle /> Setup Instructions:</h4>
                <ol>
                  <li>Download Google Authenticator from App Store or Google Play</li>
                  <li>Open the app and tap the "+" icon</li>
                  <li>Select "Scan a QR code"</li>
                  <li>Scan the QR code above</li>
                  <li>Enter the 6-digit code from the app below</li>
                </ol>
              </div>
              
              <div className="form-group">
                <label>Enter 6-digit code from Google Authenticator</label>
                <input 
                  type="text" 
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="form-control"
                  placeholder="000000"
                />
              </div>
              
              <button className="btn-primary" onClick={verify2FA} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="step-content success">
              <FaCheckCircle size={64} color="#28a745" />
              <h3>2FA Enabled on Roamsmart!</h3>
              <p>Your account is now more secure than ever.</p>
              
              <div className="backup-codes">
                <h4><FaDownload /> Backup Codes</h4>
                <p>Download your backup codes. Keep them in a safe place.</p>
                <button className="btn-outline" onClick={downloadBackupCodes}>
                  <FaDownload /> Download Backup Codes
                </button>
                <small>Each backup code can be used only once</small>
              </div>
              
              <div className="warning-note">
                <strong>⚠️ Important:</strong> If you lose access to your authenticator app, 
                you can use backup codes to log in. Keep them safe!
              </div>
              
              <button className="btn-danger" onClick={disable2FA}>
                Disable 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}