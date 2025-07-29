import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, addToCart } from './services/api';
import ImageSlider from './components/ImageSlider';
import './styles/common.css';
import './styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      await addToCart(product.id);
      // You might want to show a success message or update the cart count
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail">
      <Link to="/" className="back-link">
        ← Back to Products
      </Link>
      <div className="product-layout">
        <div>
          <h1 className="product-title">{product.name}</h1>
          <ImageSlider images={product.images} />
        </div>

        <div className="product-info">
          <p className="product-price">${product.price}</p>
          <div className="product-details">
            <div>
              <div className="detail-label">Description</div>
              <div className="detail-value">{product.description}</div>
            </div>
            <div>
              <div className="detail-label">Available Quantity</div>
              <div className="detail-value">{product.available_quantity}</div>
            </div>
            <div>
              <div className="detail-label">Seller</div>
              <div className="detail-value">{product.seller}</div>
            </div>
            <div>
              <div className="detail-label">Categories</div>
              <div className="categories">
                {product.categories.map((category, index) => (
                  <span key={index} className="category-tag">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={addingToCart || product.available_quantity === 0}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
