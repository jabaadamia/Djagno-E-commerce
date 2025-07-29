import React, { useEffect, useState } from 'react';
import '../styles/SellerDashboard.css';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';


function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [chartMode, setChartMode] = useState('payouts');

  useEffect(() => {
    const fetchEarnings = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/sellers/total-earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch earnings');
      const data = await response.json();
      setEarnings(data.total_earnings);
    }
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/sellers/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    fetchEarnings();
  }, []);

  // Helper to group payouts by date
  const getPayoutsByDate = () => {
    const payoutsMap = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!payoutsMap[date]) {
        payoutsMap[date] = 0;
      }
      payoutsMap[date] += Number(order.seller_payout_amount);
    });

    return Object.entries(payoutsMap)
      .map(([date, payout]) => ({ date, payout: Number(payout.toFixed(2)) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getOrdersCountByDate = () => {
    const ordersMap = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!ordersMap[date]) {
        ordersMap[date] = 0;
      }
      ordersMap[date] += 1;
    });
    return Object.entries(ordersMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const statusOptions = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'refunded': return 'status-refunded';
      default: return '';
    }
  };

  // Track status edits and loading state for each order
  const [statusEdits, setStatusEdits] = useState({});
  const [statusLoading, setStatusLoading] = useState({});
  const [statusError, setStatusError] = useState({});
  const [statusSuccess, setStatusSuccess] = useState({});

  const handleStatusChange = (orderId, newStatus) => {
    setStatusEdits(prev => ({ ...prev, [orderId]: newStatus }));
  };

  const handleSaveStatus = async (order) => {
    const orderId = order.id;
    const newStatus = statusEdits[orderId] || order.seller_status;
    setStatusLoading(prev => ({ ...prev, [orderId]: true }));
    setStatusError(prev => ({ ...prev, [orderId]: null }));
    setStatusSuccess(prev => ({ ...prev, [orderId]: false }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/sellers/order-items/update-status/?order_item_id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seller_status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      // Update orders state locally
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, seller_status: newStatus } : o));
      setStatusSuccess(prev => ({ ...prev, [orderId]: true }));
    } catch (err) {
      setStatusError(prev => ({ ...prev, [orderId]: err.message || 'Failed to update status' }));
    } finally {
      setStatusLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="seller-dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="earnings-container">
        <h2 className="earnings-title">Total Earnings</h2>
        <p className="earnings-amount">${Number(earnings).toFixed(2)}</p>
      </div>
      {/* Payouts/Orders Over Time Chart with Switch */}
      <div className="payouts-chart-container" style={{ width: '100%', height: 340, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h2 className="chart-title" style={{ marginRight: 16 }}>
            {chartMode === 'payouts' ? 'Payouts Over Time' : 'Number of Orders Over Time'}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setChartMode('payouts')}
              style={{
                padding: '6px 16px',
                borderRadius: 4,
                border: chartMode === 'payouts' ? '2px solid #0088FE' : '1px solid #ccc',
                background: chartMode === 'payouts' ? '#e6f2fd' : '#fff',
                color: chartMode === 'payouts' ? '#0088FE' : '#333',
                cursor: 'pointer',
                fontWeight: chartMode === 'payouts' ? 'bold' : 'normal',
              }}
            >
              Payouts
            </button>
            <button
              onClick={() => setChartMode('orders')}
              style={{
                padding: '6px 16px',
                borderRadius: 4,
                border: chartMode === 'orders' ? '2px solid #0088FE' : '1px solid #ccc',
                background: chartMode === 'orders' ? '#e6f2fd' : '#fff',
                color: chartMode === 'orders' ? '#0088FE' : '#333',
                cursor: 'pointer',
                fontWeight: chartMode === 'orders' ? 'bold' : 'normal',
              }}
            >
              Orders
            </button>
          </div>
        </div>
        <ResponsiveContainer>
          {chartMode === 'payouts' ? (
            <LineChart data={getPayoutsByDate()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="payout" stroke="#0088FE" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <LineChart data={getOrdersCountByDate()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF8042" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <h1 className="dashboard-title">Orders</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payout</th>
                <th>Date</th>
                <th>Shipping Address</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="no-orders">No orders found.</td></tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td className="cell-product">{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td>${Number(order.price_at_time).toFixed(2)}</td>
                  <td>${Number(order.total_price).toFixed(2)}</td>
                  <td>
                  <span className={`status-dot ${getStatusColorClass(statusEdits[order.id] ?? order.seller_status)}`}></span>
                  <select
                    className={`status-select ${getStatusColorClass(statusEdits[order.id] ?? order.seller_status)}`}
                    value={statusEdits[order.id] ?? order.seller_status}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    disabled={statusLoading[order.id]}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    className="status-save-btn"
                    style={{ marginLeft: 8 }}
                    onClick={() => handleSaveStatus(order)}
                    disabled={statusLoading[order.id] || (statusEdits[order.id] ?? order.seller_status) === order.seller_status}
                  >
                    {statusLoading[order.id] ? 'Saving...' : 'Save'}
                  </button>
                  {statusSuccess[order.id] && <span style={{ color: 'green', marginLeft: 6 }}>✔</span>}
                  {statusError[order.id] && <span style={{ color: 'red', marginLeft: 6 }}>{statusError[order.id]}</span>}
                </td>
                  <td>${Number(order.seller_payout_amount).toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="cell-shipping">
                    {order.shipping_address ? (
                      <span>{order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.country}, {order.shipping_address.postal_code}</span>
                    ) : 'N/A'}
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

export default SellerDashboard;
