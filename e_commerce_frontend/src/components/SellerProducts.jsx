import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProducts } from '../services/api';
import '../styles/ProductList.css';

function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getMyProducts();
        setProducts(data.results || []);
      } catch (err) {
        setError('Failed to fetch your products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="product-list">
      <h3 style={{marginBottom: '10px'}}>My Products</h3>
      <div className="products-grid">
        {products.length === 0 ? (
          <div style={{padding: '1rem', color: '#888'}}>No products found.</div>
        ) : (
          products.map((product) => (
            <Link to={`/seller/product-details/${product.id}`} key={product.id} className="product-card">
              <img src={product.images[0]?.image} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${Number(product.price).toFixed(2)}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default SellerProducts;
