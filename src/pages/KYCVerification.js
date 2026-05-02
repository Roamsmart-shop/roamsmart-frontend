// src/pages/KYCVerification.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaEye, FaSpinner, FaSearch, FaFilter, FaUserCheck } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function KYCVerification() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/kyc-requests');
      setRequests(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load KYC requests from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const verifyKYC = async (id, status) => {
    const actionText = status === 'approved' ? 'approve' : 'reject';
    
    const result = await Swal.fire({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} KYC Request?`,
      text: `Are you sure you want to ${actionText} this KYC verification request on ${COMPANY.name}?`,
      icon: status === 'approved' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: status === 'approved' ? '#28a745' : '#dc3545',
      confirmButtonText: `Yes, ${status === 'approved' ? 'Approve' : 'Reject'}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setVerifying(true);
    try {
      await api.post(`/admin/kyc/${id}/verify`, { status });
      toast.success(`KYC ${status} successfully on ${COMPANY.shortName}`);
      await fetchRequests();
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const viewDocument = (url) => {
    window.open(url, '_blank');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="badge-success"><FaCheckCircle /> Approved</span>;
      case 'rejected':
        return <span className="badge-danger"><FaTimesCircle /> Rejected</span>;
      default:
        return <span className="badge-warning">Pending Review</span>;
    }
  };

  const getDocumentTypeIcon = (type) => {
    const types = {
      'passport': '📘',
      'voter_id': '📇',
      'driver_license': '🚗',
      'national_id': '🆔'
    };
    return types[type] || '📄';
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} KYC requests...</p>
    </div>
  );

  return (
    <motion.div 
      className="admin-page kyc-verification-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaShieldAlt /> KYC Verification</h1>
          <p>Manage Know Your Customer (KYC) verification requests on {COMPANY.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="kyc-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by username, email or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KYC Requests Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Document Type</th>
              <th>Document Number</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id}>
                <td>
                  <div className="user-info">
                    <strong>{req.username || 'Unknown'}</strong>
                    {req.full_name && <small>{req.full_name}</small>}
                  </div>
                </td>
                <td>
                  <div>{req.phone || 'N/A'}</div>
                  <small>{req.email || 'N/A'}</small>
                </td>
                <td>
                  <span className="document-type">
                    {getDocumentTypeIcon(req.id_type)} {req.id_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                  </span>
                </td>
                <td><code>{req.id_number || 'N/A'}</code></td>
                <td>{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>{getStatusBadge(req.status)}</td>
                <td className="actions">
                  <button 
                    className="btn-info btn-sm" 
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowDetailsModal(true);
                    }}
                    title="View Details"
                  >
                    <FaEye /> View
                  </button>
                  {req.status === 'pending' && (
                    <>
                      <button 
                        className="btn-success btn-sm" 
                        onClick={() => verifyKYC(req.id, 'approved')}
                        disabled={verifying}
                        title="Approve"
                      >
                        <FaCheckCircle /> Approve
                      </button>
                      <button 
                        className="btn-danger btn-sm" 
                        onClick={() => verifyKYC(req.id, 'rejected')}
                        disabled={verifying}
                        title="Reject"
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">
                  {searchTerm ? 'No KYC requests match your search' : 'No KYC requests found on Roamsmart'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* KYC Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowDetailsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content kyc-details-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              
              <h3><FaUserCheck /> KYC Details - {COMPANY.name}</h3>
              
              <div className="kyc-details-grid">
                <div className="detail-item">
                  <label>Username:</label>
                  <span>{selectedRequest.username || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Full Name:</label>
                  <span>{selectedRequest.full_name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedRequest.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{selectedRequest.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Document Type:</label>
                  <span>{selectedRequest.id_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Document Number:</label>
                  <span><code>{selectedRequest.id_number || 'N/A'}</code></span>
                </div>
                <div className="detail-item">
                  <label>Submitted Date:</label>
                  <span>{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedRequest.status)}</span>
                </div>
              </div>

              {selectedRequest.document_url && (
                <div className="document-preview">
                  <h4>Document Preview</h4>
                  <button 
                    className="btn-outline btn-sm" 
                    onClick={() => viewDocument(selectedRequest.document_url)}
                  >
                    <FaEye /> View Full Document
                  </button>
                  <div className="document-note">
                    <small>Please verify that the document is valid and matches the user's information.</small>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="modal-actions">
                  <button 
                    className="btn-success" 
                    onClick={() => {
                      verifyKYC(selectedRequest.id, 'approved');
                      setShowDetailsModal(false);
                    }}
                    disabled={verifying}
                  >
                    <FaCheckCircle /> Approve KYC
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => {
                      verifyKYC(selectedRequest.id, 'rejected');
                      setShowDetailsModal(false);
                    }}
                    disabled={verifying}
                  >
                    <FaTimesCircle /> Reject KYC
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}