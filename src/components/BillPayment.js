// src/components/BillPayment.js - Hubtel Bill Payment Integration with Recurring Bills
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBolt, FaTint, FaTv, FaCheckCircle, FaSpinner, FaSearch, 
  FaHistory, FaMoneyBillWave, FaWater, FaCalendarAlt, FaBell, 
  FaPlus, FaTrash, FaClock, FaToggleOn, FaToggleOff 
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import '../styles/components/billPayment.css';

// Hubtel Logo SVG
const HubtelLogo = () => (
  <svg width="80" height="24" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="30" rx="4" fill="#1a1a2e"/>
    <text x="10" y="20" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="Arial">HUBTEL</text>
    <text x="65" y="20" fill="#f39c12" fontSize="9" fontFamily="Arial">Powered by</text>
  </svg>
);

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

// Hubtel Billers Configuration
const HUBTEL_BILLERS = [
  { code: 'ECG', name: 'ECG Electricity', icon: <FaBolt />, color: '#f39c12', type: 'electricity', placeholder: 'Enter meter number (e.g., 1234567890)' },
  { code: 'GWCL', name: 'Ghana Water', icon: <FaWater />, color: '#3498db', type: 'water', placeholder: 'Enter customer account number' },
  { code: 'DSTV', name: 'DSTV', icon: <FaTv />, color: '#e74c3c', type: 'tv', placeholder: 'Enter smartcard number' },
  { code: 'GOTV', name: 'GoTV', icon: <FaTv />, color: '#2ecc71', type: 'tv', placeholder: 'Enter IUC number' },
  { code: 'STARTIMES', name: 'StarTimes', icon: <FaTv />, color: '#9b59b6', type: 'tv', placeholder: 'Enter smartcard number' }
];

// Recurring frequencies
const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Every 2 Weeks', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 }
];

