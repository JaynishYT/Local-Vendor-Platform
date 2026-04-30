import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const DEFAULT_VENDOR_PHOTO =
  'https://images.pexels.com/photos/5598290/pexels-photo-5598290.jpeg?auto=compress&cs=tinysrgb&w=800';

function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await fetch(`${API_BASE}/vendors/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setVendor(data);
      } catch (e) {
        console.error('Failed to load vendor', e);
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [id]);

  const getTagClass = (type) => {
    if (type === 'electrician') return 'tag tag-electrician';
    if (type === 'plumber') return 'tag tag-plumber';
    if (type === 'mechanic') return 'tag tag-mechanic';
    return 'tag tag-other';
  };

  if (loading) return <div className="page"><p className="muted">Loading...</p></div>;
  if (!vendor) return <div className="page"><p className="muted">Vendor not found.</p><Link to="/vendors" className="button secondary">Back</Link></div>;

  return (
    <div className="page">
      <div className="card">
        <img
          src={vendor.photo || DEFAULT_VENDOR_PHOTO}
          alt={vendor.name}
          className="vendor-photo"
          style={{ maxWidth: 220, borderRadius: 12, marginBottom: 12, boxShadow: '0 10px 25px rgba(15,23,42,0.45)' }}
        />
        <div className="card-header">
          <div>
            <h1>{vendor.name}</h1>
            <span className={getTagClass(vendor.serviceType)}>{vendor.serviceType}</span>
          </div>
        </div>
        <p className="rating-text">
          {vendor.avgRating != null ? `★ ${vendor.avgRating} / 5 (${vendor.ratingCount || 0} people rated)` : 'No ratings yet'}
        </p>
        {vendor.charges && <p><strong>Charges:</strong> {vendor.charges}</p>}
        <p>{vendor.description || 'No description.'}</p>
        <p className="muted">
          Address: {vendor.address}<br />
          Phone: {vendor.phone}
          {vendor.email && <><br />Email: {vendor.email}</>}
        </p>
        <div>
          <button className="button" onClick={() => navigate(`/booking/${vendor.id}`)}>Book Appointment</button>
          <Link to="/vendors" className="button secondary">Back to vendors</Link>
        </div>
      </div>
    </div>
  );
}

export default VendorDetailPage;
