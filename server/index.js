require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vendor_booking_app';
let dbConnectPromise = null;

// Create uploads directory for vendor photos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (dbConnectPromise) return dbConnectPromise;
  dbConnectPromise = mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      dbConnectPromise = null;
      throw error;
    });
  return dbConnectPromise;
}

app.use(async (req, res, next) => {
  if (req.path === '/api/admin/login') return next();
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return res.status(500).json({ message: 'Database connection failed' });
  }
});

const toClientId = (doc) => {
  if (!doc) return doc;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return { ...plain, id: plain._id.toString(), _id: undefined, __v: undefined };
};

const asObjectId = (value) => (mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serviceType: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    photo: { type: String, default: '' },
    charges: { type: String, default: '' },
    password: { type: String, default: '' }
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    problemDescription: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    rejectionReason: { type: String, default: '' }
  },
  { timestamps: true }
);

const ratingSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    rating: { type: Number, min: 1, max: 5, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const reportSchema = new mongoose.Schema(
  {
    reporterType: { type: String, required: true },
    reportedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    reportedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    reason: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Vendor = mongoose.model('Vendor', vendorSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Rating = mongoose.model('Rating', ratingSchema);
const Report = mongoose.model('Report', reportSchema);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-admin-secret';

function requireAdmin(req, res, next) {
  const headerSecret = req.headers['x-admin-secret'];
  if (headerSecret === ADMIN_SECRET) return next();
  return res.status(403).json({ message: 'Admin access required' });
}

function requireVendor(req, res, next) {
  const token = req.headers['x-vendor-token'];
  if (!token || !token.startsWith('v_')) return res.status(403).json({ message: 'Vendor login required' });
  const vendorId = token.replace('v_', '');
  const vendorObjectId = asObjectId(vendorId);
  if (!vendorObjectId) return res.status(403).json({ message: 'Invalid vendor token' });
  Vendor.findOne({ _id: vendorObjectId, status: { $in: ['approved', 'pending'] } })
    .then((row) => {
      if (!row) return res.status(403).json({ message: 'Invalid vendor token' });
      req.vendorId = vendorId;
      return next();
    })
    .catch(() => res.status(403).json({ message: 'Invalid vendor token' }));
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_SECRET });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Vendor login
app.post('/api/vendor/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ message: 'Phone and password required' });
  try {
    const row = await Vendor.findOne({ phone });
    if (!row) return res.status(401).json({ message: 'Invalid phone or password' });
    if (row.status !== 'approved') return res.status(401).json({ message: 'Vendor not yet approved' });
    if (row.password !== password) return res.status(401).json({ message: 'Invalid phone or password' });
    return res.json({ success: true, token: `v_${row._id.toString()}`, vendorId: row._id.toString(), vendorName: row.name });
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Create vendor (public)
app.post('/api/vendors', async (req, res) => {
  const { name, serviceType, phone, address, email, description, photo, charges, password } = req.body;
  if (!name || !serviceType || !phone || !address || !charges || !password) {
    return res.status(400).json({ message: 'Missing required fields (name, serviceType, phone, address, charges, password)' });
  }
  try {
    const vendor = await Vendor.create({
      name,
      serviceType,
      phone,
      address: address || '',
      email: email || '',
      description: description || '',
      photo: photo || '',
      charges: charges || '',
      status: 'pending',
      password
    });
    return res.status(201).json(toClientId(vendor));
  } catch (err) {
    console.error('Error inserting vendor', err);
    return res.status(500).json({ message: 'Failed to create vendor' });
  }
});

// Get vendors (filter status, serviceType; exclude blacklisted) with ratings
app.get('/api/vendors', async (req, res) => {
  const { status, serviceType } = req.query;
  const filters = { status: { $ne: 'blacklisted' } };
  if (status) filters.status = status;
  if (serviceType) filters.serviceType = serviceType;

  try {
    const vendors = await Vendor.find(filters).sort({ createdAt: -1 });
    const vendorIds = vendors.map((v) => v._id);
    const ratingAgg = await Rating.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: '$vendorId', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
    ]);
    const ratingMap = new Map(
      ratingAgg.map((r) => [r._id.toString(), { avgRating: Math.round(r.avgRating * 10) / 10, ratingCount: r.ratingCount }])
    );
    const rows = vendors.map((vendor) => {
      const row = toClientId(vendor);
      const ratingData = ratingMap.get(vendor._id.toString());
      return { ...row, avgRating: ratingData ? ratingData.avgRating : null, ratingCount: ratingData ? ratingData.ratingCount : 0 };
    });
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Get single vendor with rating
app.get('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  const vendorObjectId = asObjectId(id);
  if (!vendorObjectId) return res.status(404).json({ message: 'Vendor not found' });
  try {
    const row = await Vendor.findOne({ _id: vendorObjectId, status: { $ne: 'blacklisted' } });
    if (!row) return res.status(404).json({ message: 'Vendor not found' });
    const [ratingData] = await Rating.aggregate([
      { $match: { vendorId: vendorObjectId } },
      { $group: { _id: '$vendorId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    const ratingCount = ratingData ? ratingData.count : 0;
    const avgRating = ratingData && ratingData.avgRating != null ? Math.round(ratingData.avgRating * 10) / 10 : null;
    return res.json({ ...toClientId(row), ratingCount, avgRating });
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Admin: approve / reject / blacklist vendor
app.put('/api/vendors/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['approved', 'rejected', 'blacklisted'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const vendorObjectId = asObjectId(id);
  if (!vendorObjectId) return res.status(404).json({ message: 'Vendor not found' });
  try {
    const result = await Vendor.updateOne({ _id: vendorObjectId }, { $set: { status } });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Vendor not found' });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Failed' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  const { vendorId, customerName, customerPhone, customerAddress, customerEmail, date, time, problemDescription } = req.body;
  if (!vendorId || !customerName || !customerPhone || !customerAddress || !date || !time) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const vendorObjectId = asObjectId(vendorId);
  if (!vendorObjectId) return res.status(400).json({ message: 'Missing required fields' });
  try {
    const booking = await Booking.create({
      vendorId: vendorObjectId,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail: customerEmail || '',
      date,
      time,
      problemDescription: problemDescription || '',
      status: 'pending'
    });
    const response = toClientId(booking);
    response.vendorId = booking.vendorId.toString();
    return res.status(201).json(response);
  } catch {
    return res.status(500).json({ message: 'Failed to create booking' });
  }
});

// Get booking by ID (for customer view after booking)
app.get('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const bookingObjectId = asObjectId(id);
  if (!bookingObjectId) return res.status(404).json({ message: 'Booking not found' });
  try {
    const row = await Booking.findById(bookingObjectId).populate('vendorId');
    if (!row) return res.status(404).json({ message: 'Booking not found' });
    const vendor = row.vendorId;
    const [ratingData] = await Rating.aggregate([
      { $match: { vendorId: vendor._id } },
      { $group: { _id: '$vendorId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    const booking = toClientId(row);
    booking.vendorId = vendor ? vendor._id.toString() : null;
    booking.vendorName = vendor ? vendor.name : null;
    booking.serviceType = vendor ? vendor.serviceType : null;
    booking.vendorPhone = vendor ? vendor.phone : null;
    booking.vendorEmail = vendor ? vendor.email : null;
    booking.vendorAddress = vendor ? vendor.address : null;
    booking.vendorPhoto = vendor ? vendor.photo : null;
    booking.charges = vendor ? vendor.charges : null;
    booking.ratingCount = ratingData ? ratingData.count : 0;
    booking.avgRating = ratingData && ratingData.avgRating != null ? Math.round(ratingData.avgRating * 10) / 10 : null;
    return res.json(booking);
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Vendor: get my bookings
app.get('/api/vendor/bookings', requireVendor, async (req, res) => {
  const vendorObjectId = asObjectId(req.vendorId);
  if (!vendorObjectId) return res.status(500).json({ message: 'Error' });
  try {
    const vendor = await Vendor.findById(vendorObjectId);
    const rows = await Booking.find({ vendorId: vendorObjectId }).sort({ date: -1, time: -1 });
    const result = rows.map((row) => {
      const booking = toClientId(row);
      booking.vendorId = row.vendorId.toString();
      booking.vendorName = vendor ? vendor.name : null;
      return booking;
    });
    return res.json(result);
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Vendor: accept booking (then customer details visible)
app.put('/api/bookings/:id/accept', requireVendor, async (req, res) => {
  const { id } = req.params;
  const vendorObjectId = asObjectId(req.vendorId);
  const bookingObjectId = asObjectId(id);
  if (!vendorObjectId || !bookingObjectId) return res.status(404).json({ message: 'Booking not found or already processed' });
  try {
    const result = await Booking.updateOne(
      { _id: bookingObjectId, vendorId: vendorObjectId, status: 'pending' },
      { $set: { status: 'accepted' } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Booking not found or already processed' });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Vendor: reject booking
app.put('/api/bookings/:id/reject', requireVendor, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const vendorObjectId = asObjectId(req.vendorId);
  const bookingObjectId = asObjectId(id);
  if (!vendorObjectId || !bookingObjectId) return res.status(404).json({ message: 'Booking not found' });
  try {
    const row = await Booking.findOne({ _id: bookingObjectId, vendorId: vendorObjectId });
    if (!row) return res.status(404).json({ message: 'Booking not found' });
    const newStatus = row.status === 'accepted' ? 'rejected_after_accept' : 'rejected';
    if (newStatus === 'rejected_after_accept' && !reason) {
      return res.status(400).json({ message: 'Reason required when rejecting after accepting' });
    }
    await Booking.updateOne(
      { _id: bookingObjectId, vendorId: vendorObjectId },
      { $set: { status: newStatus, rejectionReason: reason || '' } }
    );
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Add rating (from customer, linked to booking)
app.post('/api/ratings', async (req, res) => {
  const { vendorId, bookingId, rating } = req.body;
  if (!vendorId || !rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });
  const vendorObjectId = asObjectId(vendorId);
  const bookingObjectId = bookingId ? asObjectId(bookingId) : null;
  if (!vendorObjectId || (bookingId && !bookingObjectId)) return res.status(400).json({ message: 'Invalid rating' });
  try {
    const created = await Rating.create({ vendorId: vendorObjectId, bookingId: bookingObjectId, rating });
    return res.status(201).json({ id: created._id.toString(), vendorId, rating });
  } catch {
    return res.status(500).json({ message: 'Failed' });
  }
});

// Report vendor (by customer)
app.post('/api/reports/vendor', async (req, res) => {
  const { vendorId, bookingId, reason } = req.body;
  if (!vendorId || !reason) return res.status(400).json({ message: 'Vendor ID and reason required' });
  const vendorObjectId = asObjectId(vendorId);
  const bookingObjectId = bookingId ? asObjectId(bookingId) : null;
  if (!vendorObjectId || (bookingId && !bookingObjectId)) return res.status(400).json({ message: 'Vendor ID and reason required' });
  try {
    const created = await Report.create({
      reporterType: 'customer',
      reportedVendorId: vendorObjectId,
      reportedBookingId: bookingObjectId,
      reason
    });
    return res.status(201).json({ id: created._id.toString() });
  } catch {
    return res.status(500).json({ message: 'Failed' });
  }
});

// Report customer (by vendor)
app.post('/api/reports/customer', requireVendor, async (req, res) => {
  const { bookingId, reason } = req.body;
  if (!bookingId || !reason) return res.status(400).json({ message: 'Booking ID and reason required' });
  const vendorObjectId = asObjectId(req.vendorId);
  const bookingObjectId = asObjectId(bookingId);
  if (!vendorObjectId || !bookingObjectId) return res.status(404).json({ message: 'Booking not found' });
  try {
    const row = await Booking.findOne({ _id: bookingObjectId, vendorId: vendorObjectId });
    if (!row) return res.status(404).json({ message: 'Booking not found' });
    const created = await Report.create({
      reporterType: 'vendor',
      reportedVendorId: vendorObjectId,
      reportedBookingId: bookingObjectId,
      reason
    });
    return res.status(201).json({ id: created._id.toString() });
  } catch {
    return res.status(500).json({ message: 'Failed' });
  }
});

// Admin: get all reports
app.get('/api/reports', requireAdmin, async (req, res) => {
  try {
    const rows = await Report.find().sort({ createdAt: -1 }).populate('reportedVendorId').populate('reportedBookingId');
    const response = rows.map((r) => {
      const report = toClientId(r);
      report.reportedVendorId = r.reportedVendorId ? r.reportedVendorId._id.toString() : null;
      report.reportedBookingId = r.reportedBookingId ? r.reportedBookingId._id.toString() : null;
      report.vendorName = r.reportedVendorId ? r.reportedVendorId.name : null;
      report.customerName = r.reportedBookingId ? r.reportedBookingId.customerName : null;
      report.customerPhone = r.reportedBookingId ? r.reportedBookingId.customerPhone : null;
      report.customerAddress = r.reportedBookingId ? r.reportedBookingId.customerAddress : null;
      return report;
    });
    return res.json(response);
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

// Admin: get all bookings (customer data)
app.get('/api/bookings', requireAdmin, async (req, res) => {
  try {
    const rows = await Booking.find().sort({ date: -1, time: -1 }).populate('vendorId');
    const response = rows.map((row) => {
      const booking = toClientId(row);
      booking.vendorId = row.vendorId ? row.vendorId._id.toString() : null;
      booking.vendorName = row.vendorId ? row.vendorId.name : null;
      booking.vendorServiceType = row.vendorId ? row.vendorId.serviceType : null;
      return booking;
    });
    return res.json(response);
  } catch {
    return res.status(500).json({ message: 'Error' });
  }
});

if (!process.env.VERCEL) {
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

module.exports = app;
