// src/utils/errorHandler.js
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Error types
export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

// User-friendly error messages
const errorMessages = {
  [ErrorTypes.NETWORK]: '📡 Network error. Please check your internet connection.',
  [ErrorTypes.AUTH]: '🔒 Session expired. Please login again.',
  [ErrorTypes.VALIDATION]: '⚠️ Please check your input and try again.',
  [ErrorTypes.SERVER]: '🛠️ Server error. Our team has been notified.',
  [ErrorTypes.RATE_LIMIT]: '⏱️ Too many requests. Please wait a moment.',
  [ErrorTypes.NOT_FOUND]: '🔍 The requested resource was not found.',
  [ErrorTypes.INSUFFICIENT_FUNDS]: '💰 Insufficient wallet balance. Please fund your wallet.',
  [ErrorTypes.TIMEOUT]: '⏰ Request timed out. Please try again.',
  [ErrorTypes.UNKNOWN]: '❌ An unexpected error occurred. Please try again.'
};

// Determine error type from response
export const getErrorType = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;
  
  // Network errors
  if (error.message === 'Network Error' || !error.response) {
    return ErrorTypes.NETWORK;
  }
  
  const status = error.response?.status;
  const errorCode = error.response?.data?.error_code;
  
  // Rate limiting
  if (status === 429 || errorCode === 'RATE_LIMIT_EXCEEDED') {
    return ErrorTypes.RATE_LIMIT;
  }
  
  // Authentication errors
  if (status === 401) {
    return ErrorTypes.AUTH;
  }
  
  // Insufficient funds
  if (errorCode === 'INSUFFICIENT_BALANCE' || 
      error.response?.data?.error?.includes('Insufficient') ||
      error.response?.data?.error?.includes('balance')) {
    return ErrorTypes.INSUFFICIENT_FUNDS;
  }
  
  // Validation errors
  if (status === 400) {
    return ErrorTypes.VALIDATION;
  }
  
  // Not found
  if (status === 404) {
    return ErrorTypes.NOT_FOUND;
  }
  
  // Server errors
  if (status >= 500) {
    return ErrorTypes.SERVER;
  }
  
  return ErrorTypes.UNKNOWN;
};

// Get user-friendly error message
export const getErrorMessage = (error) => {
  const errorType = getErrorType(error);
  let message = errorMessages[errorType];
  
  // Add specific details if available
  if (error.response?.data?.error) {
    message = `${message}\n\nDetails: ${error.response.data.error}`;
  }
  
  if (error.response?.data?.message) {
    message = `${message}\n\nDetails: ${error.response.data.message}`;
  }
  
  return message;
};

// Show error toast with optional retry
export const showErrorToast = (error, onRetry = null) => {
  const errorType = getErrorType(error);
  const message = errorMessages[errorType];
  
  if (onRetry && errorType !== ErrorTypes.AUTH && errorType !== ErrorTypes.VALIDATION) {
    toast.error(message, {
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: onRetry
      }
    });
  } else {
    toast.error(message, { duration: 5000 });
  }
  
  return errorType;
};

// Show error modal for critical errors
export const showErrorModal = async (error, title = 'Error') => {
  const errorType = getErrorType(error);
  const message = errorMessages[errorType];
  
  if (errorType === ErrorTypes.AUTH) {
    const result = await Swal.fire({
      title: 'Session Expired',
      text: message,
      icon: 'warning',
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Login Again',
      showCancelButton: true,
      cancelButtonText: 'Stay'
    });
    
    if (result.isConfirmed) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return;
  }
  
  await Swal.fire({
    title: title,
    html: `<p>${message}</p>${
      error.response?.data?.error ? `<p class="text-muted small">${error.response.data.error}</p>` : ''
    }`,
    icon: 'error',
    confirmButtonColor: '#8B0000',
    confirmButtonText: 'OK'
  });
};

// Safe API call wrapper
export const safeApiCall = async (apiCall, context = 'Operation') => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${context} failed:`, error);
    const errorType = getErrorType(error);
    const message = errorMessages[errorType];
    toast.error(message);
    throw error;
  }
};

// Retry wrapper for API calls
export const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const errorType = getErrorType(error);
      
      // Don't retry for auth or validation errors
      if (errorType === ErrorTypes.AUTH || errorType === ErrorTypes.VALIDATION) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};