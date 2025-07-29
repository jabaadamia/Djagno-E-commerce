import React, { useEffect, useState } from 'react'
import { getSellerProfile } from './services/api';
import SellerInfo from './components/SellerInfo';
import AddProduct from './components/AddProduct';
import SellerProducts from './components/SellerProducts';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function SellerProfile() {
  const [sellerData, setSellerData] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const profile = await getSellerProfile();
        setSellerData(profile);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchSellerData();
  }, []);

  const handleConnectStripe = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sellers/connect-stripe/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.detail || 'Failed to connect to Stripe');
      }
      window.location.href = data.url;
    } catch (err) {
      setStripeError(err.message);
    } finally {
      setStripeLoading(false);
    }
  };

  if (!sellerData) return <p>Loading...</p>;

  return (
    <div style={{display: "flex", gap:"32px", alignItems: 'flex-start'}}>
      <div>
        <SellerInfo sellerData={sellerData}/>
        <button
          onClick={handleConnectStripe}
          disabled={stripeLoading}
          style={{
            marginTop: '18px',
            background: '#635bff',
            color: '#fff',
            padding: '0.5rem 1.2rem',
            borderRadius: '6px',
            fontWeight: 600,
            border: 'none',
            cursor: stripeLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            letterSpacing: '0.5px',
          }}
        >
          {stripeLoading ? 'Connecting to Stripe...' : 'Connect Stripe Account'}
        </button>
        {stripeError && <div style={{color: 'red', marginTop: 8}}>{stripeError}</div>}
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <Link to="/seller/dashboard" style={{
          display: 'inline-block',
          marginBottom: '18px',
          background: 'var(--primary-color)',
          color: '#fff',
          padding: '0.5rem 1.2rem',
          borderRadius: '6px',
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.5px',
        }}>Go to Dashboard</Link>
        <AddProduct />
        <SellerProducts />
      </div>
    </div>
  )
}

export default SellerProfile
