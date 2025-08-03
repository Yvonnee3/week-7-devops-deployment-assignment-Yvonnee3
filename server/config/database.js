import mongoose from 'mongoose'
import logger from './logger.js'

const connectDB = async () => {
  try {
    // MongoDB connection options for production
    const options = {
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Replica set settings
      retryWrites: true,
      w: 'majority',
      
      // Additional options for production
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    // Use test database in test environment
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables')
    }

    logger.info('Connecting to MongoDB...', { 
      uri: mongoURI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      environment: process.env.NODE_ENV 
    })

    const conn = await mongoose.connect(mongoURI, options)

    logger.info('MongoDB Connected Successfully', {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
      readyState: conn.connection.readyState
    })

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close()
        logger.info('MongoDB connection closed through app termination')
        process.exit(0)
      } catch (err) {
        logger.error('Error during MongoDB disconnection:', err)
        process.exit(1)
      }
    })

    return conn

  } catch (error) {
    logger.error('Database connection failed:', {
      message: error.message,
      stack: error.stack
    })
    
    // Exit process with failure in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    
    throw error
  }
}

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }

    if (state === 1) {
      // Perform a simple database operation to verify connectivity
      await mongoose.connection.db.admin().ping()
      
      return {
        status: 'healthy',
        state: states[state],
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      }
    } else {
      return {
        status: 'unhealthy',
        state: states[state],
        message: 'Database connection is not active'
      }
    }
  } catch (error) {
    logger.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

// Database statistics for monitoring
export const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected')
    }

    const db = mongoose.connection.db
    const stats = await db.stats()
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects
    }
  } catch (error) {
    logger.error('Failed to get database stats:', error)
    throw error
  }
}

export default connectDB