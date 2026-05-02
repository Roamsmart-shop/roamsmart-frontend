// src/components/ManualPaymentInstructions.js
import React, { useState } from 'react';
import { FaCopy, FaCheck, FaUpload, FaSpinner, FaDownload, FaWhatsapp, FaEnvelope, FaMoneyBillWave } from 'react-icons/fa';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { usePaymentDetails } from '../hooks/usePaymentDetails';

export default function ManualPaymentInstructions({ requestData, onBack, onSuccess, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Get payment details from backend
  const paymentDetails = usePaymentDetails();

  const handleCopyReference = () => {
    navigator.clipboard.writeText(requestData.reference);
    setCopied(true);
    toast.success('Reference copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async () => {
    if (!proofFile) {
      toast.error('Please select a payment screenshot');
      return;
    }

    setUploading(true);
    try {
      await paymentAPI.uploadProof(requestData.id, proofFile);
      toast.success(`Payment proof uploaded to ${paymentDetails.recipient_name}! Admin will verify shortly.`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadInstructions = () => {
    const instructions = `
${paymentDetails.recipient_name.toUpperCase()} - MANUAL PAYMENT INSTRUCTIONS

Amount: ₵${requestData.amount}
Reference ID: ${requestData.reference}
Date: ${new Date().toLocaleString()}

PAYMENT DETAILS:
Recipient: ${paymentDetails.recipient_name}
Phone: ${paymentDetails.recipient_phone}
${paymentDetails.recipient_bank ? `Bank: ${paymentDetails.recipient_bank}` : ''}

INSTRUCTIONS:
1. Go to your mobile money wallet (MTN MoMo, Telecel Cash, or AirtelTigo Cash)
2. Select "Send Money" or "Transfer"
3. Enter recipient: ${paymentDetails.recipient_phone}
4. Enter amount: ₵${requestData.amount}
5. Enter Reference: ${requestData.reference}
6. Complete the transaction
7. Take a screenshot of the success message
8. Upload the screenshot using the upload button

Your wallet will be credited after admin verification.

Need help? Contact support: support@roamsmart.shop
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

  if (paymentDetails.loading) {
    return (
      <div className="manual-instructions loading">
        <div className="spinner"></div>
        <p>Loading payment instructions...</p>
      </div>
    );
  }

  return (
    <div className="manual-instructions">
      <div className="instructions-header">
        <h3><FaMoneyBillWave /> Roamsmart Manual Payment Instructions</h3>
        <p>Please make payment manually to the recipient below to fund your wallet</p>
      </div>

      <div className="payment-details-card">
        <div className="detail-row">
          <span className="detail-label">Amount to Pay:</span>
          <span className="detail-value amount">₵{requestData.amount?.toFixed(2)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Recipient Name:</span>
          <span className="detail-value">{paymentDetails.recipient_name}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Phone Number:</span>
          <span className="detail-value">{paymentDetails.recipient_phone}</span>
        </div>
        
        {paymentDetails.recipient_bank && (
          <div className="detail-row">
            <span className="detail-label">Bank:</span>
            <span className="detail-value">{paymentDetails.recipient_bank}</span>
          </div>
        )}
        
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
          <li>Enter recipient number: <strong>{paymentDetails.recipient_phone}</strong></li>
          <li>Enter amount: <strong>₵{requestData.amount?.toFixed(2)}</strong></li>
          <li>Enter Reference: <strong>{requestData.reference}</strong></li>
          <li>Confirm and complete the transaction</li>
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
              <>
                <FaCheck /> {proofFile.name}
              </>
            ) : (
              <>
                <FaUpload /> Click to upload screenshot
              </>
            )}
          </label>
          <small>Upload screenshot of successful payment (PNG, JPG, or PDF, Max 5MB)</small>
        </div>

        <div className="instruction-actions">
          <button onClick={downloadInstructions} className="btn-outline">
            <FaDownload /> Download Instructions
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel Request
          </button>
          <button 
            onClick={handleFileUpload} 
            className="btn-primary"
            disabled={uploading || !proofFile}
          >
            {uploading ? <FaSpinner className="spinning" /> : 'I Have Paid - Submit to Roamsmart'}
          </button>
        </div>
      </div>

      <div className="support-note">
        <p>⚠️ <strong>Note:</strong> After uploading, please wait for admin verification (usually 5-30 minutes). 
        You will receive a notification once your wallet is credited.</p>
        <p>📞 Need help? Contact Roamsmart support: <strong>0557388622</strong> or <strong>support@roamsmart.shop</strong></p>
      </div>
    </div>
  );
}