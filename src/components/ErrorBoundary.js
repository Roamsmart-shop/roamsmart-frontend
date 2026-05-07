// src/components/ErrorBoundary.js
import React from 'react';
import { FaExclamationTriangle, FaWifi, FaServer, FaSync, FaHome } from 'react-icons/fa';
import config from '../config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorType: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Determine error type for better user messaging
    let errorType = 'unknown';
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('ERR_CONNECTION_REFUSED') || 
        errorMessage.includes('Network Error') ||
        errorMessage.includes('socket') ||
        errorMessage.includes('timeout')) {
      errorType = 'network';
    } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      errorType = 'auth';
    } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      errorType = 'forbidden';
    } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
      errorType = 'server';
    }
    
    return { hasError: true, error, errorType };
  }

  componentDidCatch(error, errorInfo) {
    // Log error but don't auto-clear auth
    console.error(`${config.company.name} Error:`, error, errorInfo);
    
    // Don't clear localStorage on errors - preserve user session
    // Only log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error details:', {
        message: error?.message,
        stack: error?.stack,
        errorType: this.state.errorType
      });
    }
  }

  handleRefresh = () => {
    // Preserve current URL parameters
    const currentUrl = window.location.href;
    window.location.href = currentUrl;
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearAndReload = () => {
    // Only clear if user confirms - don't auto-clear
    if (window.confirm('This will clear cached data and reload the page. Your login session will be preserved. Continue?')) {
      // Clear only non-auth storage
      const token = localStorage.getItem('roamsmart_token');
      const user = localStorage.getItem('roamsmart_user');
      const tokenExpiry = localStorage.getItem('roamsmart_token_expiry');
      
      // Clear all but preserve auth
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore auth data
      if (token) localStorage.setItem('roamsmart_token', token);
      if (user) localStorage.setItem('roamsmart_user', user);
      if (tokenExpiry) localStorage.setItem('roamsmart_token_expiry', tokenExpiry);
      
      window.location.reload();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  renderNetworkError() {
    return (
      <div className="error-boundary network-error">
        <FaWifi size={48} style={{ color: '#ffc107' }} />
        <h2>Connection Issue Detected</h2>
        <p>We're having trouble connecting to the server. Don't worry, your session is still active.</p>
        <div className="error-actions">
          <button onClick={this.handleRefresh} className="btn-primary">
            <FaSync /> Retry Connection
          </button>
          <button onClick={this.handleGoHome} className="btn-secondary">
            <FaHome /> Go to Homepage
          </button>
          <button onClick={this.toggleDetails} className="btn-text">
            Show Technical Details
          </button>
        </div>
        {this.state.showDetails && (
          <div className="error-details">
            <p><strong>Error Type:</strong> Network/Socket Connection</p>
            <p><strong>Message:</strong> {this.state.error?.message || 'Connection failed'}</p>
            <p><strong>Suggestion:</strong> Check your internet connection. Your data is saved locally.</p>
          </div>
        )}
      </div>
    );
  }

  renderAuthError() {
    return (
      <div className="error-boundary auth-error">
        <FaExclamationTriangle size={48} style={{ color: '#dc3545' }} />
        <h2>Session Expired</h2>
        <p>Your session has expired. Please login again to continue.</p>
        <div className="error-actions">
          <button onClick={() => window.location.href = '/login'} className="btn-primary">
            Go to Login
          </button>
          <button onClick={this.handleGoHome} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  renderServerError() {
    return (
      <div className="error-boundary server-error">
        <FaServer size={48} style={{ color: '#dc3545' }} />
        <h2>Server Error</h2>
        <p>The server encountered an error. Our team has been notified.</p>
        <div className="error-actions">
          <button onClick={this.handleRefresh} className="btn-primary">
            <FaSync /> Try Again
          </button>
          <button onClick={this.handleGoHome} className="btn-secondary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  renderUnknownError() {
    return (
      <div className="error-boundary unknown-error">
        <FaExclamationTriangle size={48} style={{ color: '#ffc107' }} />
        <h2>Something Went Wrong</h2>
        <p>We apologize for the inconvenience. Please try refreshing the page.</p>
        <div className="error-actions">
          <button onClick={this.handleRefresh} className="btn-primary">
            <FaSync /> Refresh Page
          </button>
          <button onClick={this.handleClearAndReload} className="btn-secondary">
            Clear Cache & Reload
          </button>
          <button onClick={this.handleGoHome} className="btn-secondary">
            Go Home
          </button>
          <button onClick={this.toggleDetails} className="btn-text">
            Show Details
          </button>
        </div>
        {this.state.showDetails && (
          <div className="error-details">
            <p><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</p>
            <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.error?.stack}</pre>
            )}
          </div>
        )}
      </div>
    );
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    
    // Render different error UI based on error type
    switch (this.state.errorType) {
      case 'network':
        return this.renderNetworkError();
      case 'auth':
        return this.renderAuthError();
      case 'server':
        return this.renderServerError();
      default:
        return this.renderUnknownError();
    }
  }
}

export default ErrorBoundary;