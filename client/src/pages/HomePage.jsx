import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
  const [bookingId, setBookingId] = useState('');
  const navigate = useNavigate();
// this is the home page of the application
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-card">
          <div className="hero-pill-row">
            <span className="pill">Trusted Local Services</span>
            <span className="pill secondary">Electrician • Plumber • Mechanic</span>
          </div>
          <h1 className="hero-title">
            Book <span className="hero-highlight">verified vendors</span> in just a few clicks.
          </h1>
          <p className="hero-subtitle">
            Compare nearby professionals with real ratings, see clear charges up front, and pick a
            time that works for you.
          </p>

          <div className="hero-actions">
            <Link to="/vendors" className="button">
              Find a vendor now
            </Link>
            <Link to="/vendor-register" className="button secondary">
              Register as vendor
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <strong>3 in 1</strong>
              <span>Customer • Vendor • Admin</span>
            </div>
            <div className="hero-stat">
              <strong>Real‑time</strong>
              <span>Approvals & bookings</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(15,23,42,0.98)', color: '#f9fafb' }}>
          <h2 style={{ marginTop: 0 }}>Already booked?</h2>
          <p className="muted" style={{ color: '#9ca3af' }}>
            Enter your booking ID to see vendor contact details, rating options and report actions.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              style={{
                padding: '0.55rem 0.7rem',
                borderRadius: '0.5rem',
                border: '1px solid #4b5563',
                background: '#020617',
                color: '#e5e7eb',
                flex: 1
              }}
            />
            <button
              type="button"
              className="button secondary"
              onClick={() => bookingId && navigate(`/booking-details/${bookingId}`)}
            >
              View booking
            </button>
          </div>
          <p className="muted" style={{ color: '#9ca3af' }}>
            Need help managing bookings as a provider?{' '}
            <Link to="/vendor/login" style={{ color: '#93c5fd' }}>
              Vendor login
            </Link>
          </p>
        </div>
      </section>

      <div className="card">
        <h2>For Customers</h2>
        <p className="muted">
          See multiple vendors with photos, ratings and charges. Book with your contact details,
          address and preferred time. After work, rate or report the vendor if needed.
        </p>
        <Link to="/vendors" className="button">
          Start exploring vendors
        </Link>
      </div>

      <div className="card">
        <h2>For Vendors</h2>
        <p className="muted">
          Register with your category, photo, charges and contact details. After admin approval you
          will receive booking requests that you can accept or reject with a reason.
        </p>
        <Link to="/vendor-register" className="button secondary">
          Become a vendor
        </Link>
        <Link to="/vendor/login" className="button secondary" style={{ marginLeft: '0.5rem' }}>
          Vendor login
        </Link>
      </div>

      <div className="card">
        <h2>Admin Panel</h2>
        <p className="muted">
          Admin can approve vendors, monitor all bookings, review reports from both sides and
          blacklist bad actors to keep the platform safe.
        </p>
        <Link to="/admin/login" className="button secondary">
          Go to admin login
        </Link>
      </div>
    </div>
  );
}

export default HomePage;

