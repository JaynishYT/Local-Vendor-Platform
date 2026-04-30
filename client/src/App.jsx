import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import VendorListPage from './pages/VendorListPage';
import VendorDetailPage from './pages/VendorDetailPage';
import VendorRegisterPage from './pages/VendorRegisterPage';
import VendorLoginPage from './pages/VendorLoginPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import BookingPage from './pages/BookingPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="logo">Local Services</div>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/vendors">Find Vendors</Link>
            <Link to="/vendor-register">Vendor Register</Link>
            <Link to="/vendor/login">Vendor Login</Link>
            <Link to="/admin/login">Admin</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vendors" element={<VendorListPage />} />
            <Route path="/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/vendor-register" element={<VendorRegisterPage />} />
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
            <Route path="/booking/:vendorId" element={<BookingPage />} />
            <Route path="/booking-details/:bookingId" element={<BookingDetailsPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <small>© {new Date().getFullYear()} Local Services Booking</small>
        </footer>
      </div>
    </Router>
  );
}

export default App;
