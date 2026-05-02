// src/pages/ProductsPricing.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaSave, FaDollarSign } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProductsPricing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editMarkup, setEditMarkup] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/agent/products');
      setProducts(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkup = async (productId, markup) => {
    try {
      await api.put(`/agent/products/${productId}/markup`, { markup });
      toast.success('Price updated');
      fetchProducts();
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const bulkUpdateMarkup = async (percentage) => {
    try {
      await api.post('/agent/products/bulk-markup', { percentage });
      toast.success(`All prices ${percentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentage)}%`);
      fetchProducts();
    } catch (error) {
      toast.error('Bulk update failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <motion.div className="products-pricing-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1><FaDollarSign /> Products & Pricing</h1>
        <p>Set your selling prices (markup from wholesale)</p>
      </div>

      <div className="bulk-actions">
        <button className="btn-outline" onClick={() => bulkUpdateMarkup(5)}>+5% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdateMarkup(10)}>+10% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdateMarkup(15)}>+15% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdateMarkup(-5)}>-5% on all</button>
      </div>

      <div className="products-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Network</th>
              <th>Size</th>
              <th>Wholesale (GHS)</th>
              <th>Your Markup (%)</th>
              <th>Your Price (GHS)</th>
              <th>Profit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>Data Bundle</td>
                <td>{product.network?.toUpperCase()}</td>
                <td>{product.size_gb}GB</td>
                <td>₵{product.wholesale_price}</td>
                <td>
                  {editingId === product.id ? (
                    <input 
                      type="number" 
                      value={editMarkup}
                      onChange={(e) => setEditMarkup(parseInt(e.target.value))}
                      className="markup-input"
                      min="0"
                      max="100"
                    />
                  ) : (
                    <span>{product.markup || 0}%</span>
                  )}
                </td>
                <td className="selling-price">
                  ₵{(product.wholesale_price * (1 + (product.markup || 0) / 100)).toFixed(2)}
                </td>
                <td className="profit">
                  ₵{(product.wholesale_price * (product.markup || 0) / 100).toFixed(2)}
                </td>
                <td>
                  {editingId === product.id ? (
                    <button className="btn-success btn-sm" onClick={() => updateMarkup(product.id, editMarkup)}>
                      <FaSave />
                    </button>
                  ) : (
                    <button className="btn-info btn-sm" onClick={() => {
                      setEditingId(product.id);
                      setEditMarkup(product.markup || 0);
                    }}>
                      <FaEdit />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}