import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct, deleteProduct, getCategories } from '../services/api';
import ImageSlider from './ImageSlider';
import '../styles/common.css';
import '../styles/ProductDetail.css';

function SellerProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        setProduct(data);
        setEditForm({
          name: data.name,
          description: data.description,
          price: data.price,
          available_quantity: data.available_quantity,
          categories: data.categories,
          images: data.images
        });
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setAllCategories(cats.results || []);
      } catch (err) {
        // ignore
      }
    };
    const fetchEarnings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/sellers/product-earnings/?product_id=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEarnings(data.total_earnings || 0);
        } else {
          setEarnings(null);
        }
      } catch (err) {
        setEarnings(null);
      }
    };
    fetchProduct();
    fetchCategories();
    fetchEarnings();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === 'categories') {
      const selected = Array.from(e.target.selectedOptions, option => option.value);
      setEditForm(prev => ({ ...prev, categories: selected }));
    } else if (name === 'images') {
      setEditForm(prev => ({ ...prev, images: Array.from(files) }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    console.log(editForm);
    try {
      // Only include changed fields
      const changedFields = {};
      for (const key of Object.keys(editForm)) {
        if (key === 'images') {
          if (
            (Array.isArray(editForm.images) && editForm.images.length > 0 && editForm.images[0] instanceof File) ||
            (Array.isArray(editForm.images) && editForm.images.length !== (product.images?.length || 0))
          ) {
            changedFields.images = editForm.images;
          }
        } else if (key === 'categories' && JSON.stringify(editForm.categories) !== JSON.stringify(product.categories)) {
          // convert selected ids to names
          const selectedNames = (editForm.categories || []).map(catId => {
            const found = allCategories.find(c => String(c.id) === String(catId));
            return found ? found.name : catId;
          });
          changedFields.categories = selectedNames;
        } else if (JSON.stringify(editForm[key]) !== JSON.stringify(product[key])) {
          changedFields[key] = editForm[key];
        }
      }
      if (Object.keys(changedFields).length === 0) {
        setSuccessMsg('No changes to save.');
        setIsEditing(false);
        setSaving(false);
        return;
      }
      const updated = await updateProduct(id, changedFields);
      setProduct(updated);
      setSuccessMsg('Product updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      available_quantity: product.available_quantity,
      categories: product.categories,
      images: product.images
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDelete(true);
    setError(null);
    setSuccessMsg('');
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    setSuccessMsg('');
    try {
      await deleteProduct(id);
      setDeleteMsg('Product deleted successfully.');
      setTimeout(() => {
        navigate('/seller/profile');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="seller-product-detail-page">
      <Link to="/seller/profile" className="back-link">
        ← Back to Profile
      </Link>
      <div className="seller-product-layout">
        <div className="seller-product-main-card">
          <h1 className="product-title">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                className="product-edit-input"
              />
            ) : (
              product.name
            )}
          </h1>
          <ImageSlider images={isEditing ? (Array.isArray(editForm.images) ? editForm.images : []) : product.images} />
          {isEditing && (
            <div style={{marginTop: '10px'}}>
              <label style={{fontWeight: 500}}>Change Images:</label>
              <input type="file" name="images" multiple accept="image/*" onChange={handleEditChange} />
            </div>
          )}
          <div className="product-info">
            {successMsg && <div className="success-message" style={{margin:'10px 0'}}>{successMsg}</div>}
            <div className="product-details">
              <div>
                <div className="detail-label">Description</div>
                <div className="detail-value">
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="product-edit-input"
                      rows={3}
                    />
                  ) : (
                    product.description
                  )}
                </div>
              </div>
              <div>
                <div className="detail-label">Price</div>
                <div className="detail-value">
                  {isEditing ? (
                    <input
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      className="product-edit-input"
                    />
                  ) : (
                    `$${Number(product.price).toFixed(2)}`
                  )}
                </div>
              </div>
              <div>
                <div className="detail-label">Available Quantity</div>
                <div className="detail-value">
                  {isEditing ? (
                    <input
                      type="number"
                      name="available_quantity"
                      value={editForm.available_quantity}
                      onChange={handleEditChange}
                      className="product-edit-input"
                    />
                  ) : (
                    product.available_quantity
                  )}
                </div>
              </div>
              <div>
                <div className="detail-label">Categories</div>
                <div className="detail-value">
                  {isEditing ? (
                    <select
                      name="categories"
                      multiple
                      value={editForm.categories}
                      onChange={handleEditChange}
                      className="category-select"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="categories">
                      {product.categories.map((category, index) => (
                        <span key={index} className="category-tag">
                          {typeof category === 'string' ? category : (category.name || category.id)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {deleteMsg && <div className="success-message" style={{margin:'10px 0'}}>{deleteMsg}</div>}
            <div style={{marginTop: '18px', display: 'flex', gap: '12px'}}>
              {isEditing ? (
                <>
                   <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                   <button className="btn" style={{background:'#aaa'}} onClick={handleCancel} disabled={saving}>Cancel</button>
                </>
              ) : (
                <>
                   <button className="btn" onClick={() => setIsEditing(true)}>Edit</button>
                   <button className="btn" style={{background:'#d32f2f'}} onClick={handleDelete} disabled={deleting}>Delete</button>
                </>
              )}
            </div>
            {showDelete && (
              <div style={{marginTop:'16px', background:'#fff3f3', border:'1px solid #d32f2f', borderRadius:'6px', padding:'12px'}}>
                <div style={{color:'#d32f2f', fontWeight:600, marginBottom:'8px'}}>Are you sure you want to delete this product?</div>
                 <button className="btn" style={{background:'#d32f2f', marginRight:'10px'}} onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Yes, Delete'}</button>
                 <button className="btn" style={{background:'#aaa'}} onClick={()=>setShowDelete(false)} disabled={deleting}>Cancel</button>
              </div>
            )}
          </div>
        </div>
        <div className="seller-product-earnings-card">
          <h2 className="earnings-title">Earnings</h2>
          <div className="earnings-value">
            {earnings !== null ? <span>${Number(earnings).toFixed(2)}</span> : <span style={{color:'#888'}}>N/A</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerProductDetail;
