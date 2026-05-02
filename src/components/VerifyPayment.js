// src/components/VerifyPayment.js
import React, { useState } from 'react';
import { FaCheckCircle, FaSpinner, FaSearch, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function VerifyPayment({ onSuccess, onClose }) {
  const [reference, setReference] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!reference || !transactionId) {
      toast.error('Please enter reference ID and transaction ID');
      return;
    }

    setVerifying(true);
    try {
      const res = await paymentAPI.verifyPayment(reference, transactionId, senderName, senderPhone);
      if (res.data.success) {
        setVerified(true);
        toast.success(`Payment verified on ${COMPANY.shortName}! Wallet credited.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Verification failed. Contact ${COMPANY.shortName} support.`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="verify-payment">
      <div className="verify-header">
        <h3>Verify Your Roamsmart Payment</h3>
        <p>Already made a manual payment to {COMPANY.name}? Verify it here to credit your wallet.</p>
      </div>

      {verified ? (
        <div className="verify-success">
          <FaCheckCircle size={64} color="#28a745" />
          <h4>Payment Verified on Roamsmart!</h4>
          <p>Your wallet has been credited. Redirecting to Roamsmart dashboard...</p>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Reference ID *</label>
            <input 
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="e.g., 33MC"
              className="form-control"
            />
            <small>Enter the reference ID from your Roamsmart manual payment request</small>
          </div>

          <div className="form-group">
            <label>Transaction ID / Reference *</label>
            <input 
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g., MTC123456789"
              className="form-control"
            />
            <small>Found in your mobile money transaction history from your bank or momo app</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sender Name (Optional)</label>
              <input 
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your full name"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Sender Phone (Optional)</label>
              <input 
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="024XXXXXXX"
                className="form-control"
              />
            </div>
          </div>

          <button 
            onClick={handleVerify} 
            className="btn-primary btn-block"
            disabled={verifying}
          >
            {verifying ? <FaSpinner className="spinning" /> : <FaSearch />}
            {verifying ? ` Verifying on ${COMPANY.shortName}...` : ` Verify Payment on Roamsmart`}
          </button>

          <div className="verify-note">
            <p>⚠️ <strong>Note:</strong> Please ensure you have actually sent the payment before verifying. 
            False verifications may lead to account suspension on Roamsmart.</p>
            <p>📞 Need help? Contact Roamsmart support: <strong>{COMPANY.phone}</strong> or <strong>{COMPANY.email}</strong></p>
            <p><FaWhatsapp /> WhatsApp: <strong>{COMPANY.phone}</strong></p>
          </div>
        </>
      )}
    </div>
  );
}