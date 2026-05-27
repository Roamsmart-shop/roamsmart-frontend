// src/pages/ProductsPricing.js - No Commission/Profit, Only Actual Prices
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaSave, FaDollarSign, FaDatabase } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProductsPricing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (productId, price) => {
    try {
      await api.put(`/admin/products/${productId}/price`, { price });
      toast.success('Price updated successfully');
      fetchProducts();
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const bulkUpdatePrices = async (percentage) => {
    try {
      await api.post('/admin/products/bulk-price', { percentage });
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
        <h1><FaDatabase /> Products & Pricing</h1>
        <p>Manage data bundle prices on Roamsmart</p>
      </div>

      <div className="bulk-actions">
        <button className="btn-outline" onClick={() => bulkUpdatePrices(5)}>+5% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdatePrices(10)}>+10% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdatePrices(15)}>+15% on all</button>
        <button className="btn-outline" onClick={() => bulkUpdatePrices(-5)}>-5% on all</button>
      </div>

      <div className="products-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Network</th>
              <th>Size</th>
              <th>Selling Price (GHS)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>Data Bundle</td>
                <td>{product.network?.toUpperCase()}</td>
                <td>{product.size_gb}GB</td>
                <td>
                  {editingId === product.id ? (
                    <input 
                      type="number" 
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                      className="price-input"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="selling-price">₵{product.price?.toFixed(2) || '0.00'}</span>
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <button className="btn-success btn-sm" onClick={() => updatePrice(product.id, editPrice)}>
                      <FaSave />
                    </button>
                  ) : (
                    <button className="btn-info btn-sm" onClick={() => {
                      setEditingId(product.id);
                      setEditPrice(product.price || 0);
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