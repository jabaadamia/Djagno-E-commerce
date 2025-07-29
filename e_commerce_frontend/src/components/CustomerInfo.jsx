import React, { useState, useEffect } from 'react';
import '../styles/CustomerInfo.css';
import { updateCustomerProfile } from '../services/api';
import { getCustomerAddresses, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from '../services/api';

function CustomerInfo({ customerData }) {
  const {
    date_of_birth: initialDateOfBirth,
    user: {
      username,
      phone_number: initialPhoneNumber,
      profile_picture: initialProfilePicture,
      email: initialEmail
    }
  } = customerData;

  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture);
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editAddress, setEditAddress] = useState({ street: '', city: '', state: '', country: '', postal_code: '' });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);
        setAddressError('');
        const data = await getCustomerAddresses(username);
        setAddresses(data);
      } catch (err) {
        setAddressError('Failed to load addresses');
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [username]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      document.getElementById('customer-profile-upload').click();
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError('');
    try {
      await addCustomerAddress(username, newAddress);
      setShowAddressForm(false);
      setNewAddress({ street: '', city: '', state: '', country: '', postal_code: '' });

      const data = await getCustomerAddresses(username);
      setAddresses(data);
    } catch (err) {
      setAddressError('Failed to add address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleEditClick = (addr) => {
    setEditingAddressId(addr.id);
    setEditAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      postal_code: addr.postal_code
    });
  };

  const handleEditAddressInputChange = (e) => {
    const { name, value } = e.target;
    setEditAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError('');
    try {
      await updateCustomerAddress(username, editingAddressId, editAddress);
      setEditingAddressId(null);

      const data = await getCustomerAddresses(username);
      setAddresses(data);
    } catch (err) {
      setAddressError('Failed to update address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setAddressLoading(true);
    setAddressError('');
    try {
      await deleteCustomerAddress(username, id);
      // Refresh address list
      const data = await getCustomerAddresses(username);
      setAddresses(data);
    } catch (err) {
      setAddressError('Failed to delete address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedCustomerData = {
      date_of_birth: dateOfBirth
    };

    const updatedUserData = {
      phone_number: phoneNumber,
      email: email
    };

    try {
      await updateCustomerProfile(username, updatedCustomerData, updatedUserData, imageFile);
      console.log('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }

    setIsEditing(false);
  };

  return (
    <>
      <div className="customer-info">
        <div className="customer-info__avatar" style={{position: 'relative'}}>
          <img
            src={profilePicture}
            alt="Profile"
            className={`customer-info__image${isEditing ? ' customer-info__image--editable' : ''}`}
            onClick={handleImageClick}
            tabIndex={isEditing ? 0 : -1}
            style={{cursor: isEditing ? 'pointer' : 'default'}}
          />
          {isEditing && (
            <>
              <input
                id="customer-profile-upload"
                type="file"
                className="customer-info__file-input"
                accept="image/*"
                onChange={handleFileChange}
                style={{display: 'none'}}
              />
              <div className="customer-info__avatar-overlay" onClick={handleImageClick}>
                <span>Change Photo</span>
              </div>
            </>
          )}
        </div>
        <p className="customer-info__username">@{username}</p>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                className="customer-info__input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="customer-info__input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="customer-info__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="customer-info__save-button">Save</button>
          </form>
        ) : (
          <>
            <div className="customer-info__date-of-birth">{dateOfBirth || "Date of birth not provided"}</div>
            <div className="customer-info__phone">{phoneNumber || "Phone not provided"}</div>
            <div className="customer-info__email">{email || "Email not provided"}</div>
            <button
              type="button"
              className="customer-info__edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          </>
        )}
      </div>

      <div className="customer-addresses-card">
        <h3 style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
          Addresses
          {!showAddressForm && (
            <button
              className="address-icon-btn"
              title="Add Address"
              onClick={() => setShowAddressForm(true)}
              style={{marginLeft: 'auto'}}
            >
              <span role="img" aria-label="Add">➕</span>
            </button>
          )}
        </h3>
        {addressLoading && <p>Loading addresses...</p>}
        {addressError && <p style={{color: 'red'}}>{addressError}</p>}
        <ul className="address-list">
          {((Array.isArray(addresses) ? addresses : addresses?.results || []).length === 0 && !addressLoading) && <li>No addresses found.</li>}
          {(Array.isArray(addresses) ? addresses : addresses?.results || []).map(addr => (
            <li key={addr.id} className="address-list-item">
              {editingAddressId === addr.id ? (
                <form onSubmit={handleUpdateAddress} className="address-edit-form">
                  <input name="street" value={editAddress.street} onChange={handleEditAddressInputChange} required placeholder="Street" />
                  <input name="city" value={editAddress.city} onChange={handleEditAddressInputChange} required placeholder="City" />
                  <input name="state" value={editAddress.state} onChange={handleEditAddressInputChange} required placeholder="State" />
                  <input name="country" value={editAddress.country} onChange={handleEditAddressInputChange} required placeholder="Country" />
                  <input name="postal_code" value={editAddress.postal_code} onChange={handleEditAddressInputChange} required placeholder="Postal" />
                  <button type="submit" className="address-icon-btn" title="Save" disabled={addressLoading}>
                    <span role="img" aria-label="Save">💾</span>
                  </button>
                  <button type="button" className="address-icon-btn" title="Cancel" onClick={() => setEditingAddressId(null)}>
                    <span role="img" aria-label="Cancel">❌</span>
                  </button>
                </form>
              ) : (
                <>
                  <span className="address-text">{addr.street}, {addr.city}, {addr.state}, {addr.country}, {addr.postal_code}</span>
                  <button type="button" className="address-icon-btn" title="Edit" onClick={() => handleEditClick(addr)}>
                    <span role="img" aria-label="Edit">✏️</span>
                  </button>
                  <button type="button" className="address-icon-btn" title="Delete" onClick={() => handleDeleteAddress(addr.id)}>
                    <span role="img" aria-label="Delete">❌</span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="address-add-form">
            <input name="street" value={newAddress.street} onChange={handleAddressInputChange} required placeholder="Street" />
            <input name="city" value={newAddress.city} onChange={handleAddressInputChange} required placeholder="City" />
            <input name="state" value={newAddress.state} onChange={handleAddressInputChange} required placeholder="State" />
            <input name="country" value={newAddress.country} onChange={handleAddressInputChange} required placeholder="Country" />
            <input name="postal_code" value={newAddress.postal_code} onChange={handleAddressInputChange} required placeholder="Postal" />
            <button type="submit" className="address-icon-btn" title="Add" disabled={addressLoading}>
              <span role="img" aria-label="Add">➕</span>
            </button>
            <button type="button" className="address-icon-btn" title="Cancel" onClick={() => setShowAddressForm(false)}>
              <span role="img" aria-label="Cancel">❌</span>
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default CustomerInfo;
