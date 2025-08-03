import React from 'react'
import { FEATURE_FLAGS, APP_CONFIG } from '../config/environment'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Report error to monitoring service in production
    if (FEATURE_FLAGS.ERROR_REPORTING) {
      this.reportError(error, errorInfo)
    }
  }

  reportError = (error, errorInfo) => {
    // Here you would send to error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
      appVersion: APP_CONFIG.VERSION,
      environment: APP_CONFIG.ENVIRONMENT
    }
    
    console.error('Error Report:', errorReport)
    
    // Example: Send to Sentry
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack
    //     }
    //   },
    //   tags: {
    //     section: 'error_boundary'
    //   }
    // })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>Oops! Something went wrong</h1>
            <p>We're sorry, but something unexpected happened.</p>
            
            {APP_CONFIG.ENVIRONMENT === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReload} className="btn btn-primary">
                Reload Page
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary">
                Go Home
              </button>
            </div>
            
            <p className="error-help">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary