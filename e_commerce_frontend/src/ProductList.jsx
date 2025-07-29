import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FilterBar from './components/FilterBar';
import { getProducts } from './services/api';
import './styles/common.css';
import './styles/ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    min_price: '',
    max_price: '',
    ordering: ''
  });

  const fetchProducts = async (currentFilters) => {
    try {
      setLoading(true);
      const data = await getProducts(currentFilters);
      setProducts(data.results);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(filters);
  }, []);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchProducts(newFilters); // pass newFilters directly to fetchProducts
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="products-page-layout">
      <FilterBar
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
      <div className="products-container">
        <div className="products-grid">
          {products.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="product-card">
              <img src={product.images[0]?.image} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${Number(product.price).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductList;
