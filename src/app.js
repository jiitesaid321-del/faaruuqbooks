const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const mainRouter = require('./routes');
const { authLimiter } = require('./middlewares/rateLimit');
const errorHandler = require('./middlewares/error');

require('dotenv').config();

const app = express();

// Security middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Routes
app.use('/api/v1', mainRouter);

// Error handler
app.use(errorHandler);

// Connect DB and start server
connectDB(process.env.MONGO_URI);

module.exports = app;