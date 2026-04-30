import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function VendorLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('vendorToken', data.token);
      localStorage.setItem('vendorId', data.vendorId);
      navigate('/vendor/dashboard');
    } catch (e) {
      setError(e.message || 'Invalid phone or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Vendor Login</h1>
      <p className="page-subtitle">Login with your registered phone and password.</p>

      <div className="card" style={{ maxWidth: 400 }}>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your registered phone"
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Not registered? <Link to="/vendor-register">Register as vendor</Link>
        </p>
      </div>
    </div>
  );
}

export default VendorLoginPage;
