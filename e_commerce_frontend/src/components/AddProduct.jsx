import React, { useEffect, useState } from 'react';
import { getCategories, createProduct } from '../services/api';
import '../styles/AddProduct.css';

function AddProduct() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    available_quantity: '',
    categories: [],
    images: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!localStorage.getItem('token')){
        setLoading(false);
        return;
      }
      try {
        const categories = await getCategories();
        setCategories(categories?.results || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === 'categories') {
      const selected = Array.from(e.target.selectedOptions, option => option.value);
      setForm(prev => ({ ...prev, categories: selected }));
    } else if (name === 'images') {
      setForm(prev => ({ ...prev, images: Array.from(files) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await createProduct(form, categories);
      setMessage('Product created successfully!');
      setForm({
        name: '',
        description: '',
        price: '',
        available_quantity: '',
        categories: [],
        images: []
      });
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="add-product-inline-container">
      <button
        className="add-product-fab inline"
        onClick={() => setShowForm((v) => !v)}
        aria-label="Add Product"
        style={{marginBottom: '12px'}}
      >
        +
      </button>
      {showForm && (
        <form className="add-product-form styled compact" onSubmit={handleSubmit}>
          <h3 style={{marginTop: 0}}>Add Product</h3>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={2} />
          </div>
          <div className="form-group">
            <label>Price:</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>Available Quantity:</label>
            <input type="number" name="available_quantity" value={form.available_quantity} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label>Categories:</label>
            <select name="categories" multiple value={form.categories} onChange={handleChange} className="category-select">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Images:</label>
            <input type="file" name="images" multiple accept="image/*" onChange={handleChange} />
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Add Product'}</button>
        </form>
      )}
    </div>
  );
}

export default AddProduct;
