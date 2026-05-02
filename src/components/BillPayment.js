// src/components/BillPayment.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBolt, FaTint, FaTv, FaGlobe, FaGraduationCap, FaCheckCircle, FaSpinner, FaSearch, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
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

export default function BillPayment({ isAgent = false }) {
  const [billers, setBillers] = useState([]);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [validating, setValidating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [validatedAccount, setValidatedAccount] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const billerIcons = {
    electricity: <FaBolt />,
    water: <FaTint />,
    dstv: <FaTv />,
    gotv: <FaTv />,
    internet: <FaGlobe />,
    school_fees: <FaGraduationCap />
  };

  useEffect(() => {
    fetchBillers();
    fetchPaymentHistory();
  }, []);

  const fetchBillers = async () => {
    try {
      const endpoint = isAgent ? '/agent/bills/billers' : '/bills/billers';
      const res = await api.get(endpoint);
      setBillers(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load billers from Roamsmart');
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const endpoint = isAgent ? '/agent/bills/history' : '/bills/history';
      const res = await api.get(endpoint);
      setPaymentHistory(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bill payment history');
    }
  };

  const validateAccount = async () => {
    if (!selectedBiller || !accountNumber) {
      toast.error('Please select a biller and enter account number');
      return;
    }

    setValidating(true);
    try {
      const endpoint = isAgent ? '/agent/bills/validate' : '/bills/validate';
      const res = await api.post(endpoint, {
        biller_code: selectedBiller.code,
        account_number: accountNumber
      });
      
      if (res.data.success) {
        setValidatedAccount(res.data.data);
        setCustomerName(res.data.data.customer_name || '');
        setCustomerEmail(res.data.data.customer_email || '');
        setCustomerPhone(res.data.data.customer_phone || '');
        if (res.data.data.amount_due) {
          setAmount(res.data.data.amount_due);
        }
        toast.success(`Account validated on ${COMPANY.shortName}`);
      } else {
        toast.error(res.data.error || 'Invalid account number');
      }
    } catch (error) {
      toast.error('Validation failed. Please check the account number.');
    } finally {
      setValidating(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedBiller || !accountNumber || !amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 1) {
      toast.error('Amount must be at least ₵1');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Bill Payment',
      html: `You are about to pay <strong>₵${amountNum.toFixed(2)}</strong> to <strong>${selectedBiller.name}</strong> for account <strong>${accountNumber}</strong>.<br/><br/>This amount will be deducted from your ${COMPANY.shortName} wallet.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Yes, Pay Now',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setPaying(true);
    try {
      const endpoint = isAgent ? '/agent/bills/pay' : '/bills/pay';
      const res = await api.post(endpoint, {
        biller_code: selectedBiller.code,
        account_number: accountNumber,
        amount: amountNum,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      });
      
      if (res.data.success) {
        toast.success(`Bill paid successfully on ${COMPANY.shortName}!`);
        // Reset form
        setAccountNumber('');
        setAmount('');
        setValidatedAccount(null);
        setSelectedBiller(null);
        fetchPaymentHistory();
        
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          html: `Your payment of <strong>₵${amountNum.toFixed(2)}</strong> to <strong>${selectedBiller.name}</strong> has been processed.<br/>Transaction Reference: ${res.data.reference}`,
          confirmButtonColor: '#8B0000'
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="badge-success">Completed</span>;
      case 'pending': return <span className="badge-warning">Pending</span>;
      case 'failed': return <span className="badge-danger">Failed</span>;
      default: return <span className="badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="bill-payment-section">
      <div className="section-header">
        <h3><FaMoneyBillWave /> Pay Bills on Roamsmart</h3>
        <p>Pay electricity, water, TV subscriptions, and more instantly</p>
        {isAgent && <span className="agent-badge">Agent - Earn Commission</span>}
      </div>
      
      <div className="billers-grid">
        {billers.map(biller => (
          <button
            key={biller.code}
            className={`biller-card ${selectedBiller?.code === biller.code ? 'active' : ''}`}
            onClick={() => {
              setSelectedBiller(biller);
              setValidatedAccount(null);
              setAccountNumber('');
              setAmount('');
            }}
          >
            <div className="biller-icon">{billerIcons[biller.code] || <FaBolt />}</div>
            <div className="biller-name">{biller.name}</div>
          </button>
        ))}
      </div>
      
      {selectedBiller && (
        <motion.div 
          className="payment-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="form-group">
            <label>Account Number / Meter Number</label>
            <div className="input-with-button">
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={`Enter your ${selectedBiller.name} account number`}
                className="form-control"
              />
              <button 
                className="btn-outline" 
                onClick={validateAccount}
                disabled={validating}
              >
                {validating ? <FaSpinner className="spinning" /> : <FaSearch />}
                Validate
              </button>
            </div>
          </div>
          
          {validatedAccount && (
            <motion.div className="validated-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h4><FaCheckCircle /> Account Information</h4>
              <p><strong>Customer Name:</strong> {validatedAccount.customer_name}</p>
              {validatedAccount.customer_email && <p><strong>Email:</strong> {validatedAccount.customer_email}</p>}
              {validatedAccount.customer_phone && <p><strong>Phone:</strong> {validatedAccount.customer_phone}</p>}
              {validatedAccount.address && <p><strong>Address:</strong> {validatedAccount.address}</p>}
            </motion.div>
          )}
          
          <div className="form-group">
            <label>Amount (GHS)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to pay"
              className="form-control"
              min="1"
              step="1"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name (Optional)</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Customer Phone (Optional)</label>
              <input 
                type="tel" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="024XXXXXXX"
                className="form-control"
              />
            </div>
          </div>
          
          <button 
            className="btn-primary btn-block" 
            onClick={handlePayment}
            disabled={paying || !amount}
          >
            {paying ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
            {paying ? ` Processing on ${COMPANY.shortName}...` : ` Pay ₵${amount || '0'} on Roamsmart`}
          </button>
        </motion.div>
      )}
      
      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="payment-history">
          <div className="history-header" onClick={() => setShowHistory(!showHistory)}>
            <FaHistory />
            <h4>Recent Bill Payments on Roamsmart</h4>
            <span className={`toggle-icon ${showHistory ? 'open' : ''}`}>▼</span>
          </div>
          
          {showHistory && (
            <motion.div 
              className="history-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Biller</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.slice(0, 5).map(payment => (
                      <tr key={payment.id}>
                        <td className="date">{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td>{payment.biller_name}</td>
                        <td className="account">{payment.account_number}</td>
                        <td className="amount">₵{payment.amount}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
      
      <div className="bill-payment-footer">
        <small>✅ Instant processing • 🔒 Secure payments • Powered by {COMPANY.name}</small>
      </div>
    </div>
  );
}