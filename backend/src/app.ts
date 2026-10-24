import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { restaurantRouter } from './routes/restaurantRoutes';
import { orderRouter } from './routes/orderRoutes';
import { adminRouter } from './routes/adminRoutes';
import { restaurantPortalRouter } from './routes/restaurantPortalRoutes';
import { uploadsDirectory } from './middleware/upload';

export const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDirectory, { index: false, maxAge: '1d' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EDU Food Order API',
  });
});

// Mount Routes
app.use('/api/restaurants', restaurantRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/restaurant-portal', restaurantPortalRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ไม่ถูกต้อง: ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);
