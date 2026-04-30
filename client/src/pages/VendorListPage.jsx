import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const DEFAULT_VENDOR_PHOTO =
  'https://images.pexels.com/photos/5598290/pexels-photo-5598290.jpeg?auto=compress&cs=tinysrgb&w=800';

function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchVendors() {
      try {
        const params = new URLSearchParams({ status: 'approved' });
        if (serviceFilter) params.append('serviceType', serviceFilter);
        const res = await fetch(`${API_BASE}/vendors?${params.toString()}`);
        const data = await res.json();
        setVendors(data);
      } catch (e) {
        console.error('Failed to load vendors', e);
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [serviceFilter]);


  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const getTagClass = (type) => {
    if (type === 'electrician') return 'tag tag-electrician';
    if (type === 'plumber') return 'tag tag-plumber';
    if (type === 'mechanic') return 'tag tag-mechanic';
    return 'tag tag-other';
  };

  return (
    <div className="page">
      <h1>Find Vendors</h1>
      <p className="page-subtitle">Browse approved vendors, see ratings and book an appointment.</p>

      <div className="filter-row">
        <div>
          <label>
            Service type:{' '}
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="">All</option>
              <option value="electrician">Electrician</option>
              <option value="plumber">Plumber</option>
              <option value="mechanic">Mechanic</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <div>
          <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <p className="muted">Loading vendors...</p>}
      {!loading && filtered.length === 0 && <p className="muted">No vendors found.</p>}

      <div className="vendor-grid">
        {filtered.map((vendor) => (
          <div key={vendor.id} className="card vendor-card">
            <img
              src={vendor.photo || DEFAULT_VENDOR_PHOTO}
              alt={vendor.name}
              className="vendor-thumb"
            />
            <div className="card-header">
              <div>
                <h3>{vendor.name}</h3>
                <span className={getTagClass(vendor.serviceType)}>{vendor.serviceType}</span>
              </div>
            </div>
            <p className="rating-text">
              {vendor.avgRating != null ? `★ ${vendor.avgRating} (${vendor.ratingCount || 0} ratings)` : 'No ratings yet'}
            </p>
            <p>{vendor.description || 'No description.'}</p>
            {vendor.charges && <p className="muted">{vendor.charges}</p>}
            <p className="muted">{vendor.address} • {vendor.phone}</p>
            <Link to={`/vendors/${vendor.id}`} className="button">View & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorListPage;
