import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { securityLogger } from '../config/logger.js'

// Rate limiting configuration
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: message || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      })
      
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      })
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.url === '/api/health'
    }
  })
}

// General rate limiting
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per windowMs
  'Too many requests, please try again later.'
)

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
)

// API rate limiting
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests per windowMs
  'API rate limit exceeded, please try again later.'
)

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
})

// MongoDB injection prevention
export const mongoSanitization = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    securityLogger('MongoDB injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      sanitizedKey: key
    })
  }
})

// Request size limiting
export const requestSizeLimit = (req, res, next) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    securityLogger('Request size limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      contentLength: req.headers['content-length'],
      maxSize
    })
    
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: `${Math.floor(maxSize / 1024 / 1024)}MB`
    })
  }
  
  next()
}

// IP whitelist/blacklist middleware
export const ipFilter = (req, res, next) => {
  const clientIP = req.ip
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || []
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || []
  
  // Check blacklist
  if (blacklistedIPs.includes(clientIP)) {
    securityLogger('Blacklisted IP access attempt', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    })
    
    return res.status(403).json({
      error: 'Access denied'
    })
  }
  
  // Check whitelist (if configured)
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
    securityLogger('Non-whitelisted IP access attempt', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    })
    
    return res.status(403).json({
      error: 'Access denied'
    })
  }
  
  next()
}

// Suspicious activity detection
export const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/var\/|\/usr\/|\/bin\/)/i, // Path traversal
    /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection
    /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS attempts
    /(cmd=|exec=|system=|passthru=)/i, // Command injection
  ]
  
  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  })
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData))
  
  if (isSuspicious) {
    securityLogger('Suspicious activity detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      query: req.query,
      body: req.body
    })
    
    return res.status(400).json({
      error: 'Invalid request detected'
    })
  }
  
  next()
}

// CORS configuration
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      securityLogger('CORS violation', {
        origin,
        allowedOrigins
      })
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}

// Security middleware stack
export const securityMiddleware = [
  securityHeaders,
  mongoSanitization,
  requestSizeLimit,
  ipFilter,
  suspiciousActivityDetection
]

export default {
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  securityHeaders,
  mongoSanitization,
  requestSizeLimit,
  ipFilter,
  suspiciousActivityDetection,
  corsOptions,
  securityMiddleware
}