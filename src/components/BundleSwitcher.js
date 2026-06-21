// src/components/BundleSwitcher.js - Updated with valid icons

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBolt, FaTachometerAlt, FaChartLine, FaExchangeAlt, FaSpinner, 
  FaCheckCircle, FaClock, FaInfoCircle, FaArrowRight, FaSync, FaUsers, FaSignal,
  FaHourglassHalf, FaRocket, FaCar, FaWalking, FaFire, FaExclamationTriangle,
  FaSmile, FaFrown, FaMeh, FaGrinStars, FaRegClock
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import '../styles/components/bundleSwitcher.css';

// ========== SPEED RATING HELPER ==========
const getSpeedRating = (avgTime, pendingCount = 0, processingCount = 0, isPeakHour = false) => {
  // Calculate base adjusted time
  let adjustedTime = avgTime;
  
  // Add queue delay based on pending orders
  if (pendingCount > 0) {
    // Each pending order adds approximately 0.5-1.5 minutes depending on congestion
    const queueDelay = Math.min(pendingCount * 0.7, 15);
    adjustedTime = avgTime + queueDelay;
  }
  
  // Add processing delay
  if (processingCount > 0) {
    adjustedTime += processingCount * 0.3;
  }
  
  // Peak hour adjustment
  if (isPeakHour) {
    adjustedTime = adjustedTime * 1.2; // 20% slower during peak hours
  }
  
  // Determine speed rating based on adjusted time
  if (adjustedTime <= 2) {
    return {
      label: 'INSTANT',
      emoji: '⚡',
      rating: 'instant',
      color: '#00E676',
      bgColor: '#00E67620',
      borderColor: '#00E676',
      icon: <FaBolt />,
      description: 'Immediate delivery - Almost no wait time!',
      class: 'instant'
    };
  } else if (adjustedTime <= 4) {
    return {
      label: 'VERY FAST',
      emoji: '🚀',
      rating: 'very_fast',
      color: '#4CAF50',
      bgColor: '#4CAF5020',
      borderColor: '#4CAF50',
      icon: <FaRocket />,
      description: 'Lightning fast delivery - Minimal wait!',
      class: 'very_fast'
    };
  } else if (adjustedTime <= 7) {
    return {
      label: 'FAST',
      emoji: '⚡',
      rating: 'fast',
      color: '#8BC34A',
      bgColor: '#8BC34A20',
      borderColor: '#8BC34A',
      icon: <FaCar />,
      description: 'Quick delivery - Short wait time',
      class: 'fast'
    };
  } else if (adjustedTime <= 12) {
    return {
      label: 'MODERATE',
      emoji: '⏱️',
      rating: 'moderate',
      color: '#FFC107',
      bgColor: '#FFC10720',
      borderColor: '#FFC107',
      icon: <FaHourglassHalf />,
      description: 'Standard delivery - Normal wait time',
      class: 'moderate'
    };
  } else if (adjustedTime <= 20) {
    return {
      label: 'SLOW',
      emoji: '🐢',
      rating: 'slow',
      color: '#FF9800',
      bgColor: '#FF980020',
      borderColor: '#FF9800',
      icon: <FaWalking />,
      description: 'Delayed delivery - Longer wait time',
      class: 'slow'
    };
  } else {
    return {
      label: 'VERY SLOW',
      emoji: '🐌',
      rating: 'very_slow',
      color: '#F44336',
      bgColor: '#F4433620',
      borderColor: '#F44336',
      icon: <FaExclamationTriangle />,
      description: 'Significant delays - High wait time. Consider using a different network.',
      class: 'very_slow'
    };
  }
};

// ========== QUEUE STATUS INDICATOR ==========
const QueueIndicator = ({ pendingCount, processingCount, queueWait }) => {
  if (!pendingCount && !processingCount) {
    return (
      <div className="queue-indicator clear">
        <FaCheckCircle style={{ color: '#28a745' }} />
        <span>No orders in queue - Fast delivery</span>
      </div>
    );
  }
  
  return (
    <div className="queue-indicator busy">
      <FaUsers style={{ color: '#ffc107' }} />
      <span>
        {pendingCount > 0 && `${pendingCount} pending`}
        {pendingCount > 0 && processingCount > 0 && ' • '}
        {processingCount > 0 && `${processingCount} processing`}
        {queueWait && ` • Est. wait: ${queueWait}`}
      </span>
    </div>
  );
};

