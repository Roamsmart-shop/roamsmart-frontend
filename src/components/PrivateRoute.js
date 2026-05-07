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
  const { user, loading, isAdmin, isAgent, isSuperAdmin } = useAuth();
  
  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading {COMPANY.shortName}...</p>
      </div>
    );
  }
  
  // No user - redirect to login
  if (!user) {
    console.log('PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If no specific roles required, just allow access
  if (allowedRoles.length === 0) {
    return children;
  }
  
  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => {
    switch(role) {
      case 'agent':
        return isAgent || user?.is_agent === true;
      case 'admin':
        return isAdmin || user?.role === 'admin' || user?.role === 'super_admin';
      case 'super_admin':
        return isSuperAdmin || user?.role === 'super_admin';
      case 'user':
        return !isAdmin && !isAgent && user?.role === 'user';
      default:
        return user?.role === role;
    }
  });
  
  console.log('PrivateRoute check:', {
    userRole: user?.role,
    isAdmin,
    isAgent,
    isSuperAdmin,
    allowedRoles,
    hasAllowedRole
  });
  
  // If user doesn't have required role, redirect to appropriate dashboard
  if (!hasAllowedRole) {
    console.log('PrivateRoute: User lacks required role, redirecting');
    
    // Redirect to the correct dashboard based on user role
    if (isSuperAdmin || isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isAgent) {
      return <Navigate to="/agent" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}