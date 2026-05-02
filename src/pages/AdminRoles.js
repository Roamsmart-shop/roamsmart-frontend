// src/pages/AdminRoles.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company email domain for validation
const COMPANY_DOMAIN = '@roamsmart.shop';

export default function AdminRoles() {
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'admin' });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    const res = await api.get('/admin/admins');
    setAdmins(res.data.data || []);
  };

  const addAdmin = async () => {
    if (!newAdmin.email) return toast.error('Enter email');
    // Optional: Validate email domain
    if (!newAdmin.email.includes(COMPANY_DOMAIN) && newAdmin.role === 'super_admin') {
      toast.warning(`Super admin should use ${COMPANY_DOMAIN} email`);
    }
    await api.post('/admin/admins', newAdmin);
    toast.success('Admin added to Roamsmart');
    fetchAdmins();
    setNewAdmin({ email: '', role: 'admin' });
  };

  const removeAdmin = async (id) => {
    await api.delete(`/admin/admins/${id}`);
    toast.success('Admin removed from Roamsmart');
    fetchAdmins();
  };

  return (
    <motion.div className="admin-page">
      <h1>Admin Roles - Roamsmart Digital Service</h1>
      <div>
        <input 
          placeholder="Email" 
          value={newAdmin.email} 
          onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
        />
        <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button onClick={addAdmin}>Add Admin</button>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Email</th><th>Role</th><th>Added</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id}>
              <td>{admin.email}</td>
              <td>{admin.role}</td>
              <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}</td>
              <td><button className="btn-danger" onClick={() => removeAdmin(admin.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}