export default function BillPayment({ isAgent = false }) {
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
  const [billDetails, setBillDetails] = useState(null);
  
  // Recurring bill states
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringBills, setRecurringBills] = useState([]);
  const [newRecurring, setNewRecurring] = useState({
    enabled: false,
    frequency: 'monthly',
    autoPay: true,
    maxAmount: 0
  });
  const [addingRecurring, setAddingRecurring] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
    fetchRecurringBills();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const endpoint = isAgent ? '/agent/bills/history' : '/user/bills/history';
      const res = await api.get(endpoint);
      setPaymentHistory(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bill payment history');
    }
  };

  const fetchRecurringBills = async () => {
    try {
      const endpoint = isAgent ? '/agent/bills/recurring' : '/user/bills/recurring';
      const res = await api.get(endpoint);
      setRecurringBills(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recurring bills');
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
        setBillDetails(res.data.data);
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
      console.error('Validation error:', error);
      toast.error(error.response?.data?.error || 'Validation failed. Please check the account number.');
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
      html: `
        <div style="text-align: left;">
          <p><strong>Biller:</strong> ${selectedBiller.name}</p>
          <p><strong>Account Number:</strong> ${accountNumber}</p>
          <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
          <p><strong>Amount:</strong> <strong style="color: #8B0000;">₵${amountNum.toFixed(2)}</strong></p>
          <p>This amount will be deducted from your ${COMPANY.shortName} wallet.</p>
        </div>
      `,
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
        
        // Ask if user wants to set up recurring payment
        const setupRecurring = await Swal.fire({
          title: 'Set Up Recurring Payment?',
          html: `
            <p>Would you like to set up automatic payments for this bill?</p>
            <p><small>You can manage this anytime in the recurring bills section.</small></p>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Set Up',
          cancelButtonText: 'Not Now'
        });
        
        if (setupRecurring.isConfirmed) {
          setSelectedBiller(selectedBiller);
          setAccountNumber(accountNumber);
          setNewRecurring({ ...newRecurring, enabled: true });
          setShowRecurring(true);
          setAddingRecurring(true);
        }
        
        // Reset form
        setAccountNumber('');
        setAmount('');
        setValidatedAccount(null);
        setBillDetails(null);
        setSelectedBiller(null);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        
        fetchPaymentHistory();
        
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          html: `
            <p>Your payment of <strong>₵${amountNum.toFixed(2)}</strong> to <strong>${selectedBiller.name}</strong> has been processed.</p>
            <p>Transaction Reference: ${res.data.data?.reference || res.data.reference}</p>
          `,
          confirmButtonColor: '#8B0000'
        });
      } else {
        toast.error(res.data.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const addRecurringBill = async () => {
    if (!selectedBiller || !accountNumber) {
      toast.error('Please select a biller and enter account number');
      return;
    }

    setAddingRecurring(true);
    try {
      const endpoint = isAgent ? '/agent/bills/recurring/add' : '/user/bills/recurring/add';
      const res = await api.post(endpoint, {
        biller_code: selectedBiller.code,
        biller_name: selectedBiller.name,
        account_number: accountNumber,
        customer_name: customerName,
        frequency: newRecurring.frequency,
        auto_pay: newRecurring.autoPay,
        max_amount: newRecurring.maxAmount || parseFloat(amount) || 0
      });
      
      if (res.data.success) {
        toast.success('Recurring bill set up successfully!');
        fetchRecurringBills();
        setShowRecurring(false);
        setAddingRecurring(false);
        setNewRecurring({
          enabled: false,
          frequency: 'monthly',
          autoPay: true,
          maxAmount: 0
        });
      } else {
        toast.error(res.data.error || 'Failed to set up recurring bill');
      }
    } catch (error) {
      console.error('Add recurring bill error:', error);
      toast.error(error.response?.data?.error || 'Failed to set up recurring bill');
    } finally {
      setAddingRecurring(false);
    }
  };

  const removeRecurringBill = async (billId) => {
    const result = await Swal.fire({
      title: 'Remove Recurring Bill?',
      text: 'This will cancel automatic payments for this bill.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const endpoint = isAgent ? '/agent/bills/recurring/remove' : '/user/bills/recurring/remove';
        await api.delete(`${endpoint}/${billId}`);
        toast.success('Recurring bill removed');
        fetchRecurringBills();
      } catch (error) {
        toast.error('Failed to remove recurring bill');
      }
    }
  };

  const toggleRecurringStatus = async (billId, currentStatus) => {
    try {
      const endpoint = isAgent ? '/agent/bills/recurring/toggle' : '/user/bills/recurring/toggle';
      await api.put(`${endpoint}/${billId}`, { enabled: !currentStatus });
      toast.success(`Recurring bill ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchRecurringBills();
    } catch (error) {
      toast.error('Failed to update recurring bill');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
      case 'success':
        return <span className="badge-success"><FaCheckCircle /> Completed</span>;
      case 'pending':
        return <span className="badge-warning"><FaSpinner className="spinning" /> Pending</span>;
      case 'failed':
        return <span className="badge-danger">Failed</span>;
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  const getBillerIcon = (billerCode) => {
    const biller = HUBTEL_BILLERS.find(b => b.code === billerCode);
    return biller?.icon || <FaBolt />;
  };

  const getBillerName = (billerCode) => {
    const biller = HUBTEL_BILLERS.find(b => b.code === billerCode);
    return biller?.name || billerCode;
  };

  const getFrequencyLabel = (frequency) => {
    const freq = RECURRING_FREQUENCIES.find(f => f.value === frequency);
    return freq?.label || frequency;
  };

  return (
    <div className="bill-payment-section">
      {/* Hubtel Powered By Badge */}
      <div className="hubtel-badge">
        <HubtelLogo />
        <span className="hubtel-text">Bill Payment Service</span>
      </div>

      <div className="section-header">
        <h3><FaMoneyBillWave /> Pay Bills on Roamsmart</h3>
        <p>Pay electricity, water, TV subscriptions, and more instantly via Hubtel</p>
      </div>
      
      {/* Billers Grid */}
      <div className="billers-grid">
        {HUBTEL_BILLERS.map(biller => (
          <button
            key={biller.code}
            className={`biller-card ${selectedBiller?.code === biller.code ? 'active' : ''}`}
            onClick={() => {
              setSelectedBiller(biller);
              setValidatedAccount(null);
              setBillDetails(null);
              setAccountNumber('');
              setAmount('');
              setCustomerName('');
            }}
          >
            <div className="biller-icon" style={{ color: biller.color }}>
              {biller.icon}
            </div>
            <div className="biller-name">{biller.name}</div>
          </button>
        ))}
      </div>
      
      {/* Payment Form */}
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
                placeholder={selectedBiller.placeholder}
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
          
          {/* Validated Account Info */}
          {validatedAccount && (
            <motion.div className="validated-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h4><FaCheckCircle /> Account Information</h4>
              <p><strong>Customer Name:</strong> {validatedAccount.customer_name || 'N/A'}</p>
              {validatedAccount.customer_email && <p><strong>Email:</strong> {validatedAccount.customer_email}</p>}
              {validatedAccount.customer_phone && <p><strong>Phone:</strong> {validatedAccount.customer_phone}</p>}
              {validatedAccount.amount_due && (
                <p><strong>Amount Due:</strong> <strong style={{ color: '#8B0000' }}>₵{validatedAccount.amount_due.toFixed(2)}</strong></p>
              )}
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
            {billDetails?.minimum_amount && (
              <small className="text-muted">Minimum amount: ₵{billDetails.minimum_amount}</small>
            )}
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
            disabled={paying || !amount || !accountNumber}
          >
            {paying ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
            {paying ? ` Processing on ${COMPANY.shortName}...` : ` Pay ₵${amount || '0'} via Hubtel`}
          </button>
          
          <div className="payment-note">
            <small>🔒 Secure payments via Hubtel • Instant processing • 24/7 support</small>
          </div>
        </motion.div>
      )}
      
      {/* ========== RECURRING BILLS SECTION ========== */}
      <div className="recurring-bills-section">
        <div className="recurring-header" onClick={() => setShowRecurring(!showRecurring)}>
          <FaCalendarAlt />
          <h4>Recurring Bills</h4>
          <span className={`toggle-icon ${showRecurring ? 'open' : ''}`}>▼</span>
        </div>
        
        {showRecurring && (
          <motion.div 
            className="recurring-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Add New Recurring Bill */}
            <div className="add-recurring">
              <button 
                className="btn-outline btn-sm" 
                onClick={() => setAddingRecurring(!addingRecurring)}
              >
                <FaPlus /> Add Recurring Bill
              </button>
              
              {addingRecurring && (
                <motion.div className="recurring-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="form-group">
                    <label>Select Biller</label>
                    <div className="billers-mini-grid">
                      {HUBTEL_BILLERS.map(biller => (
                        <button
                          key={biller.code}
                          className={`mini-biller-btn ${selectedBiller?.code === biller.code ? 'active' : ''}`}
                          onClick={() => setSelectedBiller(biller)}
                        >
                          {biller.icon} {biller.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Account Number</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Frequency</label>
                      <select 
                        value={newRecurring.frequency}
                        onChange={(e) => setNewRecurring({...newRecurring, frequency: e.target.value})}
                        className="form-control"
                      >
                        {RECURRING_FREQUENCIES.map(freq => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Max Amount (GHS)</label>
                      <input 
                        type="number" 
                        value={newRecurring.maxAmount}
                        onChange={(e) => setNewRecurring({...newRecurring, maxAmount: parseFloat(e.target.value)})}
                        placeholder="Optional limit"
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={newRecurring.autoPay}
                        onChange={(e) => setNewRecurring({...newRecurring, autoPay: e.target.checked})}
                      />
                      Automatically pay when due
                    </label>
                  </div>
                  
                  <button 
                    className="btn-primary btn-block" 
                    onClick={addRecurringBill}
                    disabled={!selectedBiller || !accountNumber || addingRecurring}
                  >
                    {addingRecurring ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
                    {addingRecurring ? ' Setting Up...' : ' Set Up Recurring Bill'}
                  </button>
                </motion.div>
              )}
            </div>
            
            {/* Existing Recurring Bills List */}
            {recurringBills.length > 0 && (
              <div className="recurring-list">
                <h5>Your Recurring Bills</h5>
                {recurringBills.map(bill => (
                  <div key={bill.id} className="recurring-item">
                    <div className="recurring-info">
                      <div className="recurring-biller">
                        {getBillerIcon(bill.biller_code)} {bill.biller_name}
                      </div>
                      <div className="recurring-details">
                        <span>Account: {bill.account_number}</span>
                        <span>Frequency: {getFrequencyLabel(bill.frequency)}</span>
                        {bill.max_amount > 0 && <span>Max: ₵{bill.max_amount}</span>}
                      </div>
                    </div>
                    <div className="recurring-actions">
                      <button 
                        className="toggle-btn"
                        onClick={() => toggleRecurringStatus(bill.id, bill.enabled)}
                        title={bill.enabled ? 'Disable' : 'Enable'}
                      >
                        {bill.enabled ? <FaToggleOn style={{ color: '#28a745', fontSize: '24px' }} /> : <FaToggleOff style={{ color: '#ccc', fontSize: '24px' }} />}
                      </button>
                      <button 
                        className="remove-btn"
                        onClick={() => removeRecurringBill(bill.id)}
                        title="Remove"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {recurringBills.length === 0 && !addingRecurring && (
              <div className="no-recurring">
                <FaCalendarAlt />
                <p>No recurring bills set up yet.</p>
                <small>Add a bill to automate your payments</small>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
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
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {getBillerIcon(payment.biller_code)} {getBillerName(payment.biller_code)}
                          </span>
                        </td>
                        <td className="account">{payment.account_number}</td>
                        <td className="amount">₵{payment.amount?.toFixed(2) || payment.amount}</td>
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
        <small>🔒 Secure payments via Hubtel • Instant processing • 24/7 support</small>
      </div>
    </div>
  );
}