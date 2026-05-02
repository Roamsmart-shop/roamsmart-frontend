// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaHeadset, FaArrowLeft } from 'react-icons/fa';
import config from '../config';

export default function NotFound() {
  return (
    <motion.div 
      className="not-found-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-code">
            <span className="digit">4</span>
            <span className="digit">0</span>
            <span className="digit">4</span>
          </div>
          
          <h1>Page Not Found</h1>
          <p className="not-found-message">
            Sorry, the page you are looking for does not exist on {config.company.name}.
          </p>
          
          <div className="not-found-actions">
            <Link to="/" className="btn-primary">
              <FaHome /> Go to Homepage
            </Link>
            <Link to="/dashboard" className="btn-outline">
              <FaArrowLeft /> Go to Dashboard
            </Link>
            <Link to="/support" className="btn-outline">
              <FaHeadset /> Contact Support
            </Link>
          </div>
          
          <div className="not-found-suggestions">
            <h3>You might be looking for:</h3>
            <div className="suggestions-grid">
              <Link to="/dashboard" className="suggestion-link">
                📱 Buy Data
              </Link>
              <Link to="/become-agent" className="suggestion-link">
                🤝 Become an Agent
              </Link>
              <Link to="/waec-vouchers" className="suggestion-link">
                🎓 WAEC Vouchers
              </Link>
              <Link to="/support" className="suggestion-link">
                💬 Support Center
              </Link>
            </div>
          </div>
          
          <div className="not-found-search">
            <p>Need help finding something?</p>
            <div className="search-box">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search on Roamsmart..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}