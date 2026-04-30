import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

function BookingPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    date: '',
    time: '',
    problemDescription: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
// fetch vendor details when component mounts
  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await fetch(`${API_BASE}/vendors/${vendorId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setVendor(data);
      } catch (e) {
        console.error('Failed to load vendor', e);
      }
    }
    fetchVendor();
  }, [vendorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
// handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerName || !form.customerPhone || !form.customerAddress || !form.date || !form.time || !form.problemDescription) {
      setError('Please fill all required fields (*)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          ...form
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setBookingId(data.id);
    } catch (e) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingId) {
    return (
      <div className="page">
        <div className="success-text" style={{ fontSize: '1.1rem' }}>
          Booking confirmed! Your booking ID is <strong>{bookingId}</strong>.
        </div>
        <Link to={`/booking-details/${bookingId}`} className="button">
          View Booking & Vendor Details
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Book Appointment</h1>
      {vendor && (
        <p className="page-subtitle">
          Booking for <strong>{vendor.name}</strong> ({vendor.serviceType})
          {vendor.charges && ` • ${vendor.charges}`}
        </p>
      )}

      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Your Name *</label>
            <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Full name" />
          </div>
          <div className="form-field">
            <label>Contact Phone *</label>
            <input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="Phone number" />
          </div>
          <div className="form-field">
            <label>Address *</label>
            <textarea name="customerAddress" value={form.customerAddress} onChange={handleChange} placeholder="Where the work is needed" />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} placeholder="Optional" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Date *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Time * (AM/PM)</label>
              <select name="time" value={form.time} onChange={handleChange}>
                <option value="">Select time</option>
                {TIME_OPTIONS.map((t) => {
                  const [h, m] = t.split(':').map(Number);
                  const h12 = h === 12 ? 12 : h > 12 ? h - 12 : h;
                  const ampm = h < 12 ? 'AM' : 'PM';
                  return (
                    <option key={t} value={t}>
                      {h12}:{String(m).padStart(2, '0')} {ampm}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Problem / Description *</label>
            <textarea name="problemDescription" value={form.problemDescription} onChange={handleChange} placeholder="Describe the issue" />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div>
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button type="button" className="button secondary" onClick={() => navigate(-1)}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingPage;
