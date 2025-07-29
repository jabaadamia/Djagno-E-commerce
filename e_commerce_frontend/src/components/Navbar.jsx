import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSellerProfile, getCustomerProfile } from '../services/api';
import '../styles/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(null);
  const [userInitials, setUserInitials] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userType, setUserType] = useState(null); // 'seller' or 'customer'

  const fetchProfile = async () => {
    if (!token){
      setProfilePicture(null);
      setUserInitials('');
      setUserType(null);
      return;
    }
    try {
      // TODO fix fetching based on type of users
      // Try to fetch customer profile first, if it fails, try seller profile
      let profile;
      try {
        profile = await getCustomerProfile();
        console.log('Customer profile data received:', profile);
        setUserType('customer');
      } catch (customerError) {
        console.log('Not a customer, trying seller profile...');
        try {
          profile = await getSellerProfile();
          console.log('Seller profile data received:', profile);
          setUserType('seller');
        } catch (sellerError) {
          console.error('Failed to fetch both seller and customer profiles:', sellerError);
          setProfilePicture(null);
          setUserInitials('');
          setUserType(null);
          return;
        }
      }

      if (profile.user.profile_picture) {
        const imageUrl = profile.user.profile_picture.startsWith('http')
          ? profile.user.profile_picture
          : `http://localhost:8000${profile.user.profile_picture}`;
        setProfilePicture(imageUrl);
      } else {
        setProfilePicture(null);
      }

      if (profile.user.username) {
        const initials = profile.user.username.substring(0, 2).toUpperCase();
        setUserInitials(initials);
      } else {
        setUserInitials('');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfilePicture(null);
      setUserInitials('');
      setUserType(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const handleLogin = () => {
      const newToken = localStorage.getItem('token');
      if (newToken && newToken !== token) {
        setToken(newToken);
      }
    };

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);

    window.addEventListener('storage', handleLogin);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleLogin);
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setProfilePicture(null);
    setUserInitials('');
    setUserType(null);
    navigate('/login');
  };

  const getProfileLink = () => {
    return userType === 'seller' ? '/seller/profile' : '/profile';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">E-Commerce</Link>
      </div>
      <div className="navbar-links">
        {token && (
          <Link to={getProfileLink()} className="profile-link">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="navbar-profile-pic"
              />
                      ) : (
            <div className="default-avatar">{userInitials}</div>
          )}
          </Link>
        )}

        <Link to="/cart" className="cart-link">
          Cart
        </Link>
        {
          token ?
          <button onClick={handleLogout} className="logout-button">logout</button> :
          <div className="auth-buttons">
            <Link to="/login" className="login-button">
              login
            </Link>
            <Link to="/customer-signup" className="signup-button">
              signup
            </Link>
          </div>
        }
      </div>
    </nav>
  );
}

export default Navbar;
