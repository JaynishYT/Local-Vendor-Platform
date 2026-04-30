import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [pendingVendors, setPendingVendors] = useState([]);
  const [approvedVendors, setApprovedVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vendors');

  const token = localStorage.getItem('adminToken'); // api/admin/login

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const headers = { 'x-admin-secret': token };
      const [pendingRes, approvedRes, bookingsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/vendors?status=pending`),
        fetch(`${API_BASE}/vendors?status=approved`),
        fetch(`${API_BASE}/bookings`, { headers }),
        fetch(`${API_BASE}/reports`, { headers })
      ]);
      if (!bookingsRes.ok || !reportsRes.ok) throw new Error('Failed to load');
      const [pendingData, approvedData, bookingsData, reportsData] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        bookingsRes.json(),
        reportsRes.json()
      ]);
      setPendingVendors(pendingData);
      setApprovedVendors(approvedData);
      setBookings(bookingsData);
      setReports(reportsData || []);
    } catch (e) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate, token]);

  const handleStatusChange = async (id, status) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vendors/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': token },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      loadData();
    } catch (e) {
      alert('Failed to update');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: '1px solid #e5e7eb' };

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h1>Admin Dashboard</h1>
          <button className="button secondary" onClick={handleLogout}>Logout</button>
        </div>
        <p className="muted">Approve vendors, view reports, blacklist vendors, and see customer data.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 8 }}>
          <button className={`button ${activeTab === 'vendors' ? '' : 'secondary'}`} onClick={() => setActiveTab('vendors')}>Vendors</button>
          <button className={`button ${activeTab === 'bookings' ? '' : 'secondary'}`} onClick={() => setActiveTab('bookings')}>Customer Data</button>
          <button className={`button ${activeTab === 'reports' ? '' : 'secondary'}`} onClick={() => setActiveTab('reports')}>Reports</button>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {activeTab === 'vendors' && (
        <>
          <div className="card">
            <h2>Pending Vendors</h2>
            {pendingVendors.length === 0 && <p className="muted">No pending vendors.</p>}
            {pendingVendors.map((v) => (
              <div key={v.id} style={row}>
                <div>
                  {v.photo && <img src={v.photo} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />}
                  <strong>{v.name}</strong> ({v.serviceType}) {v.charges && `• ${v.charges}`}<br />
                  <span className="muted">{v.phone} • {v.address}</span>
                </div>
                <div>
                  <button className="button" onClick={() => handleStatusChange(v.id, 'approved')}>Approve</button>
                  <button className="button danger" onClick={() => handleStatusChange(v.id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Approved Vendors (can blacklist)</h2>
            {approvedVendors.length === 0 && <p className="muted">No approved vendors.</p>}
            {approvedVendors.map((v) => (
              <div key={v.id} style={row}>
                <div>
                  {v.photo && <img src={v.photo} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />}
                  <strong>{v.name}</strong> ({v.serviceType})<br />
                  <span className="muted">{v.phone} • {v.address}</span>
                </div>
                <div>
                  <button className="button danger" onClick={() => handleStatusChange(v.id, 'blacklisted')}>Blacklist</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'bookings' && (
        <div className="card">
          <h2>Customer Personal Data (from bookings)</h2>
          {bookings.length === 0 && <p className="muted">No bookings.</p>}
          {bookings.map((b) => (
            <div key={b.id} style={{ padding: '0.5rem 0', borderTop: '1px solid #e5e7eb' }}>
              <strong>Customer:</strong> {b.customerName} | <strong>Phone:</strong> {b.customerPhone} | <strong>Address:</strong> {b.customerAddress}
              {b.customerEmail && ` | Email: ${b.customerEmail}`}
              <br />
              <span className="muted">
                Booked {b.vendorName} ({b.vendorServiceType}) on {b.date} at {b.time} – {b.problemDescription}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card">
          <h2>All Reports</h2>
          {reports.length === 0 && <p className="muted">No reports.</p>}
          {reports.map((r) => (
            <div key={r.id} style={{ padding: '0.5rem 0', borderTop: '1px solid #e5e7eb' }}>
              <strong>{r.reporterType === 'customer' ? 'Customer reported vendor' : 'Vendor reported customer'}</strong>
              {r.vendorName && `: ${r.vendorName}`}
              {r.customerName && ` - Customer: ${r.customerName} (${r.customerPhone})`}
              <br />
              <span className="muted">Reason: {r.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
