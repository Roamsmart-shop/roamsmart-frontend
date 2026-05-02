// src/components/LoadingSpinner.js
import React from 'react';
import { motion } from 'framer-motion';
import config from '../config';

export default function LoadingSpinner({ 
  message = `Loading ${config.company.shortName}...`, 
  fullScreen = true,
  size = 'medium'
}) {
  const spinnerSizes = {
    small: { width: 30, height: 30, borderWidth: 3 },
    medium: { width: 50, height: 50, borderWidth: 4 },
    large: { width: 70, height: 70, borderWidth: 5 }
  };
  
  const sizeConfig = spinnerSizes[size] || spinnerSizes.medium;
  
  const SpinnerContent = () => (
    <div className={`loading-spinner ${fullScreen ? 'fullscreen' : 'inline'}`}>
      <motion.div 
        className="spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          border: `${sizeConfig.borderWidth}px solid #f3f3f3`,
          borderTop: `${sizeConfig.borderWidth}px solid #8B0000`,
          borderRadius: '50%'
        }}
      />
      <p>{message}</p>
    </div>
  );
  
  return <SpinnerContent />;
}