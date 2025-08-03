// Environment configuration for different deployment stages
const config = {
  development: {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    NODE_ENV: 'development',
    ENABLE_LOGGING: true,
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: false
  },
  
  staging: {
    API_URL: import.meta.env.VITE_API_URL || 'https://your-staging-api.onrender.com',
    NODE_ENV: 'staging',
    ENABLE_LOGGING: true,
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: true
  },
  
  production: {
    API_URL: import.meta.env.VITE_API_URL || 'https://your-production-api.onrender.com',
    NODE_ENV: 'production',
    ENABLE_LOGGING: false,
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true
  }
}

// Get current environment
const getCurrentEnvironment = () => {
  const env = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development'
  return config[env] || config.development
}

// Export current configuration
export const ENV = getCurrentEnvironment()

// Export specific configurations
export const API_CONFIG = {
  BASE_URL: ENV.API_URL,
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'MERN App',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: ENV.NODE_ENV
}

export const FEATURE_FLAGS = {
  ANALYTICS: ENV.ENABLE_ANALYTICS && import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ERROR_REPORTING: ENV.ENABLE_ERROR_REPORTING && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  LOGGING: ENV.ENABLE_LOGGING
}

// Validation for required environment variables
const requiredEnvVars = ['VITE_API_URL']

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    if (ENV.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
  
  return true
}