// src/hooks/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import api, { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export const useWallet = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total_credited: 0,
    total_debited: 0,
    total_orders: 0
  });

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.get('/user/stats');
      const newBalance = res.data.data?.wallet_balance || 0;
      setBalance(newBalance);
      return newBalance;
    } catch (error) {
      console.error('Failed to fetch Roamsmart balance:', error);
      return 0;
    }
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    try {
      const res = await paymentAPI.getTransactions(page);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
      
      // Calculate stats
      const credited = (res.data.data || [])
        .filter(t => t.type === 'credit' || t.type === 'fund' || t.type === 'commission')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const debited = (res.data.data || [])
        .filter(t => t.type === 'debit' || t.type === 'purchase' || t.type === 'withdrawal')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      setStats({
        total_credited: credited,
        total_debited: debited,
        total_orders: (res.data.data || []).filter(t => t.type === 'purchase').length
      });
    } catch (error) {
      console.error('Failed to fetch Roamsmart transactions:', error);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await paymentAPI.getManualRequests();
      setPendingRequests(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending requests from Roamsmart:', error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchTransactions(),
        fetchPendingRequests()
      ]);
    } catch (error) {
      console.error('Failed to refresh Roamsmart wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchBalance, fetchTransactions, fetchPendingRequests]);

  const fundWallet = useCallback(async (amount, method, phoneNumber = null) => {
    try {
      if (method === 'manual') {
        const res = await paymentAPI.createManualRequest(amount, phoneNumber);
        toast.success(`Manual payment request created on ${COMPANY.shortName}!`);
        await refreshAll();
        return { success: true, data: res.data.data };
      } else if (method === 'momo') {
        const res = await paymentAPI.initiateMomoPayment(amount, phoneNumber);
        toast.success(`Mobile money payment initiated on ${COMPANY.shortName}!`);
        await refreshAll();
        return { success: true, data: res.data.data };
      } else if (method === 'paystack') {
        const res = await paymentAPI.initiateCardPayment(amount);
        toast.success(`Card payment initiated on ${COMPANY.shortName}!`);
        await refreshAll();
        return { success: true, data: res.data.data };
      }
      return { success: false, error: 'Invalid payment method' };
    } catch (error) {
      toast.error(error.response?.data?.error || `Payment failed on ${COMPANY.shortName}`);
      return { success: false, error: error.response?.data?.error };
    }
  }, [refreshAll]);

  const verifyPayment = useCallback(async (reference, transactionId, senderName, senderPhone) => {
    try {
      const res = await paymentAPI.verifyPayment(reference, transactionId, senderName, senderPhone);
      if (res.data.success) {
        toast.success(`Payment verified on ${COMPANY.shortName}! Wallet credited.`);
        await refreshAll();
        return { success: true, amount: res.data.data.amount };
      }
      return { success: false, error: res.data.error };
    } catch (error) {
      toast.error(error.response?.data?.error || `Verification failed on ${COMPANY.shortName}`);
      return { success: false, error: error.response?.data?.error };
    }
  }, [refreshAll]);

  const hasSufficientBalance = useCallback((amount) => {
    return balance >= amount;
  }, [balance]);

  const formatBalance = useCallback(() => {
    return `₵${balance.toFixed(2)}`;
  }, [balance]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    balance,
    transactions,
    pendingRequests,
    loading,
    totalPages,
    stats,
    refreshAll,
    fetchBalance,
    fetchTransactions,
    fetchPendingRequests,
    fundWallet,
    verifyPayment,
    hasSufficientBalance,
    formatBalance
  };
};