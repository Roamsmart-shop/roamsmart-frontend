// src/components/BillPayment.js - Fixed version

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBolt, FaTint, FaTv, FaCheckCircle, FaSpinner, FaSearch, 
  FaHistory, FaMoneyBillWave, FaWater, FaCalendarAlt, FaBell, 
  FaPlus, FaTrash, FaClock, FaToggleOn, FaToggleOff, FaCopy,
  FaDownload, FaUpload, FaTimes, FaCheck, FaUndo, FaExclamationTriangle,
  FaArrowLeft
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext'; // Add this import
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
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 }
];

export default function BillPayment({ isAgent = false, onClose, onSuccess }) {
  // Get user from auth context
  const { user } = useAuth();
  
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
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // ECG Multi-meter states
  const [metersList, setMetersList] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  
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
  
  // Manual Payment States
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualRequest, setManualRequest] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [fundStep, setFundStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Helper to check if phone is required for current biller
  const requiresPhone = selectedBiller?.code === 'ECG' || selectedBiller?.code === 'GWCL';

  // Determine which API endpoints to use
  const getEndpoints = () => {
    if (isAgent) {
      return {
        validate: '/agent/bills/validate',
        pay: '/agent/bills/pay',
        history: '/agent/bills/history',
        recurring: '/agent/bills/recurring',
        recurringAdd: '/agent/bills/recurring',
        recurringToggle: '/agent/bills/recurring',
        recurringRemove: '/agent/bills/recurring'
      };
    }
    return {
      validate: '/user/bills/validate',
      pay: '/user/bills/pay',
      history: '/user/bills/history',
      recurring: '/user/bills/recurring',
      recurringAdd: '/user/bills/recurring',
      recurringToggle: '/user/bills/recurring',
      recurringRemove: '/user/bills/recurring'
    };
  };

  const endpoints = getEndpoints();

  useEffect(() => {
    fetchPaymentHistory();
    fetchRecurringBills();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const res = await api.get(endpoints.history);
      setPaymentHistory(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bill payment history');
    }
  };

  const fetchRecurringBills = async () => {
    try {
      const res = await api.get(endpoints.recurring);
      setRecurringBills(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recurring bills');
    }
  };

  // ========== REFUND REQUEST HANDLER ==========
  const requestRefund = async (payment) => {
    const paymentDate = new Date(payment.created_at);
    const daysSincePayment = (new Date() - paymentDate) / (1000 * 60 * 60 * 24);
    
    if (daysSincePayment > 45) {
      Swal.fire({
        icon: 'error',
        title: 'Refund Not Available',
        html: `
          <p>This payment is <strong>${Math.floor(daysSincePayment)} days old</strong>.</p>
          <p>Hubtel only allows refunds for transactions within the last 45 days.</p>
          <p>For older transactions, please contact support.</p>
        `,
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Request Refund',
      html: `
        <div style="text-align: left;">
          <p><strong>Biller:</strong> ${payment.biller_name}</p>
          <p><strong>Account:</strong> ${payment.account_number}</p>
          <p><strong>Amount:</strong> <strong style="color: #8B0000;">₵${payment.amount.toFixed(2)}</strong></p>
          <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
          <div class="form-group" style="margin-top: 15px;">
            <label>Reason for Refund (Optional)</label>
            <textarea id="refund-reason" class="form-control" rows="3" placeholder="Please explain why you need a refund..."></textarea>
          </div>
          <p style="margin-top: 15px; color: #ff9800;">
            ⚠️ Note: Refunds may take 3-5 business days to process.
            Funds will be returned to your Roamsmart wallet.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Request Refund',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const reason = document.getElementById('refund-reason')?.value || '';
        return { reason };
      }
    });
    
    if (result.isConfirmed) {
      setProcessingRefund(true);
      try {
        const response = await api.post('/refund/request', {
          order_id: payment.reference,
          reason: result.value.reason || 'Customer requested refund'
        });
        
        if (response.data.success) {
          toast.success(`Refund request submitted! Reference: ${response.data.data.order_id}`);
          
          Swal.fire({
            icon: 'success',
            title: 'Refund Request Submitted',
            html: `
              <p>Your refund request has been submitted successfully.</p>
              <p><strong>Status:</strong> ${response.data.data.status}</p>
              <p><strong>Reference:</strong> ${response.data.data.order_id}</p>
            `,
            confirmButtonColor: '#28a745'
          });
          
          fetchPaymentHistory();
        } else {
          toast.error(response.data.error || 'Refund request failed');
        }
      } catch (error) {
        console.error('Refund error:', error);
        toast.error(error.response?.data?.error || 'Failed to process refund request');
      } finally {
        setProcessingRefund(false);
      }
    }
  };

  // Phone number validation helper
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setCustomerPhone(phone);
    
    if (requiresPhone && phone && !validatePhoneNumber(phone)) {
      setPhoneError('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
    } else {
      setPhoneError('');
    }
  };

  // ========== VALIDATE ACCOUNT ==========
  const validateAccount = async () => {
    if (!selectedBiller || !accountNumber) {
      toast.error('Please select a biller and enter account number');
      return;
    }

    if (requiresPhone && !customerPhone) {
      toast.error('Phone number is required for validation. Please enter your phone number.');
      return;
    }

    setValidating(true);
    try {
      const payload = {
        biller_code: selectedBiller.code,
        account_number: accountNumber
      };
      
      if (requiresPhone) {
        payload.phone_number = customerPhone;
      }
      
      if (selectedBiller.code === 'GWCL') {
        payload.meter_number = accountNumber;
      }
      
      console.log('Validation payload:', payload);
      
      const res = await api.post(endpoints.validate, payload);
      
      if (res.data.success) {
        const data = res.data.data;
        
        let amountDue = 0;
        if (data.amount_due !== undefined && data.amount_due !== null) {
          amountDue = parseFloat(data.amount_due);
          if (isNaN(amountDue)) amountDue = 0;
          if (amountDue < 0) amountDue = 0;
        }
        
        if (data.meters && Array.isArray(data.meters)) {
          setMetersList(data.meters);
          setValidatedAccount({
            ...data,
            amount_due: amountDue,
            is_multi_meter: true
          });
          setBillDetails({
            ...data,
            amount_due: amountDue
          });
          toast.success(`Found ${data.meters.length} meter(s) linked to this phone number`);
        } else {
          setValidatedAccount({
            ...data,
            amount_due: amountDue
          });
          setBillDetails({
            ...data,
            amount_due: amountDue
          });
          setCustomerName(data.customer_name || customerName);
          setCustomerEmail(data.customer_email || '');
          setCustomerPhone(data.customer_phone || customerPhone);
          
          if (amountDue > 0) {
            setAmount(amountDue);
          }
          
          toast.success(`Account validated on ${COMPANY.shortName}`);
        }
      } else {
        toast.error(res.data.error || 'Invalid account number');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(error.response?.data?.error || 'Validation failed. Please check the account number and phone number.');
    } finally {
      setValidating(false);
    }
  };

  // ========== PAY BILL ==========
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

  let meterNumber = null;
  if (selectedBiller.code === 'ECG') {
    if (selectedMeter) {
      meterNumber = selectedMeter.meter_number;
    } else if (validatedAccount?.selected_meter) {
      meterNumber = validatedAccount.selected_meter;
    } else if (metersList.length === 1) {
      meterNumber = metersList[0].meter_number;
    } else {
      meterNumber = accountNumber;
    }
    
    if (!meterNumber) {
      toast.error('Please select a meter number for ECG');
      return;
    }
  }

  let waterMeterNumber = null;
  let waterSessionId = null;
  if (selectedBiller.code === 'GWCL') {
    waterMeterNumber = accountNumber;
    waterSessionId = validatedAccount?.session_id;
    if (!waterSessionId) {
      toast.error('Please validate the water account first');
      return;
    }
  }

  const result = await Swal.fire({
    title: 'Confirm Bill Payment',
    html: `
      <div style="text-align: left;">
        <p><strong>Biller:</strong> ${selectedBiller.name}</p>
        <p><strong>Account Number:</strong> ${accountNumber}</p>
        ${selectedBiller.code === 'ECG' ? `<p><strong>Meter Number:</strong> ${meterNumber}</p>` : ''}
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
    const payload = {
      biller_code: selectedBiller.code,
      account_number: accountNumber,
      amount: amountNum,
      customer_name: customerName || 'Customer',
      customer_email: customerEmail,
      customer_phone: customerPhone || user?.phone || ''
    };
    
    if (selectedBiller.code === 'ECG') {
      payload.meter_number = meterNumber;
    }
    
    if (selectedBiller.code === 'GWCL') {
      payload.meter_number = waterMeterNumber;
      payload.session_id = waterSessionId;
    }
    
    console.log('Payment payload:', payload);
    
    const res = await api.post(endpoints.pay, payload);
    
    // ========== HANDLE SUCCESS ==========
    if (res.data.success) {
      toast.success(`Bill paid successfully on ${COMPANY.shortName}!`);
      
      setAccountNumber('');
      setAmount('');
      setValidatedAccount(null);
      setBillDetails(null);
      setSelectedBiller(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setMetersList([]);
      setSelectedMeter(null);
      
      fetchPaymentHistory();
      
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        html: `
          <p>Your payment of <strong>₵${amountNum.toFixed(2)}</strong> to <strong>${selectedBiller.name}</strong> has been processed.</p>
          <p>Transaction Reference: ${res.data.data?.reference || res.data.reference}</p>
          ${res.data.data?.commission ? `<p>Commission Earned: <strong>₵${res.data.data.commission.you_earned?.toFixed(4)}</strong></p>` : ''}
        `,
        confirmButtonColor: '#8B0000'
      });
      
      if (typeof onClose === 'function') {
        onClose();
      }
      return;
    }
    
    // ========== HANDLE API ERROR RESPONSE ==========
    const errorData = res.data;
    const errorCode = errorData?.code;
    const errorMsg = errorData?.error || 'Payment failed. Please try again.';
    const suggestion = errorData?.suggestion || '';
    
    // Handle insufficient Hubtel balance
    if (errorCode === 'INSUFFICIENT_HUBTEL_BALANCE' || 
        errorMsg.includes('insufficient') || 
        errorMsg.includes('Hubtel account balance')) {
      
      // Show detailed error with suggestion
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Hubtel Balance Issue',
        html: `
          <div style="text-align: left;">
            <p><strong>${errorMsg}</strong></p>
            ${suggestion ? `<p>💡 ${suggestion}</p>` : ''}
            ${errorData?.data?.hubtel_balance !== undefined ? `
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Hubtel Balance:</strong> GHS ${errorData.data.hubtel_balance?.toFixed(2) || '0.00'}</p>
                <p><strong>Required:</strong> GHS ${amountNum.toFixed(2)}</p>
                <p><strong>Shortfall:</strong> GHS ${(amountNum - (errorData.data.hubtel_balance || 0)).toFixed(2)}</p>
              </div>
            ` : ''}
            <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 12px;">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>💡 What to do:</strong>
              </p>
              <ul style="margin: 8px 0 0 20px; font-size: 0.85rem;">
                <li>Contact Roamsmart admin to top up the Hubtel account</li>
                <li>Try a smaller payment amount</li>
                <li>Use a different payment method</li>
              </ul>
            </div>
          </div>
        `,
        confirmButtonColor: '#8B0000',
        confirmButtonText: 'OK, I Understand'
      });
      
      // No wallet deduction occurred - no need to refund
      toast.error('Payment was not processed. Your wallet balance is unchanged.');
      return;
    }
    
    // Handle other specific error codes
    if (errorCode === 'HUBTEL_NOT_CONFIGURED') {
      await Swal.fire({
        icon: 'error',
        title: 'Service Unavailable',
        html: `
          <p>Hubtel service is not configured.</p>
          <p>Please contact support to resolve this issue.</p>
        `,
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    
    if (errorCode === 'HUBTEL_API_ERROR') {
      await Swal.fire({
        icon: 'error',
        title: 'Hubtel API Error',
        html: `
          <p>There was an error communicating with Hubtel.</p>
          <p><strong>Error:</strong> ${errorMsg}</p>
          <p>Please try again later.</p>
        `,
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    
    // Generic error
    toast.error(errorMsg);
    
  } catch (error) {
    console.error('Payment error:', error);
    
    // ========== HANDLE NETWORK/TIMEOUT ERRORS ==========
    const errorResponse = error.response?.data;
    const errorMsg = errorResponse?.error || error.message || 'Payment failed. Please try again.';
    const errorCode = errorResponse?.code;
    
    // Check if it's an insufficient balance error from the backend
    if (errorCode === 'INSUFFICIENT_HUBTEL_BALANCE' || 
        errorMsg.toLowerCase().includes('insufficient') || 
        errorMsg.toLowerCase().includes('hubtel balance')) {
      
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Hubtel Balance Issue',
        html: `
          <div style="text-align: left;">
            <p><strong>${errorMsg}</strong></p>
            <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 12px;">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>💡 What to do:</strong>
              </p>
              <ul style="margin: 8px 0 0 20px; font-size: 0.85rem;">
                <li>Contact Roamsmart admin to top up the Hubtel account</li>
                <li>Try a smaller payment amount</li>
                <li>Use a different payment method</li>
              </ul>
            </div>
            <p style="margin-top: 12px; color: #28a745;">
              ✅ Your wallet has NOT been charged.
            </p>
          </div>
        `,
        confirmButtonColor: '#8B0000',
        confirmButtonText: 'OK, I Understand'
      });
      return;
    }
    
    // Network error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      await Swal.fire({
        icon: 'error',
        title: 'Request Timeout',
        html: `
          <p>The payment request timed out.</p>
          <p>Please check your connection and try again.</p>
          <p style="color: #28a745;">✅ Your wallet has NOT been charged.</p>
        `,
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    
    // Generic error
    toast.error(errorMsg);
    
  } finally {
    setPaying(false);
  }
};

  // ========== RECURRING BILL HANDLERS ==========
  const addRecurringBill = async () => {
    if (!selectedBiller || !accountNumber) {
      toast.error('Please select a biller and enter account number');
      return;
    }

    setAddingRecurring(true);
    try {
      const res = await api.post(endpoints.recurringAdd, {
        biller_code: selectedBiller.code,
        biller_name: selectedBiller.name,
        account_number: accountNumber,
        customer_name: customerName || 'Customer',
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
        await api.delete(`${endpoints.recurringRemove}/${billId}`);
        toast.success('Recurring bill removed');
        fetchRecurringBills();
      } catch (error) {
        toast.error('Failed to remove recurring bill');
      }
    }
  };

  const toggleRecurringStatus = async (billId, currentStatus) => {
    try {
      await api.put(`${endpoints.recurringToggle}/${billId}`, { enabled: !currentStatus });
      toast.success(`Recurring bill ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchRecurringBills();
    } catch (error) {
      toast.error('Failed to update recurring bill');
    }
  };

  // ========== MANUAL PAYMENT HANDLERS ==========
  const generateManualReference = async (amount, phone) => {
    try {
      const res = await api.post('/wallet/generate-reference', { amount, phone });
      if (res.data.success) {
        setManualRequest(res.data.data);
        setFundStep(3);
        toast.success('Manual payment request created!');
      }
    } catch (error) {
      console.error('Generate reference error:', error);
      toast.error(error.response?.data?.error || 'Failed to create request');
    }
  };

  const handleManualAmountSubmit = async () => {
    const amountNum = parseFloat(manualAmount);
    if (!manualAmount || amountNum < 10) {
      toast.error('Minimum amount is ₵10');
      return;
    }
    
    setUploadingProof(true);
    await generateManualReference(amountNum, customerPhone);
    setUploadingProof(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!proofFile) {
      toast.error('Please select a payment screenshot');
      return;
    }

    if (!manualRequest?.reference) {
      toast.error('No payment reference found');
      return;
    }

    setUploadingProof(true);
    
    const formData = new FormData();
    formData.append('reference', manualRequest.reference);
    formData.append('proof', proofFile);

    try {
      const res = await api.post('/payment/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        toast.success('Proof uploaded! Admin will verify.');
        setShowManualPaymentModal(false);
        resetManualPayment();
        fetchPaymentHistory();
      } else {
        toast.error(res.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const resetManualPayment = () => {
    setManualRequest(null);
    setProofFile(null);
    setManualAmount('');
    setFundStep(1);
    setCopied(false);
  };

  const downloadInstructions = () => {
    if (!manualRequest) return;
    
    const instructions = `
${COMPANY.name.toUpperCase()} - MANUAL PAYMENT INSTRUCTIONS

Amount: ₵${manualRequest.amount}
Reference ID: ${manualRequest.reference}
Date: ${new Date().toLocaleString()}

PAYMENT DETAILS:
Recipient: ${COMPANY.name}
Phone: ${COMPANY.phone}

INSTRUCTIONS:
1. Go to your mobile money wallet
2. Select "Send Money" or "Transfer"
3. Enter recipient: ${COMPANY.phone}
4. Enter amount: ₵${manualRequest.amount}
5. Enter Reference: ${manualRequest.reference}
6. Complete the transaction
7. Take a screenshot of the confirmation
8. Upload the screenshot using the upload button
`;
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamsmart_payment_instructions_${manualRequest.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Instructions downloaded');
  };

  const handleCopyReference = () => {
    if (manualRequest?.reference) {
      navigator.clipboard.writeText(manualRequest.reference);
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper functions
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
      case 'success':
        return <span className="badge-success"><FaCheckCircle /> Completed</span>;
      case 'pending':
        return <span className="badge-warning"><FaSpinner className="spinning" /> Pending</span>;
      case 'failed':
        return <span className="badge-danger">Failed</span>;
      case 'refunded':
        return <span className="badge-info"><FaUndo /> Refunded</span>;
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

  // ========== RENDER ==========
  return (
    <div className="bill-payment-section">
      {/* Fund Wallet Button */}
      <div className="fund-wallet-button" style={{ marginBottom: '20px' }}>
        <button 
          className="btn-primary" 
          onClick={() => setShowManualPaymentModal(true)}
          style={{ width: '100%' }}
        >
          <FaMoneyBillWave /> Fund Wallet (Manual Payment)
        </button>
      </div>

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
              setCustomerPhone('');
              setMetersList([]);
              setPhoneError('');
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
          
          {/* Phone Number Field - Required for ECG and GWCL */}
          {requiresPhone && (
            <div className="form-group">
              <label>
                Phone Number <span className="required-star" style={{ color: '#dc3545' }}>*</span>
              </label>
              <input 
                type="tel" 
                className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                placeholder="024XXXXXXX"
                value={customerPhone}
                onChange={handlePhoneChange}
              />
              {phoneError && (
                <div className="invalid-feedback" style={{ color: '#dc3545', fontSize: '0.8rem' }}>
                  {phoneError}
                </div>
              )}
              <small className="text-muted">
                {selectedBiller?.code === 'ECG' 
                  ? 'Phone number linked to your ECG account (required for validation)'
                  : 'Phone number registered with Ghana Water (required for validation)'}
              </small>
            </div>
          )}
          
          {/* Validated Account Info */}
          {validatedAccount && (
            <motion.div className="validated-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h4><FaCheckCircle /> Account Information</h4>
              <p><strong>Customer Name:</strong> {validatedAccount.customer_name || 'N/A'}</p>
              {validatedAccount.customer_email && <p><strong>Email:</strong> {validatedAccount.customer_email}</p>}
              {validatedAccount.customer_phone && <p><strong>Phone:</strong> {validatedAccount.customer_phone}</p>}
              {validatedAccount.amount_due !== undefined && validatedAccount.amount_due !== null && (
                <p><strong>Amount Due:</strong> <strong style={{ color: '#8B0000' }}>₵{parseFloat(validatedAccount.amount_due || 0).toFixed(2)}</strong></p>
              )}
            </motion.div>
          )}
          
          {/* ECG Meter Selection */}
          {metersList.length > 0 && (
            <div className="meters-selection">
              <h5>Select Meter to Pay</h5>
              <div className="meters-list">
                {metersList.map((meter, index) => (
                  <div 
                    key={index}
                    className={`meter-card ${selectedMeter?.meter_number === meter.meter_number ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedMeter(meter);
                      setAccountNumber(meter.meter_number);
                      setCustomerName(meter.customer_name);
                      const amountDue = Math.abs(meter.amount_due || 0);
                      setAmount(amountDue);
                    }}
                  >
                    <div className="meter-info">
                      <strong>{meter.customer_name}</strong>
                      <span className="meter-number">{meter.meter_number}</span>
                    </div>
                    <div className="meter-amount">
                      ₵{Math.abs(meter.amount_due || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <label>Customer Email (Optional)</label>
              <input 
                type="email" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@example.com"
                className="form-control"
              />
            </div>
          </div>

          <button 
            className="btn-primary btn-block" 
            onClick={handlePayment}
            disabled={paying || !amount || !accountNumber || (requiresPhone && !customerPhone)}
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
      
      {/* Payment History with Refund Button */}
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.slice(0, 10).map(payment => (
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
                        <td className="actions">
                          {payment.status === 'completed' && (
                            <button 
                              className="btn-refund"
                              onClick={() => requestRefund(payment)}
                              disabled={processingRefund}
                              title="Request Refund"
                            >
                              {processingRefund ? <FaSpinner className="spinning" /> : <FaUndo />}
                              Refund
                            </button>
                          )}
                          {payment.status === 'refunded' && (
                            <span className="refunded-badge">
                              <FaCheckCircle /> Refunded
                            </span>
                          )}
                        </td>
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

      {/* ========== MANUAL PAYMENT MODAL ========== */}
      <AnimatePresence>
        {showManualPaymentModal && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowManualPaymentModal(false)}
          >
            <motion.div 
              className="modal-content fund-wallet-modal" 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowManualPaymentModal(false)}>×</button>
              
              {fundStep === 1 && (
                <div className="fund-step">
                  <h3>Fund Your Roamsmart Wallet</h3>
                  <p>Enter amount to add to your wallet via manual transfer</p>
                  
                  <div className="form-group">
                    <label>Amount (GHS)</label>
                    <input 
                      type="number" 
                      className="form-control amount-input" 
                      placeholder="Enter amount (min. ₵10)" 
                      min="10"
                      step="10"
                      value={manualAmount} 
                      onChange={e => setManualAmount(e.target.value)} 
                    />
                    <small>Minimum amount: ₵10</small>
                  </div>
                  
                  <button 
                    className="btn-primary btn-block" 
                    onClick={handleManualAmountSubmit} 
                    disabled={uploadingProof}
                  >
                    {uploadingProof ? <FaSpinner className="spinning" /> : 'Proceed to Payment'}
                  </button>
                </div>
              )}
              
              {fundStep === 3 && manualRequest && (
                <div className="fund-step instructions-step">
                  <h3>Roamsmart Payment Instructions</h3>
                  
                  <div className="payment-details-card">
                    <div className="detail-row">
                      <span className="detail-label">Amount to Pay:</span>
                      <span className="detail-value amount">₵{manualRequest.amount?.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Recipient Name:</span>
                      <span className="detail-value">{COMPANY.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone Number:</span>
                      <span className="detail-value">{COMPANY.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Reference ID:</span>
                      <div className="reference-box">
                        <code>{manualRequest.reference}</code>
                        <button onClick={handleCopyReference} className="copy-btn">
                          {copied ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="how-it-works">
                    <h4>📋 How to pay:</h4>
                    <ol>
                      <li>Go to your mobile money wallet</li>
                      <li>Send ₵{manualRequest.amount?.toFixed(2)} to <strong>{COMPANY.phone}</strong></li>
                      <li>Use reference: <strong>{manualRequest.reference}</strong></li>
                      <li>Take a screenshot of the confirmation</li>
                      <li>Upload the screenshot below</li>
                    </ol>
                  </div>
                  
                  <div className="upload-section">
                    <h4>Upload Payment Proof</h4>
                    <div className="upload-area">
                      <input 
                        type="file" 
                        id="proof-upload"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proof-upload" className="upload-label">
                        {proofFile ? <><FaCheck /> {proofFile.name}</> : <><FaUpload /> Click to upload screenshot</>}
                      </label>
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
                        {uploadingProof ? <FaSpinner className="spinning" /> : 'Submit Payment Proof'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}