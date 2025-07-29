import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import ProductList from './ProductList';
import SellerSignup from './components/SellerSignup';
import CustomerSignup from './components/CustomerSignup';
import SellerProfile from './SellerProfile';
import SellerProductDetail from './components/SellerProductDetail';
import SellerDashboard from './components/SellerDashboard';
import CustomerProfile from './CustomerProfile';
import Login from './Login';
import Cart from './Cart';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import CheckoutPage from './components/CheckoutPage';
import ShippingInfoPage from './components/ShippingInfoPage';


function App() {

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <ProductList/>
            }
          />
          <Route path="/seller-signup" element={<SellerSignup />} />
          <Route path="/customer-signup" element={<CustomerSignup />} />
          <Route
            path="/seller/profile"
            element={
              <ProtectedRoute>
                <SellerProfile />
              </ProtectedRoute>
            }/>
          <Route path="/login" element={<Login />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            }/>
          <Route
            path="/product/:id"
            element={
              <ProductDetail />
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipping-info"
            element={
              <ProtectedRoute>
                <ShippingInfoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/product-details/:id"
            element={
              <ProtectedRoute>
                <SellerProductDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
