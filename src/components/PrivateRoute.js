// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading {COMPANY.shortName}...</p></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => {
      if (role === 'agent') return user.is_agent;
      if (role === 'admin') return user.role === 'admin' || user.role === 'super_admin';
      if (role === 'super_admin') return user.role === 'super_admin';
      return user.role === role;
    });
    
    if (!hasAllowedRole) {
      // Redirect to appropriate dashboard
      if (user.is_agent) return <Navigate to="/agent" replace />;
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
}