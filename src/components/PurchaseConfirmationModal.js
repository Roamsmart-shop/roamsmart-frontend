// src/components/PurchaseConfirmationModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import './PurchaseConfirmationModal.css';
export default function PurchaseConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  details,
  loading = false 
}) {
  if (!isOpen) return null;

  const validatePhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const isValidPhone = details.phoneNumber ? validatePhone(details.phoneNumber) : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay" 
          onClick={loading ? undefined : onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="confirm-modal purchase-confirm-modal" 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
          >
            <button className="modal-close" onClick={loading ? undefined : onClose} disabled={loading}>×</button>
            
            <div className="modal-header warning">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Confirm Your Purchase on Roamsmart</h3>
            </div>

            <div className="modal-body">
              <div className="verification-warning">
                <FaCheckCircle style={{ color: '#28a745' }} />
                <strong>⚠️ Please verify your details before confirming!</strong>
              </div>

              <div className="order-summary">
                <h4>📋 Order Summary</h4>
                
                <div className={`summary-item ${!isValidPhone ? 'highlight warning' : 'highlight'}`}>
                  <span className="summary-label">📱 Phone Number:</span>
                  <span className="summary-value">{details.phoneNumber || 'Not provided'}</span>
                  {!isValidPhone && details.phoneNumber && (
                    <span className="error-badge">⚠️ Invalid number format</span>
                  )}
                </div>

                <div className="summary-item">
                  <span className="summary-label">📡 Network:</span>
                  <span className="summary-value">{details.network?.toUpperCase() || 'Not selected'}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">📦 Data Plan:</span>
                  <span className="summary-value">{details.sizeGb || 0} GB</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">🔢 Quantity:</span>
                  <span className="summary-value">{details.quantity || 1}</span>
                </div>

                <div className="summary-item total">
                  <span className="summary-label">💰 Total Amount:</span>
                  <span className="summary-value">₵{(details.amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="warning-box">
                <FaExclamationTriangle />
                <div>
                  <strong>Before you proceed:</strong>
                  <ul>
                    <li>Ensure the phone number is correct - data cannot be refunded</li>
                    <li>Data delivery may take 2-5 minutes on Roamsmart</li>
                    <li>Amount will be deducted from your wallet immediately</li>
                    <li>You will receive a confirmation SMS after delivery</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                className={`btn-primary ${loading ? 'loading' : ''}`} 
                onClick={onConfirm}
                disabled={loading || !isValidPhone}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" /> Processing...
                  </>
                ) : (
                  'Confirm & Pay on Roamsmart'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}