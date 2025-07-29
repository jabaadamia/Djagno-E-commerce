import React, { useEffect, useState } from 'react'
import { getCustomerProfile } from './services/api';
import CustomerInfo from './components/CustomerInfo';
import CustomerOrders from './components/CustomerOrders';
import './styles/CustomerProfile.css';

function CustomerProfile() {
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const profile = await getCustomerProfile();
        setCustomerData(profile);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchCustomerData();
  }, []);

  if (!customerData) return <p>Loading...</p>;

  return (
    <div className="customer-profile-page-container">
      <aside className="customer-profile-sidebar">
        <CustomerInfo customerData={customerData}/>
      </aside>
      <main className="customer-profile-main">
        <CustomerOrders />
      </main>
    </div>
  )
}

export default CustomerProfile