// ========== BUNDLE OPTION CARD ==========
const BundleOptionCard = ({ 
  option, 
  isSelected, 
  onSelect, 
  isRecommended, 
  isLoading, 
  selectedSize,
  pendingCount,
  processingCount,
  isPeakHour,
  queueWait
}) => {
  // Get the price for the selected size
  const price = option?.prices?.[selectedSize] || 0;
  const basePrice = option?.base_price || 0;
  const name = option?.name || 'Standard Delivery';
  const type = option?.type || 'standard';
  const icon = option?.icon || '📱';
  const color = option?.color || '#3498db';
  const description = option?.description || 'Standard data delivery';
  
  // Get delivery time from option
  const delivery_time = option?.delivery_time || { min: 3, max: 8, avg: 5 };
  const avgTime = delivery_time?.avg || 5;
  const minTime = delivery_time?.min || 3;
  const maxTime = delivery_time?.max || 8;
  const offerSlug = option?.offer_slug || '';
  const queueLength = option?.queue_length || pendingCount || 0;
  
  // Calculate speed rating
  const speedRating = getSpeedRating(avgTime, pendingCount, processingCount, isPeakHour);
  
  // Get available sizes for this option
  const availableSizes = option?.prices ? Object.keys(option.prices).map(Number).sort((a, b) => a - b) : [];
  
  // Get delivery window
  const getDeliveryWindow = () => {
    const now = new Date();
    const start = new Date(now.getTime() + minTime * 60000);
    const end = new Date(now.getTime() + maxTime * 60000);
    return {
      start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  const window = getDeliveryWindow();
  
  return (
    <motion.div 
      className={`bundle-option-card ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''} speed-${speedRating.rating}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => !isLoading && onSelect(option)}
      style={{ 
        cursor: isLoading ? 'wait' : 'pointer', 
        opacity: isLoading ? 0.7 : 1,
        borderColor: isSelected ? speedRating.color : 'rgba(0,0,0,0.1)',
        background: isSelected ? `${speedRating.color}15` : 'white'
      }}
    >
      {/* Speed Rating Badge */}
      <div className="speed-badge" style={{ 
        background: speedRating.bgColor,
        color: speedRating.color,
        borderColor: speedRating.borderColor,
        border: `1px solid ${speedRating.borderColor}`,
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.65rem',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '0.8rem' }}>{speedRating.emoji}</span> {speedRating.label}
      </div>
      
      <div className="card-header">
        <div className="icon-section">
          <div className="icon-circle" style={{ background: `${color}20`, borderColor: color }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <div className="title-section">
            <h4>{name}</h4>
            {isRecommended && <span className="recommended-badge">⭐ Recommended</span>}
            {type === 'express' && <span className="express-badge" style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.6rem', marginLeft: '6px' }}>⚡ FAST</span>}
          </div>
        </div>
        {isSelected && (
          <div className="selected-badge">
            <FaCheckCircle /> Selected
          </div>
        )}
      </div>
      
      <div className="delivery-stats">
        <div className="stat-row">
          <FaClock className="stat-icon" />
          <span className="stat-label">Delivery Time:</span>
          <strong className="stat-value" style={{ color: speedRating.color }}>
            {minTime}-{maxTime} minutes
          </strong>
          <span className="stat-avg">(avg {avgTime} min)</span>
        </div>
        
        <div className="delivery-window">
          <span>⏰ {window.start} → {window.end}</span>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(100, (avgTime / 30) * 100)}%`, 
                background: speedRating.color 
              }}
            />
          </div>
          <div className="status-badge" style={{ background: `${speedRating.color}20`, color: speedRating.color }}>
            {speedRating.emoji} {speedRating.label}
          </div>
        </div>
        
        {/* Queue Status */}
        {pendingCount > 0 && (
          <div className="queue-status">
            <FaUsers style={{ color: '#ffc107', fontSize: '0.75rem' }} />
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
              {pendingCount} in queue • Est. wait: {queueWait || `${Math.round(pendingCount * 0.5)} min`}
            </span>
          </div>
        )}
        
        {/* Peak Hour Indicator */}
        {isPeakHour && (
          <div className="peak-hour-indicator">
            <FaFire style={{ color: '#ff6b35', fontSize: '0.7rem' }} />
            <span style={{ fontSize: '0.65rem', color: '#ff6b35' }}>
              Peak hour - Expect delays
            </span>
          </div>
        )}
      </div>
      
      <p className="option-description">{speedRating.description}</p>
      
      {/* Show price for the selected size */}
      {selectedSize && price > 0 ? (
        <div className="price-info" style={{ 
          fontSize: '0.9rem', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: isSelected ? '#FFD700' : (type === 'express' ? '#f39c12' : '#8B0000')
        }}>
          💰 Price for {selectedSize}GB: ₵{price.toFixed(2)}
          {basePrice > 0 && type === 'express' && (
            <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
              (Base: ₵{basePrice.toFixed(2)})
            </span>
          )}
          {offerSlug && (
            <span style={{ fontSize: '0.6rem', display: 'block', color: '#999', marginTop: '2px' }}>
              offer: {offerSlug}
            </span>
          )}
        </div>
      ) : (
        <div className="price-info" style={{ 
          fontSize: '0.8rem', 
          marginBottom: '12px',
          color: '#999'
        }}>
          {availableSizes.length > 0 ? (
            <span>Available sizes: {availableSizes.join(', ')}GB</span>
          ) : (
            <span>Select a size to see price</span>
          )}
        </div>
      )}
      
      <button className={`select-btn ${isSelected ? 'selected' : ''}`} disabled={isLoading}>
        {isSelected ? (
          <>✅ Currently Selected</>
        ) : (
          <>Switch to {type.charAt(0).toUpperCase() + type.slice(1)} <FaArrowRight /></>
        )}
      </button>
    </motion.div>
  );
};

// ========== MAIN BUNDLE SWITCHER COMPONENT ==========
export default function BundleSwitcher({ network, sizeGb, basePrice, onBundleChange, initialType = 'master' }) {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [isPeakHour, setIsPeakHour] = useState(false);
  const [queueWait, setQueueWait] = useState('0 min');
  
  const fetchOptions = async () => {
    if (!network) {
      setLoading(false);
      return;
    }
    
    console.log('🔍 [BundleSwitcher] Fetching options for:', { network, sizeGb });
    
    try {
      const response = await api.get(`/delivery/options`, {
        params: { network, size_gb: sizeGb || 1 }
      });
      
      console.log('📦 [BundleSwitcher] Full API Response:', response.data);
      
      if (response.data && response.data.success) {
        const deliveryData = response.data.data;
        const optionsData = deliveryData.options || [];
        const analyticsData = deliveryData.analytics || {};
        
        console.log('📊 [BundleSwitcher] Options received:', optionsData);
        console.log('📊 [BundleSwitcher] Analytics:', analyticsData);
        
        // Update queue info from analytics
        const pending = analyticsData.pending_count || 0;
        const processing = analyticsData.processing_count || 0;
        const congestion = analyticsData.congestion || 'low';
        
        setPendingCount(pending);
        setProcessingCount(processing);
        
        // Calculate queue wait time
        const avgTime = analyticsData.averages_by_type?.master?.avg || 5;
        const waitTime = pending > 0 ? Math.round(pending * (avgTime / 60) * 2) : 0;
        setQueueWait(waitTime > 0 ? `${waitTime} min` : 'No queue');
        
        // Check peak hour
        const hour = new Date().getHours();
        const peak = (8 <= hour && hour <= 11) || (17 <= hour && hour <= 20);
        setIsPeakHour(peak);
        
        // Log each option's prices
        optionsData.forEach((opt, idx) => {
          const priceCount = opt.prices ? Object.keys(opt.prices).length : 0;
          console.log(`  Option ${idx}: ${opt.type} - ${priceCount} sizes, offer_slug: ${opt.offer_slug}`);
        });
        
        // Add queue info to each option
        const optionsWithQueue = optionsData.map(opt => ({
          ...opt,
          queue_length: pending,
          processing_count: processing,
          is_peak_hour: peak,
          queue_wait: waitTime > 0 ? `${waitTime} min` : 'No queue'
        }));
        
        setOptions(optionsWithQueue);
        
        // Auto-select default option
        if (optionsWithQueue.length > 0 && !selectedOption) {
          let defaultOption = optionsWithQueue.find(o => o.type === initialType);
          if (!defaultOption) {
            defaultOption = optionsWithQueue.find(o => o.type === 'master') || 
                           optionsWithQueue.find(o => o.type === 'standard') || 
                           optionsWithQueue[0];
          }
          console.log('🎯 [BundleSwitcher] Default option selected:', defaultOption.type);
          setSelectedOption(defaultOption);
          if (onBundleChange && defaultOption) {
            onBundleChange(defaultOption);
          }
        }
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to load delivery options');
      }
    } catch (err) {
      console.error('❌ [BundleSwitcher] Error fetching options:', err);
      setError(err.response?.data?.message || 'Unable to load delivery options. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchOptions();
    
    const interval = setInterval(() => {
      if (!loading && !refreshing && network) {
        fetchOptions();
      }
    }, 30000);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);
    
    // Check peak hour every minute
    const peakInterval = setInterval(() => {
      const hour = new Date().getHours();
      const peak = (8 <= hour && hour <= 11) || (17 <= hour && hour <= 20);
      setIsPeakHour(peak);
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
      clearInterval(peakInterval);
    };
  }, [network, sizeGb]);
  
  const handleSelect = (option) => {
    console.log('🖱️ [BundleSwitcher] User selected:', option.type);
    
    if (!option || refreshing) return;
    
    setSelectedOption(option);
    if (onBundleChange) {
      onBundleChange(option);
    }
    
    const avgTime = option.delivery_time?.avg || '?';
    const price = option?.prices?.[sizeGb] || 0;
    const speedRating = getSpeedRating(avgTime, pendingCount, processingCount, isPeakHour);
    toast.success(`${option.name} selected - ₵${price.toFixed(2)} - ${speedRating.emoji} ${speedRating.label}`);
  };
  
  const handleRefresh = () => {
    if (refreshing || !network) return;
    setRefreshing(true);
    fetchOptions();
  };
  
  if (loading) {
    return (
      <div className="bundle-switcher-loading">
        <FaSpinner className="spinning" />
        <p>Loading delivery options...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bundle-switcher-error">
        <FaInfoCircle />
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchOptions}>Retry</button>
      </div>
    );
  }
  
  if (options.length === 0) {
    return (
      <div className="bundle-switcher-empty">
        <p>⚠️ No delivery options available for {network?.toUpperCase()}</p>
      </div>
    );
  }
  
  return (
    <div className="bundle-switcher">
      <div className="switcher-header">
        <div className="header-left">
          <h3>⚡ Delivery Options</h3>
          {sizeGb && (
            <span className="bundle-info">
              {sizeGb}GB Bundle
            </span>
          )}
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Queue Status */}
          <div className="queue-status-indicator">
            {pendingCount > 0 ? (
              <span style={{ color: '#ffc107', fontSize: '0.75rem' }}>
                <FaUsers /> {pendingCount} in queue
              </span>
            ) : (
              <span style={{ color: '#28a745', fontSize: '0.75rem' }}>
                <FaCheckCircle /> No queue
              </span>
            )}
          </div>
          
          {/* Peak Hour Indicator */}
          {isPeakHour && (
            <div className="peak-hour-badge" style={{ 
              background: '#ff6b3520', 
              color: '#ff6b35',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FaFire /> Peak Hour
            </div>
          )}
          
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Updating...' : `Refresh (${countdown}s)`}
          </button>
        </div>
      </div>
      
      {/* Queue Status Bar */}
      {(pendingCount > 0 || processingCount > 0) && (
        <div className="queue-status-bar" style={{
          background: '#fff3cd',
          padding: '8px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.8rem',
          flexWrap: 'wrap'
        }}>
          <FaUsers style={{ color: '#856404' }} />
          <span style={{ color: '#856404' }}>
            <strong>{pendingCount} orders pending</strong>
            {processingCount > 0 && ` • ${processingCount} processing`}
            {queueWait && ` • Estimated wait: ${queueWait}`}
          </span>
          {isPeakHour && (
            <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>
              ⚠️ Peak hours - Expect delays
            </span>
          )}
        </div>
      )}
      
      <div className="options-grid">
        {options.map((option, index) => (
          <BundleOptionCard
            key={option.type || index}
            option={option}
            selectedSize={sizeGb}
            isSelected={selectedOption?.type === option.type}
            isRecommended={option.type === 'master' || option.recommended || index === 0}
            onSelect={handleSelect}
            isLoading={refreshing}
            pendingCount={pendingCount}
            processingCount={processingCount}
            isPeakHour={isPeakHour}
            queueWait={queueWait}
          />
        ))}
      </div>
      
      <div className="switcher-footer">
        <div className="info-note">
          <small>
            ⚡ Each delivery type has its own pricing for all sizes. 
            Select a delivery speed and then choose your data size.
            Refreshes every 30 seconds automatically.
          </small>
        </div>
        
        {/* Speed Legend */}
        <div className="speed-legend" style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginTop: '12px',
          fontSize: '0.7rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#00E676' }}>⚡ Instant (≤2min)</span>
          <span style={{ color: '#4CAF50' }}>🚀 Very Fast (≤4min)</span>
          <span style={{ color: '#8BC34A' }}>⚡ Fast (≤7min)</span>
          <span style={{ color: '#FFC107' }}>⏱️ Moderate (≤12min)</span>
          <span style={{ color: '#FF9800' }}>🐢 Slow (≤20min)</span>
          <span style={{ color: '#F44336' }}>🐌 Very Slow (&gt;20min)</span>
        </div>
      </div>
    </div>
  );
}