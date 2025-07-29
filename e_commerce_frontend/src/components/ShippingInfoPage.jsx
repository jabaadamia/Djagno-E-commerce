import React, { useEffect, useState } from 'react';
import { getCustomerProfile, getCustomerAddresses, addCustomerAddress } from '../services/api';
import { useNavigate } from 'react-router-dom';

function ShippingInfoPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', country: '', postal_code: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError('');
        const profile = await getCustomerProfile();
        setUsername(profile.user.username);
        const data = await getCustomerAddresses(profile.user.username);
        const addrArr = Array.isArray(data) ? data : data.results || [];
        setAddresses(addrArr);
        if (addrArr.length > 0) setSelectedAddress(addrArr[0].id);
      } catch (err) {
        setError('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addCustomerAddress(username, newAddress);
      setShowAddressForm(false);
      setNewAddress({ street: '', city: '', state: '', country: '', postal_code: '' });
      // Refresh address list
      const data = await getCustomerAddresses(username);
      const addrArr = Array.isArray(data) ? data : data.results || [];
      setAddresses(addrArr);
      if (addrArr.length > 0) setSelectedAddress(addrArr[addrArr.length - 1].id);
    } catch (err) {
      setError('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedAddress) return;
    localStorage.setItem('selectedShippingAddress', selectedAddress);
    navigate('/checkout');
  };

  return (
    <div className="checkout-page" style={{maxWidth: 500, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.07)', padding: '2rem', border: '1px solid #e2e8f0'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Shipping Information</h2>
      {loading && <p>Loading addresses...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul style={{listStyle: 'none', padding: 0, marginBottom: '1.5rem'}}>
        {addresses.map(addr => (
          <li key={addr.id} style={{marginBottom: '0.7rem', display: 'flex', alignItems: 'center'}}>
            <input
              type="radio"
              name="address"
              value={addr.id}
              checked={selectedAddress === addr.id}
              onChange={() => setSelectedAddress(addr.id)}
              style={{marginRight: '0.7rem'}}
            />
            <span>{addr.street}, {addr.city}, {addr.state}, {addr.country}, {addr.postal_code}</span>
          </li>
        ))}
      </ul>
      {showAddressForm ? (
        <form onSubmit={handleAddAddress} style={{marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          <input name="street" value={newAddress.street} onChange={handleAddressInputChange} required placeholder="Street" />
          <input name="city" value={newAddress.city} onChange={handleAddressInputChange} required placeholder="City" />
          <input name="state" value={newAddress.state} onChange={handleAddressInputChange} required placeholder="State" />
          <input name="country" value={newAddress.country} onChange={handleAddressInputChange} required placeholder="Country" />
          <input name="postal_code" value={newAddress.postal_code} onChange={handleAddressInputChange} required placeholder="Postal" />
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button type="submit" style={{flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem', fontWeight: 600, cursor: 'pointer'}}>Add</button>
            <button type="button" style={{flex: 1, background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '0.7rem', fontWeight: 600, cursor: 'pointer'}} onClick={() => setShowAddressForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAddressForm(true)} style={{marginBottom: '1.5rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 600, cursor: 'pointer'}}>Add New Address</button>
      )}
      <button
        onClick={handleProceed}
        disabled={!selectedAddress}
        style={{width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, padding: '1rem', fontWeight: 600, fontSize: '1.1rem', cursor: selectedAddress ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.5px'}}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}

export default ShippingInfoPage;
