import axios from 'axios'
import { API_CONFIG, FEATURE_FLAGS } from '../config/environment'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracking
    config.metadata = { startTime: new Date() }
    
    // Log request in development
    if (FEATURE_FLAGS.LOGGING) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    if (FEATURE_FLAGS.LOGGING) {
      console.error('❌ Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime
    
    if (FEATURE_FLAGS.LOGGING) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Calculate request duration
    const duration = originalRequest.metadata ? new Date() - originalRequest.metadata.startTime : 0
    
    if (FEATURE_FLAGS.LOGGING) {
      console.error(`❌ API Error: ${originalRequest.method?.toUpperCase()} ${originalRequest.url} (${duration}ms)`, error.response?.data || error.message)
    }
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear stored token
      localStorage.removeItem('authToken')
      
      // Redirect to login or refresh token
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // Retry logic for network errors
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 0
    }
    
    if (!error.response && originalRequest._retryCount < API_CONFIG.RETRY_ATTEMPTS) {
      originalRequest._retryCount++
      
      if (FEATURE_FLAGS.LOGGING) {
        console.log(`🔄 Retrying request (${originalRequest._retryCount}/${API_CONFIG.RETRY_ATTEMPTS})`)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * originalRequest._retryCount))
      
      return api(originalRequest)
    }
    
    // Format error response
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
    const errorStatus = error.response?.status || 500
    
    // Create standardized error object
    const apiError = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
      isNetworkError: !error.response,
      timestamp: new Date().toISOString()
    }
    
    return Promise.reject(apiError)
  }
)

// API methods
export const apiClient = {
  // GET request
  get: (url, config = {}) => api.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => api.delete(url, config)
}

// Health check endpoint
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/api/health')
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: response.data
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}

// Error boundary helper
export const handleApiError = (error, fallbackMessage = 'Something went wrong') => {
  if (FEATURE_FLAGS.ERROR_REPORTING) {
    // Here you would send to error tracking service like Sentry
    console.error('API Error for tracking:', error)
  }
  
  // Return user-friendly message
  if (error.status >= 400 && error.status < 500) {
    return error.message || 'Invalid request'
  } else if (error.status >= 500) {
    return 'Server error. Please try again later.'
  } else if (error.isNetworkError) {
    return 'Network error. Please check your connection.'
  }
  
  return fallbackMessage
}

export default api