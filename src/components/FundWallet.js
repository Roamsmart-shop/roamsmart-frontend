// src/components/FundWallet.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMobileAlt, FaCreditCard, FaUniversity, FaCopy, FaCheck, FaUpload, FaSpinner, FaDownload, FaWallet } from 'react-icons/fa';
import { paymentAPI } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  recipientPhone: '0557388622',
  recipientName: 'Roamsmart'
};

export default function FundWallet({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('manual');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const { refreshAll } = useWallet();

  const paymentMethods = [
    { 
      id: 'manual', 
      name: 'Manual Top-up', 
      fee: 'No fees', 
      min: 10, 
      max: 100000, 
      icon: <FaUniversity />,
      description: 'Admin approval required',
      time: '5-30 minutes',
      color: '#8B0000'
    },
    { 
      id: 'momo', 
      name: 'Mobile Money', 
      fee: '1% + ₵0.50', 
      min: 10, 
      max: 10000, 
      icon: <FaMobileAlt />,
      description: 'Instant top-up',
      time: 'Coming Soon',
      color: '#25D366',
      comingSoon: true
    },
    { 
      id: 'paystack', 
      name: 'Paystack', 
      fee: '2.5% + ₵0.50', 
      min: 1, 
      max: 100000, 
      icon: <FaCreditCard />,
      description: 'Card & Mobile Money',
      time: 'Coming Soon',
      color: '#00B3E6',
      comingSoon: true
    }
  ];

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleMethodSelect = (methodId) => {
    if (paymentMethods.find(m => m.id === methodId)?.comingSoon) {
      Swal.fire({
        icon: 'info',
        title: 'Coming Soon to Roamsmart!',
        text: 'This payment method will be available soon.',
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    setSelectedMethod(methodId);
  };

  const handleAmountSubmit = async () => {
    const amountNum = parseFloat(amount);
    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    if (!amount || isNaN(amountNum)) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amountNum < method.min) {
      toast.error(`Minimum amount is ₵${method.min}`);
      return;
    }
    if (amountNum > method.max) {
      toast.error(`Maximum amount is ₵${method.max.toLocaleString()}`);
      return;
    }

    if (selectedMethod === 'manual') {
      setLoading(true);
      try {
        const res = await paymentAPI.createManualRequest(amountNum, phoneNumber);
        setRequestData(res.data.data);
        setStep(3);
        toast.success(`Manual payment request created on ${COMPANY.shortName}!`);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to create request');
      } finally {
        setLoading(false);
      }
    } else if (selectedMethod === 'momo') {
      toast.info('MTN MoMo coming soon to Roamsmart!');
    } else if (selectedMethod === 'paystack') {
      toast.info('Paystack coming soon to Roamsmart!');
    }
  };

  const handleCopyReference = () => {
    if (requestData?.reference) {
      navigator.clipboard.writeText(requestData.reference);
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = async () => {
    if (!proofFile) {
      toast.error('Please select a payment screenshot');
      return;
    }

    setUploadingProof(true);
    try {
      await paymentAPI.uploadProof(requestData.id, proofFile);
      toast.success(`Payment proof uploaded to ${COMPANY.shortName}! Admin will verify shortly.`);
      resetFundModal();
      onClose();
      refreshAll();
      
      Swal.fire({
        icon: 'success',
        title: 'Proof Uploaded to Roamsmart!',
        html: 'Your payment proof has been submitted. <br/> Admin will verify and credit your wallet within 5-30 minutes.',
        confirmButtonColor: '#8B0000'
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const downloadInstructions = () => {
    if (!requestData) return;
    
    const instructions = `
${COMPANY.name.toUpperCase()} - MANUAL PAYMENT INSTRUCTIONS

Amount: ₵${requestData.amount}
Reference ID: ${requestData.reference}
Date: ${new Date().toLocaleString()}

PAYMENT DETAILS:
Recipient: ${COMPANY.recipientName}
Phone: ${COMPANY.recipientPhone}

INSTRUCTIONS:
1. Go to your mobile money wallet (MTN MoMo, Telecel Cash, or AirtelTigo Cash)
2. Select "Send Money" or "Transfer"
3. Enter recipient: ${COMPANY.recipientPhone}
4. Enter amount: ₵${requestData.amount}
5. Enter Reference: ${requestData.reference}
6. Complete the transaction
7. Take a screenshot of the success message
8. Upload the screenshot using the upload button

Your ${COMPANY.shortName} wallet will be credited after admin verification.

Need help? Contact: ${COMPANY.email} or ${COMPANY.phone}
    `;
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamsmart_payment_instructions_${requestData.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Instructions downloaded');
  };

  const resetFundModal = () => {
    setStep(1);
    setAmount('');
    setSelectedMethod('manual');
    setRequestData(null);
    setProofFile(null);
    setCopied(false);
    setPhoneNumber('');
  };

  const handleClose = () => {
    resetFundModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="modal-overlay" 
      onClick={handleClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }} 
        animate={{ scale: 1, y: 0 }} 
        className="modal-content fund-wallet-modal" 
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>×</button>
        
        {/* Step 1: Select Payment Method */}
        {step === 1 && (
          <div className="fund-step">
            <h3><FaWallet /> Fund Your Roamsmart Wallet</h3>
            <p>Select your preferred payment method</p>
            
            <div className="methods-grid">
              {paymentMethods.map(method => (
                <div 
                  key={method.id}
                  className={`method-card ${selectedMethod === method.id ? 'active' : ''} ${method.comingSoon ? 'coming-soon' : ''}`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="method-icon" style={{ color: method.color }}>{method.icon}</div>
                  <div className="method-name">{method.name}</div>
                  <div className="method-fee">{method.fee}</div>
                  <div className="method-limit">Limit: ₵{method.min} - ₵{method.max.toLocaleString()}</div>
                  <div className="method-time">⏱️ {method.time}</div>
                  {method.comingSoon && <span className="coming-soon-badge">Coming Soon</span>}
                </div>
              ))}
            </div>
            
            <button className="btn-primary btn-block" onClick={() => setStep(2)}>
              Continue on Roamsmart
            </button>
          </div>
        )}
        
        {/* Step 2: Enter Amount */}
        {step === 2 && (
          <div className="fund-step">
            <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
            <h3>Enter Amount to Fund</h3>
            
            <div className="form-group">
              <label>Amount (GHS)</label>
              <input 
                type="number" 
                className="form-control amount-input" 
                placeholder="Enter amount" 
                min={paymentMethods.find(m => m.id === selectedMethod)?.min || 10}
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
              <small>Min: ₵{paymentMethods.find(m => m.id === selectedMethod)?.min} · Max: ₵{paymentMethods.find(m => m.id === selectedMethod)?.max.toLocaleString()}</small>
            </div>
            
            {selectedMethod === 'manual' && (
              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="024XXXXXXX" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
                <small>For payment confirmation SMS from Roamsmart</small>
              </div>
            )}
            
            <div className="quick-amounts">
              {quickAmounts.map(qAmount => (
                <button 
                  key={qAmount} 
                  className="quick-amount" 
                  onClick={() => setAmount(qAmount.toString())}
                >
                  ₵{qAmount}
                </button>
              ))}
            </div>
            
            <button 
              className="btn-primary btn-block" 
              onClick={handleAmountSubmit}
              disabled={loading}
            >
              {loading ? <FaSpinner className="spinning" /> : 'Proceed to Payment'}
            </button>
          </div>
        )}
        
        {/* Step 3: Manual Payment Instructions */}
        {step === 3 && requestData && (
          <div className="fund-step instructions-step">
            <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
            <h3>Roamsmart Payment Instructions</h3>
            
            <div className="payment-details-card">
              <div className="detail-row">
                <span className="detail-label">Amount to Pay:</span>
                <span className="detail-value amount">₵{requestData.amount?.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Recipient Name:</span>
                <span className="detail-value">{COMPANY.recipientName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone Number:</span>
                <span className="detail-value">{COMPANY.recipientPhone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reference ID:</span>
                <div className="reference-box">
                  <code>{requestData.reference}</code>
                  <button onClick={handleCopyReference} className="copy-btn">
                    {copied ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="how-it-works">
              <h4>📋 How to pay on Roamsmart:</h4>
              <ol>
                <li>Go to your mobile money wallet (MTN MoMo, Telecel Cash, or AirtelTigo Cash)</li>
                <li>Select "Send Money" or "Transfer"</li>
                <li>Enter recipient: <strong>{COMPANY.recipientPhone}</strong></li>
                <li>Enter amount: <strong>₵{requestData.amount?.toFixed(2)}</strong></li>
                <li>Enter Reference: <strong>{requestData.reference}</strong></li>
                <li>Complete the transaction</li>
                <li>Take a screenshot of the success message</li>
                <li>Upload the screenshot below</li>
              </ol>
            </div>
            
            <div className="upload-section">
              <h4>Upload Payment Proof to Roamsmart</h4>
              <div className="upload-area">
                <input 
                  type="file" 
                  id="proof-upload"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <label htmlFor="proof-upload" className="upload-label">
                  {proofFile ? (
                    <><FaCheck /> {proofFile.name}</>
                  ) : (
                    <><FaUpload /> Click to upload screenshot</>
                  )}
                </label>
                <small>Upload PNG, JPG, or PDF (Max 5MB)</small>
              </div>
              
              <div className="instruction-actions">
                <button onClick={downloadInstructions} className="btn-outline">
                  <FaDownload /> Download Instructions
                </button>
                <button 
                  onClick={handleFileUpload} 
                  className="btn-primary"
                  disabled={uploadingProof || !proofFile}
                >
                  {uploadingProof ? <FaSpinner className="spinning" /> : 'I Have Paid - Submit to Roamsmart'}
                </button>
              </div>
            </div>
            
            <div className="support-note">
              <p>⚠️ <strong>Note:</strong> After uploading, please wait for admin verification (usually 5-30 minutes).</p>
              <p>📞 Need help? Contact Roamsmart support: <strong>{COMPANY.phone}</strong></p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}