import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RisXqQolEPrI6lJt1ajlwWctoUVrtwIKNcCieGCBw1XdWt3smFV4HSZfpJ5WIbn9HkcgFqEoNeR1SCnMD3Pu2AV00Gbv7bbfv');

const API_URL = 'http://localhost:8000/api';

function PaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMessage('');
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });
    console.log('stripe.confirmPayment result:', { error, paymentIntent });
    if (error) {
      setErrorMessage(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setErrorMessage('Payment was not successful.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <PaymentElement />
      {errorMessage && <div style={{ color: 'red', marginTop: 12 }}>{errorMessage}</div>}
      <button type="submit" disabled={!stripe || loading} style={{ marginTop: 16, width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, padding: '1rem', fontWeight: 600, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

function CheckoutPage() {
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    const selectedAddress = localStorage.getItem('selectedShippingAddress');
    if (!selectedAddress) {
      setError('No shipping address selected.');
      return;
    }
    setOrderLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // 1. Create the order
      const response = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipping_address: selectedAddress })
      });
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      const orderData = await response.json();
      const orderId = orderData.id;

      const checkoutResponse = await fetch(`${API_URL}/orders/${orderId}/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await checkoutResponse.json();
      console.log(data);
      if (!checkoutResponse.ok) {
        throw new Error('Failed to initiate checkout');
      }

      setClientSecret(data.client_secret || data.clientSecret);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-page" style={{maxWidth: 500, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.07)', padding: '2rem', border: '1px solid #e2e8f0'}}>
        <h2 style={{marginBottom: '1.5rem'}}>Payment Successful!</h2>
        <p>Thank you for your order. You will be redirected soon.</p>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{maxWidth: 500, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.07)', padding: '2rem', border: '1px solid #e2e8f0'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Order Summary</h2>
      <div style={{marginBottom: '2rem'}}>
        <p>Review your order and shipping information before placing your order.</p>
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm clientSecret={clientSecret} onSuccess={() => {
            setOrderSuccess(true);
            setTimeout(() => {
              localStorage.removeItem('selectedShippingAddress');
              navigate('/');
            }, 2000);
          }} />
        </Elements>
      ) : (
        <button
          style={{width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, padding: '1rem', fontWeight: 600, fontSize: '1.1rem', cursor: orderLoading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px'}}
          onClick={handlePlaceOrder}
          disabled={orderLoading}
        >
          {orderLoading ? 'Placing Order...' : 'Place Order'}
        </button>
      )}
    </div>
  );
}

export default CheckoutPage;
