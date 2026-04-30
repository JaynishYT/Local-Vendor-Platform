import { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function VendorRegisterPage() {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    serviceType: 'electrician',
    phone: '',
    address: '',
    email: '',
    description: '',
    photo: '',
    charges: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!form.name || !form.serviceType || !form.phone || !form.address || !form.charges || !form.password) {
      setError('Please fill all required fields (*)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess(true);
      setForm({
        name: '',
        serviceType: 'electrician',
        phone: '',
        address: '',
        email: '',
        description: '',
        photo: '',
        charges: '',
        password: ''
      });
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Vendor Registration</h1>
      <p className="page-subtitle">
        Add your details. After admin verifies, you can log in and receive bookings.
      </p>

      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Photo *</label>
            <div className="photo-upload-row">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoFile}
                style={{ display: 'none' }}
              />
              <button type="button" className="button secondary" onClick={() => fileInputRef.current?.click()}>
                Choose Photo
              </button>
              <span className="muted">or paste image URL:</span>
              <input
                name="photo"
                value={form.photo}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
            {form.photo && (
              <img src={form.photo} alt="Preview" className="photo-preview" style={{ maxWidth: 120, marginTop: 8 }} />
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name or shop name" />
            </div>
            <div className="form-field">
              <label>Service Type *</label>
              <select name="serviceType" value={form.serviceType} onChange={handleChange}>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="mechanic">Mechanic</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Optional" />
            </div>
          </div>

          <div className="form-field">
            <label>Charges * (e.g. ₹500 per visit)</label>
            <input name="charges" value={form.charges} onChange={handleChange} placeholder="e.g. ₹500 per visit" />
          </div>

          <div className="form-field">
            <label>Address *</label>
            <textarea name="address" value={form.address} onChange={handleChange} placeholder="Working area" />
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Experience and services" />
          </div>

          <div className="form-field">
            <label>Password * (for vendor login)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Set a password" />
          </div>

          {error && <div className="error-text">{error}</div>}
          {success && (
            <div className="success-text">
              Registration submitted. After admin approves, login with your phone and password.
            </div>
          )}

          <button type="submit" className="button" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VendorRegisterPage;
