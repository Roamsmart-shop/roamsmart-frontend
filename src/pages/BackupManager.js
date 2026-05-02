// src/pages/BackupManager.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaCloudUploadAlt, FaDownload, FaTrash, FaUndo, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function BackupManager() {
  const [backups, setBackups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchBackups(); 
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/backups');
      setBackups(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load Roamsmart backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      await api.post('/admin/backup/create');
      toast.success(`${COMPANY.shortName} backup created successfully!`);
      await fetchBackups();
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId, filename) => {
    const result = await Swal.fire({
      title: 'Restore Backup?',
      html: `Are you sure you want to restore <strong>${filename}</strong>?<br/><br/>⚠️ This will replace all current ${COMPANY.shortName} data. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Restore Backup',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/backup/${backupId}/restore`);
        toast.success(`Backup restored successfully on ${COMPANY.shortName}!`);
        await fetchBackups();
      } catch (error) {
        toast.error('Failed to restore backup');
      }
    }
  };

  const downloadBackup = async (backupId, filename) => {
    try {
      const response = await api.get(`/admin/backup/${backupId}/download`, { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloading ${filename}`);
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId, filename) => {
    const result = await Swal.fire({
      title: 'Delete Backup?',
      text: `Are you sure you want to delete ${filename}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/backup/${backupId}`);
        toast.success('Backup deleted from Roamsmart');
        await fetchBackups();
      } catch (error) {
        toast.error('Failed to delete backup');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} backups...</p>
    </div>
  );

  return (
    <motion.div 
      className="admin-page backup-manager-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaDatabase /> Backup Manager</h1>
          <p>Manage database backups for {COMPANY.name}</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={createBackup} 
          disabled={creating}
        >
          {creating ? <FaSpinner className="spinning" /> : <FaCloudUploadAlt />}
          {creating ? ' Creating Backup...' : ' Create New Backup'}
        </button>
      </div>

      {/* Backup Info Card */}
      <div className="backup-info-card">
        <div className="info-content">
          <FaDatabase size={24} />
          <div>
            <h3>Backup Information</h3>
            <p>Backups include all {COMPANY.shortName} data: users, orders, transactions, and settings.</p>
            <p className="text-muted">Backups are stored securely and can be restored at any time.</p>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="backups-table-container">
        <h3>Available Backups</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Date Created</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(backup => (
                <tr key={backup.id}>
                  <td>
                    <FaDatabase className="backup-icon" />
                    <code>{backup.filename || 'Unknown'}</code>
                  </td>
                  <td>{formatFileSize(backup.size || 0)}</td>
                  <td>{backup.created_at ? new Date(backup.created_at).toLocaleString() : 'N/A'}</td>
                  <td>
                    <span className="backup-type-badge">
                      {backup.type || 'Full Backup'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-info btn-sm" 
                      onClick={() => downloadBackup(backup.id, backup.filename)}
                      title="Download"
                    >
                      <FaDownload /> Download
                    </button>
                    <button 
                      className="btn-warning btn-sm" 
                      onClick={() => restoreBackup(backup.id, backup.filename)}
                      title="Restore"
                    >
                      <FaUndo /> Restore
                    </button>
                    <button 
                      className="btn-danger btn-sm" 
                      onClick={() => deleteBackup(backup.id, backup.filename)}
                      title="Delete"
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No backups found for {COMPANY.shortName}. Click "Create New Backup" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Recommendations */}
      <div className="backup-recommendations">
        <h4>Recommendations</h4>
        <ul>
          <li>✓ Create backups before major system updates</li>
          <li>✓ Download important backups to local storage</li>
          <li>✓ Keep at least 7 days of backup history</li>
          <li>✓ Test backup restoration periodically</li>
        </ul>
      </div>
    </motion.div>
  );
}