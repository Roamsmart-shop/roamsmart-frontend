// src/components/OrderProgressTracker.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaSpinner, FaClock, FaTimesCircle, FaMobileAlt, FaCheck, FaBell, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

const OrderProgressTracker = ({ order, onStatusUpdate, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    { 
      name: 'Order Received', 
      icon: <FaClock />, 
      description: 'Order has been placed on Roamsmart',
      status: order?.status === 'pending' || order?.status === 'received' ? 'active' : order?.status === 'completed' ? 'completed' : 'pending'
    },
    { 
      name: 'Processing', 
      icon: <FaSpinner />, 
      description: 'Verifying payment and preparing data on Roamsmart',
      status: order?.status === 'processing' ? 'active' : order?.status === 'completed' ? 'completed' : 'pending'
    },
    { 
      name: 'Sending Data', 
      icon: <FaMobileAlt />, 
      description: 'Data bundle being sent to customer',
      status: order?.status === 'sending' ? 'active' : order?.status === 'completed' ? 'completed' : 'pending'
    },
    { 
      name: 'Delivered', 
      icon: <FaCheckCircle />, 
      description: 'Data successfully delivered via Roamsmart',
      status: order?.status === 'completed' ? 'completed' : 'pending'
    }
  ];

  useEffect(() => {
    // Update current step based on order status
    const statusMap = {
      'pending': 0,
      'received': 0,
      'processing': 1,
      'sending': 2,
      'completed': 3,
      'failed': -1
    };
    setCurrentStep(statusMap[order?.status] || 0);
  }, [order]);

  const handleStatusUpdate = async (newStatus) => {
    setIsAnimating(true);
    const result = await onStatusUpdate(order.id, newStatus);
    
    if (result?.success !== false && newStatus === 'completed') {
      // Show success notification
      Swal.fire({
        icon: 'success',
        title: 'Order Completed on Roamsmart!',
        html: `Order #${order.order_id} has been marked as delivered.<br/>Customer has been notified via SMS.`,
        confirmButtonColor: '#8B0000',
        timer: 3000
      });
      if (onComplete) onComplete(order);
    }
    
    setIsAnimating(false);
  };

  const getStepClass = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStatusMessage = () => {
    switch(order?.status) {
      case 'pending':
        return 'Your order is pending. The agent will process it shortly.';
      case 'processing':
        return 'Your order is being processed. Data delivery in progress.';
      case 'sending':
        return 'Data is being sent to your number. Please wait...';
      case 'completed':
        return 'Your data has been delivered successfully! Thank you for choosing Roamsmart.';
      default:
        return '';
    }
  };

  return (
    <div className="order-progress-tracker">
      <div className="progress-header">
        <h4>Order #{order?.order_id} on {COMPANY.shortName}</h4>
        <span className={`order-status-badge ${order?.status}`}>
          {order?.status?.toUpperCase()}
        </span>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div key={index} className={`progress-step ${getStepClass(index)}`}>
            <div className="step-icon">
              {getStepClass(index) === 'completed' ? <FaCheck /> : step.icon}
            </div>
            <div className="step-content">
              <div className="step-name">{step.name}</div>
              <div className="step-description">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${getStepClass(index + 1)}`} />
            )}
          </div>
        ))}
      </div>

      {/* Status Message */}
      <div className="status-message">
        <p>{getStatusMessage()}</p>
      </div>

      {/* Action Buttons for Agent */}
      <div className="progress-actions">
        {order?.status === 'pending' && (
          <button 
            className="btn-primary btn-sm"
            onClick={() => handleStatusUpdate('processing')}
            disabled={isAnimating}
          >
            <FaSpinner /> Start Processing on Roamsmart
          </button>
        )}
        
        {order?.status === 'processing' && (
          <button 
            className="btn-primary btn-sm"
            onClick={() => handleStatusUpdate('sending')}
            disabled={isAnimating}
          >
            <FaMobileAlt /> Send Data via Roamsmart
          </button>
        )}
        
        {order?.status === 'sending' && (
          <button 
            className="btn-success btn-sm"
            onClick={() => {
              Swal.fire({
                title: 'Confirm Delivery on Roamsmart',
                text: 'Has the customer confirmed receiving the data?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Yes, Mark as Delivered',
                cancelButtonText: 'Not Yet'
              }).then((result) => {
                if (result.isConfirmed) {
                  handleStatusUpdate('completed');
                }
              });
            }}
            disabled={isAnimating}
          >
            <FaCheckCircle /> Mark as Delivered on Roamsmart
          </button>
        )}
        
        {order?.status === 'completed' && (
          <div className="delivery-confirmed">
            <FaCheckCircle /> Delivered to customer via Roamsmart
          </div>
        )}
      </div>

      {/* Customer Notification */}
      {order?.status === 'completed' && (
        <div className="customer-notification">
          <FaBell />
          <span>Customer has been notified via SMS from Roamsmart</span>
        </div>
      )}
      
      {/* Support Contact */}
      <div className="progress-support">
        <small>Need help? Contact Roamsmart support: {COMPANY.phone}</small>
      </div>
    </div>
  );
};

export default OrderProgressTracker;