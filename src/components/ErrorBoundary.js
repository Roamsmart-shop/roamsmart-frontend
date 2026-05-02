// src/components/ErrorBoundary.js
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import config from '../config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`${config.company.name} Error:`, error, errorInfo);
    // You can send to error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <FaExclamationTriangle size={48} />
          <h2>Something went wrong</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;