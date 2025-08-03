import logger from '../config/logger.js'

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error details
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    body: req.body,
    query: req.query,
    params: req.params
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later'
    error = { message, statusCode: 429 }
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    const message = 'CORS policy violation'
    error = { message, statusCode: 403 }
  }

  // File size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large'
    error = { message, statusCode: 413 }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500
  const message = error.message || 'Server Error'

  // Prepare error response
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
    errorResponse.details = error
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id
  }

  res.status(statusCode).json(errorResponse)
}

export default errorHandler