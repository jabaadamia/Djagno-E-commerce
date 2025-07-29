import React, { useEffect, useState } from 'react';
import '../styles/CustomerOrders.css';
import { Link } from 'react-router-dom';

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [productImages, setProductImages] = useState({}); // { productId: imageUrl }

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/customers/orders/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
        // After orders are fetched, get unique product IDs
        const productIds = Array.from(new Set(data.flatMap(order => order.items.map(item => item.product))));
        // Fetch product details in parallel
        const productFetches = productIds.map(async (id) => {
          try {
            const res = await fetch(`http://localhost:8000/api/products/${id}`);
            if (!res.ok) throw new Error();
            const prod = await res.json();
            // Fix: images is an array of objects, use images[0].image
            let imageUrl = '';
            if (prod.images && prod.images.length > 0 && prod.images[0].image) imageUrl = prod.images[0].image;
            else if (prod.image) imageUrl = prod.image;
            return [id, imageUrl];
          } catch {
            return [id, ''];
          }
        });
        const imagesArr = await Promise.all(productFetches);
        const imagesMap = Object.fromEntries(imagesArr);
        setProductImages(imagesMap);
      } catch (err) {
        setOrdersError(err.message || 'Failed to fetch orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="customer-orders-container">
      <h2 className="customer-orders-title">Your Orders</h2>
      {ordersLoading ? (
        <p className="customer-orders-loading">Loading orders...</p>
      ) : ordersError ? (
        <p className="customer-orders-error">{ordersError}</p>
      ) : orders.length === 0 ? (
        <p className="customer-orders-empty">No orders found.</p>
      ) : (
        <div className="customer-orders-table-wrapper">
          <table className="customer-orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${Number(order.total_amount).toFixed(2)}</td>
                  <td><span className={`order-status order-status-${order.status}`}>{order.status}</span></td>
                  <td>{order.payment_status}</td>
                  <td>
                    <ul className="customer-orders-items-list">
                      {order.items.map(item => (
                        <li key={item.id} className="customer-orders-item">
                          <Link to={`/product/${item.product}`} className="customer-orders-item-link">
                            <div className="customer-orders-item-img-wrap">
                              <img
                                className="customer-orders-item-img"
                                src={productImages[item.product] || '/placeholder-product.png'}
                                alt={item.product_name}
                                onError={e => { e.target.src = '/placeholder-product.png'; }}
                              />
                            </div>
                            <div className="customer-orders-item-info">
                              <div className="customer-orders-item-name"><b>{item.product_name}</b></div>
                              <div className="customer-orders-item-meta">
                                Quantity: {item.quantity} &nbsp;|&nbsp; ${Number(item.price_at_time).toFixed(2)}
                              </div>
                              <div className="customer-orders-item-seller">Seller: {item.seller_name}</div>
                              <div className="customer-orders-item-ship">
                                Ship: {item.shipping_address ? `${item.shipping_address.street}, ${item.shipping_address.city}, ${item.shipping_address.state}, ${item.shipping_address.country}, ${item.shipping_address.postal_code}` : 'N/A'}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
