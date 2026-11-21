const express = require('express');
const cors = require('cors');
const { PORT, CORS_ORIGIN, DB_MODE } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const bookingRoutes = require('./routes/booking.routes');
const rentalRoutes = require('./routes/rental.routes');
const paymentRoutes = require('./routes/payment.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'AUK Car Rental RESTful API',
    dbMode: DB_MODE,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/operations', maintenanceRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AUK Car Rental API Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
