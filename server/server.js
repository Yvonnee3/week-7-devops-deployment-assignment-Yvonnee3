import express from 'express'
import cors from 'cors'
import compression from 'compression'
import dotenv from 'dotenv'
import connectDB, { checkDatabaseHealth, getDatabaseStats } from './config/database.js'
import logger, { httpLogger } from './config/logger.js'
import { 
  generalRateLimit, 
  apiRateLimit, 
  corsOptions, 
  securityMiddleware 
} from './middleware/security.js'
import errorHandler from './middleware/errorHandler.js'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET']
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars)
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1)

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

// Security middleware
app.use(securityMiddleware)

// CORS configuration
app.use(cors(corsOptions))

// Rate limiting
app.use(generalRateLimit)
app.use('/api', apiRateLimit)

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '5mb',
  strict: true
}))
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FILE_SIZE || '5mb'
}))

// HTTP logging
app.use(httpLogger)

// Health check endpoint (before other routes)
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth()
    const serverHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth
    }

    // Include database stats in development
    if (process.env.NODE_ENV === 'development') {
      try {
        serverHealth.databaseStats = await getDatabaseStats()
      } catch (error) {
        logger.warn('Failed to get database stats for health check:', error.message)
      }
    }

    const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded'
    const statusCode = overallStatus === 'healthy' ? 200 : 503

    res.status(statusCode).json({
      status: overallStatus,
      ...serverHealth
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Readiness probe for Kubernetes/Docker
app.get('/api/ready', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth()
    if (dbHealth.status === 'healthy') {
      res.status(200).json({ status: 'ready' })
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database not healthy' })
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: error.message })
  }
})

// Liveness probe for Kubernetes/Docker
app.get('/api/live', (req, res) => {
  res.status(200).json({ status: 'alive' })
})

// API routes (will be added here)
// app.use('/api/auth', authRoutes)
// app.use('/api/users', userRoutes)
// app.use('/api/tasks', taskRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MERN Stack API Server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health'
  })
})

// 404 handler for undefined routes
app.use('*', (req, res) => {
  logger.warn('404 - Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/ready',
      'GET /api/live'
    ]
  })
})

// Global error handler (must be last middleware)
app.use(errorHandler)

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err)
      process.exit(1)
    }
    
    logger.info('Server closed successfully')
    process.exit(0)
  })
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      })
    })

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`)
        process.exit(1)
      } else {
        logger.error('Server error:', error)
      }
    })

    // Graceful shutdown listeners
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error)
      gracefulShutdown('UNCAUGHT_EXCEPTION')
    })
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown('UNHANDLED_REJECTION')
    })

    return server

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
const server = await startServer()

export default app