// src/components/WAECVoucher.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaCheckCircle, FaSpinner, FaDownload, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function WAECVoucher({ isAgent = false }) {
  const [vouchers, setVouchers] = useState([]);
  const [selectedType, setSelectedType] = useState('WASSCE');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState({});

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const endpoint = isAgent ? '/agent/waec/vouchers' : '/waec/vouchers';
      const res = await api.get(endpoint);
      setVouchers(res.data.data.vouchers);
      setAvailableCount(res.data.data.available_count);
    } catch (error) {
      toast.error('Failed to load WAEC vouchers from Roamsmart');
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const endpoint = isAgent ? '/agent/waec/purchase' : '/waec/purchase';
      const res = await api.post(endpoint, {
        exam_type: selectedType,
        quantity: quantity
      });
      
      if (res.data.success) {
        // Show vouchers in a nice modal
        const vouchersHtml = res.data.data.vouchers.map(v => `
          <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #8B0000;">
            <p><strong>🎓 Voucher Code:</strong> <code style="font-size: 16px;">${v.voucher_code}</code></p>
            <p><strong>📋 Serial Number:</strong> ${v.serial_number}</p>
            <p><strong>🔑 PIN:</strong> ${v.pin}</p>
          </div>
        `).join('');
        
        const commissionText = isAgent ? `<p class="text-success">💰 Your Commission: ₵${res.data.data.commission_earned || 0}</p>` : '';
        
        await Swal.fire({
          title: `Purchase Successful on ${COMPANY.shortName}!`,
          html: `
            <p>You have purchased <strong>${quantity}</strong> WAEC ${selectedType} voucher(s).</p>
            <p><strong>Total Paid:</strong> ₵${res.data.data.total_amount}</p>
            ${commissionText}
            <h3>Your Vouchers:</h3>
            ${vouchersHtml}
            <p class="text-warning">⚠️ Keep these details safe. Each voucher can only be used once on the WAEC portal.</p>
            <p class="text-muted">You can also find these vouchers in your order history on Roamsmart.</p>
          `,
          icon: 'success',
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'Done - Back to Roamsmart',
          width: '600px'
        });
        
        fetchVouchers();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Purchase failed on ${COMPANY.shortName}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedVoucher = vouchers.find(v => v.type === selectedType);
  const voucherPrice = selectedVoucher?.price || 20;

  return (
    <div className="waec-voucher-section">
      <div className="section-header">
        <h3><FaGraduationCap /> WAEC Result Checker Vouchers on Roamsmart</h3>
        <p>Purchase WAEC vouchers instantly. Each voucher costs <strong>₵{voucherPrice}</strong></p>
        {isAgent && <span className="agent-badge-small">💰 You earn commission on every sale!</span>}
      </div>
      
      <div className="voucher-types">
        {vouchers.map(v => (
          <button
            key={v.type}
            className={`voucher-type-btn ${selectedType === v.type ? 'active' : ''}`}
            onClick={() => setSelectedType(v.type)}
          >
            {v.type}
            {availableCount[v.type] !== undefined && (
              <span className="stock-badge">{availableCount[v.type]} left on Roamsmart</span>
            )}
          </button>
        ))}
      </div>
      
      <div className="quantity-selector">
        <label>Quantity:</label>
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <span>{quantity}</span>
        <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
        <span className="total-amount">Total: ₵{voucherPrice * quantity}</span>
      </div>
      
      <button 
        className="btn-primary btn-block" 
        onClick={handlePurchase}
        disabled={loading}
      >
        {loading ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
        {loading ? ` Processing on ${COMPANY.shortName}...` : ` Purchase Now - ₵${voucherPrice * quantity} on Roamsmart`}
      </button>
      
      <div className="info-text">
        <p className="text-muted">✅ Maximum 10 vouchers per purchase</p>
        <p className="text-muted">✅ Vouchers are delivered instantly to your Roamsmart account</p>
        {isAgent && <p className="text-success">✅ As an agent, you earn commission on every WAEC voucher sold!</p>}
      </div>
      
      <div className="waec-footer">
        <small>Need help with WAEC vouchers? Contact Roamsmart support: {COMPANY.phone}</small>
      </div>
    </div>
  );
}