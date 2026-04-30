import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime24ToAMPM } from '../utils/formatTime';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function VendorDashboardPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});
  const [reportReason, setReportReason] = useState({});
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    loadBookings();
  }, [token, navigate]);

  const loadBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/vendor/bookings`, {
        headers: { 'x-vendor-token': token }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      navigate('/vendor/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/accept`, {
        method: 'PUT',
        headers: { 'x-vendor-token': token }
      });
      if (!res.ok) throw new Error();
      loadBookings();
    } catch (e) {
      alert('Failed to accept');
    }
  };

  const handleReject = async (id, afterAccept) => {
    const reason = rejectReason[id]?.trim();
    if (afterAccept && !reason) {
      alert('Please give a reason for rejecting (e.g. too far, low budget, not repairable)');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-vendor-token': token },
        body: JSON.stringify({ reason: reason || '' })
      });
      if (!res.ok) throw new Error();
      setRejectReason((prev) => ({ ...prev, [id]: '' }));
      loadBookings();
    } catch (e) {
      alert('Failed to reject');
    }
  };
// this function is to report customer by vendor
  const handleReportCustomer = async (bookingId) => {
    const reason = reportReason[bookingId]?.trim();
    if (!reason) {
      alert('Please enter a reason');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reports/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vendor-token': token },
        body: JSON.stringify({ bookingId, reason })
      });
      if (!res.ok) throw new Error();
      setReportReason((prev) => ({ ...prev, [bookingId]: '' }));
      alert('Report submitted');
    } catch (e) {
      alert('Failed to report');
    }
  };
// logout function to clear vendor token and id from local storage and navigate to login page
  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorId');
    navigate('/vendor/login');
  };

  if (loading) return <div className="page"><p className="muted">Loading...</p></div>;

  const pending = bookings.filter((b) => b.status === 'pending');
  const accepted = bookings.filter((b) => b.status === 'accepted');

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h1>Vendor Dashboard</h1>
          <button className="button secondary" onClick={handleLogout}>Logout</button>
        </div>
        <p className="muted">View bookings, accept or reject, and see customer details.</p>
      </div>

      <div className="card">
        <h2>Pending (Accept or Reject)</h2>
        {pending.length === 0 && <p className="muted">No pending bookings.</p>}
        {pending.map((b) => (
          <div key={b.id} className="booking-card">
            <div>
              <strong>Date:</strong> {b.date} at {formatTime24ToAMPM(b.time)}
              <br />
              <strong>Problem:</strong> {b.problemDescription || '-'}
            </div>
            <div>Customer details hidden until you accept.</div>
            <div className="booking-actions">
              <button className="button" onClick={() => handleAccept(b.id)}>Accept</button>
              <button className="button danger" onClick={() => handleReject(b.id, false)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Accepted (Customer Details Visible)</h2>
        {accepted.length === 0 && <p className="muted">No accepted bookings.</p>}
        {accepted.map((b) => (
          <div key={b.id} className="booking-card">
            <div>
              <strong>Customer:</strong> {b.customerName}
              <br />
              <strong>Phone:</strong> {b.customerPhone}
              <br />
              <strong>Address:</strong> {b.customerAddress}
              {b.customerEmail && <><br /><strong>Email:</strong> {b.customerEmail}</>}
              <br />
              <strong>Date:</strong> {b.date} at {formatTime24ToAMPM(b.time)}
              <br />
              <strong>Problem:</strong> {b.problemDescription || '-'}
            </div>
            <div className="booking-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Reason to reject (e.g. too far, low budget)"
                  value={rejectReason[b.id] || ''}
                  onChange={(e) => setRejectReason((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 150 }}
                />
                <button className="button danger" onClick={() => handleReject(b.id, true)}>Reject Order</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Reason to report customer"
                  value={reportReason[b.id] || ''}
                  onChange={(e) => setReportReason((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 150 }}
                />
                <button className="button secondary" onClick={() => handleReportCustomer(b.id)}>Report Customer</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Other Bookings</h2>
        {bookings.filter((b) => !['pending', 'accepted'].includes(b.status)).length === 0 && (
          <p className="muted">None.</p>
        )}
        {bookings.filter((b) => !['pending', 'accepted'].includes(b.status)).map((b) => (
          <div key={b.id} className="booking-card">
            <strong>{b.status}</strong> – {b.date} {formatTime24ToAMPM(b.time)} – {b.problemDescription}
            {b.rejectionReason && <div className="muted">Reason: {b.rejectionReason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorDashboardPage;
