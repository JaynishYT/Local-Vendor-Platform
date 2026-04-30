import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatTime24ToAMPM } from '../utils/formatTime';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function BookingDetailsPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState('');
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`${API_BASE}/bookings/${bookingId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBooking(data);
      } catch (e) {
        console.error('Failed to load booking', e);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reports/vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: booking.vendorId, bookingId: Number(bookingId), reason: reportReason })
      });
      if (!res.ok) throw new Error();
      alert('Report submitted');
      setReportReason('');
    } catch (e) {
      alert('Failed to report');
    }
  };
// rating function 
// this function is async because api take time
  const handleRating = async () => {
    if (rating < 1 || rating > 5) {
      alert('Please select 1-5 stars');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: booking.vendorId, bookingId: Number(bookingId), rating })
      });
      if (!res.ok) throw new Error();
      setRated(true);
      setBooking((prev) => ({
        ...prev,
        ratingCount: (prev.ratingCount || 0) + 1, // increment rating count
        // calculate new average rating
        avgRating: prev.avgRating ? ((prev.avgRating * prev.ratingCount + rating) / (prev.ratingCount + 1)).toFixed(1) : rating
      }));
    } catch (e) {
      alert('Failed to submit rating');
    }
  };

  if (loading) return <div className="page"><p className="muted">Loading...</p></div>;
  if (!booking) return <div className="page"><p className="muted">Booking not found.</p><Link to="/vendors" className="button">Find Vendors</Link></div>;

  const getTagClass = (type) => {
    if (type === 'electrician') return 'tag tag-electrician';
    if (type === 'plumber') return 'tag tag-plumber';
    if (type === 'mechanic') return 'tag tag-mechanic';
    return 'tag tag-other';
  };

  return (
    <div className="page">
      <h1>Booking Details</h1>
      <p className="page-subtitle">Booking #{bookingId}</p>

      <div className="card">
        <h2>Your Booking</h2>
        <p><strong>Date:</strong> {booking.date} at {formatTime24ToAMPM(booking.time)}</p>
        <p><strong>Status:</strong> <span className={`status-pill status-${booking.status === 'accepted' ? 'approved' : booking.status === 'pending' ? 'pending' : 'rejected'}`}>{booking.status}</span></p>
        {booking.rejectionReason && <p className="muted">Rejection reason: {booking.rejectionReason}</p>}
      </div>

      <div className="card">
        <h2>Vendor Details</h2>
        {booking.vendorPhoto && (
          <img src={booking.vendorPhoto} alt={booking.vendorName} className="vendor-photo" style={{ maxWidth: 200, borderRadius: 8, marginBottom: 12 }} />
        )}
        <h3>{booking.vendorName}</h3>
        <span className={getTagClass(booking.serviceType)}>{booking.serviceType}</span>
        <p className="muted" style={{ marginTop: 8 }}>
          <strong>Rating:</strong> {booking.avgRating != null ? `${booking.avgRating} / 5` : 'No ratings yet'} ({booking.ratingCount || 0} {booking.ratingCount === 1 ? 'person' : 'people'} rated)
        </p>
        <p><strong>Phone:</strong> {booking.vendorPhone}</p>
        {booking.vendorEmail && <p><strong>Email:</strong> {booking.vendorEmail}</p>}
        <p><strong>Address:</strong> {booking.vendorAddress}</p>
        {booking.charges && <p><strong>Charges:</strong> {booking.charges}</p>}
      </div>

      <div className="card">
        <h3>Rate this vendor</h3>
        {!rated ? (
          <div>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="star-btn"
                onClick={() => setRating(s)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                {s <= rating ? '★' : '☆'}
              </button>
            ))}
            <button className="button" onClick={handleRating} style={{ marginLeft: 12 }}>Submit Rating</button>
          </div>
        ) : (
          <p className="success-text">Thanks for rating!</p>
        )}
      </div>

      <div className="card">
        <h3>Report Vendor</h3>
        <input
          type="text"
          placeholder="Reason for report"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button className="button danger" onClick={handleReport}>Report Vendor</button>
      </div>

      <Link to="/vendors" className="button secondary">Back to Vendors</Link>
    </div>
  );
}

export default BookingDetailsPage;
