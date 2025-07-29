import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/CustomerSignup.css';

function CustomerSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user: {
      username: '',
      password: '',
      phone_number: '',
      email: ''
    },
    date_of_birth: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('user.')) {
      const userField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [userField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create the request body for customer signup
      const requestBody = {
        date_of_birth: formData.date_of_birth,
        user: {
          password: formData.user.password,
          phone_number: formData.user.phone_number,
          username: formData.user.username,
          email: formData.user.email
        }
      };

      console.log('Sending customer data:', requestBody);

      const response = await fetch('http://localhost:8000/api/customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.detail || 'Failed to create customer account');
      }

      navigate('/login');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-signup">
      <h2>Create Customer Account</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="user.username"
            value={formData.user.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="user.password"
            value={formData.user.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="user.phone_number"
            value={formData.user.phone_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="user.email"
            value={formData.user.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />
        </div>

        <button className="submit-customer-signup-button" type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="signup-switch">
        <p>Want to sell products? <Link to="/seller-signup" className="switch-link">Create a Seller Account</Link></p>
      </div>
    </div>
  );
}

export default CustomerSignup;
