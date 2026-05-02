// src/hooks/usePaymentDetails.js
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const usePaymentDetails = () => {
  const [paymentDetails, setPaymentDetails] = useState({
    recipient_name: 'VENTURES/ADUSEI SAMUEL BROBBEY',
    recipient_phone: '0530499548',
    recipient_bank: '',
    instructions: '',
    min_amount: 10,
    max_amount: 100000,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      const response = await api.get('/settings/payment-details');
      if (response.data.success) {
        setPaymentDetails({
          ...response.data.data,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      setPaymentDetails(prev => ({
        ...prev,
        loading: false,
        error: 'Using default payment details'
      }));
    }
  };

  return paymentDetails;
};