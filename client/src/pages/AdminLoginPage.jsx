import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid username or password');
      }

      const data = await res.json();
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch (e) {
      if (e instanceof TypeError) {
        setError('Cannot connect to server. Check backend deployment and try again.');
      } else {
        setError(e.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Admin Login</h1>
      <p className="page-subtitle">
        Enter admin credentials to manage vendor approvals and bookings.
      </p>

      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Jaynish"
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
