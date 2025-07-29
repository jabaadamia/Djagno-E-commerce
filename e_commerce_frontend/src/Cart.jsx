import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/common.css';
import './styles/Cart.css';
import { getCart, updateCartQuantity } from './services/api';

function Cart() {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/cart/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cart');
        }

        const cartData = await response.json();
        setCart(cartData);

        // Fetch product details for each item in the cart
        const productPromises = cartData.items.map(item =>
          fetch(`http://localhost:8000/api/products/${item.product}/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.json())
        );

        const productData = await Promise.all(productPromises);
        const productMap = {};
        productData.forEach(product => {
          productMap[product.id] = product;
        });
        setProducts(productMap);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      await updateCartQuantity(productId, newQuantity);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/cart/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const cartData = await response.json();
      setCart(cartData);

      const productPromises = cartData.items.map(item =>
        fetch(`http://localhost:8000/api/products/${item.product}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json())
      );

      const productData = await Promise.all(productPromises);
      const productMap = {};
      productData.forEach(product => {
        productMap[product.id] = product;
      });
      setProducts(productMap);

    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/cart/remove_item/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const cartResponse = await fetch('http://localhost:8000/api/cart/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart');
      }

      const cartData = await cartResponse.json();
      setCart(cartData);

      // Refresh product details
      const productPromises = cartData.items.map(item =>
        fetch(`http://localhost:8000/api/products/${item.product}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json())
      );

      const productData = await Promise.all(productPromises);
      const productMap = {};
      productData.forEach(product => {
        productMap[product.id] = product;
      });
      setProducts(productMap);

    } catch (err) {
      console.error('Error removing item:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty-cart">
          <h2 className="cart-title">Your Cart is Empty</h2>
          <p className="empty-cart-message">Add some products to your cart to see them here.</p>
          <Link to="/" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container">
        <div className="empty-cart">
          <h2 className="cart-title">Your Cart is Empty</h2>
          <p className="empty-cart-message">Add some products to your cart to see them here.</p>
          <Link to="/" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => {
    const product = products[item.product];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <div className="container">
      <div className="cart-container">
        <h1 className="cart-title">Shopping Cart</h1>
        <div className="cart-items">
          {cart.items.map(item => {
            const product = products[item.product];
            if (!product) return null;

            return (
              <div key={item.id} className="cart-item">
                {product.images[0] && (
                  <img
                    src={product.images[0].image}
                    alt={product.name}
                    className="cart-item-image"
                  />
                )}
                <div className="cart-item-details">
                  <Link to={`/product/${product.id}`} className="cart-item-name">
                    {product.name}
                  </Link>
                  <p className="cart-item-price">${product.price}</p>
                  <div className="quantity-controls">
                    <button
                      className="quantity-button"
                      onClick={() => handleQuantityChange(product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      className="quantity-button"
                      onClick={() => handleQuantityChange(product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveItem(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="checkout-button"
            style={{marginTop: '1.5rem', width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px'}}
            onClick={() => navigate('/shipping-info')}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
