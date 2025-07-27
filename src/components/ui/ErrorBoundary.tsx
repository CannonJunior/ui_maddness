import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * provides fallback UI, and logs error information for debugging.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Log error details
    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when children change (for HMR updates)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ 
        hasError: false, 
        error: null,
        errorInfo: null 
      });
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
          </div>
          
          <p className="text-sm text-red-600 mb-4">
            This component encountered an error and couldn't render properly.
          </p>

          {/* Error Details */}
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800 mb-2">
                Show Error Details
              </summary>
              <div className="bg-red-100 border border-red-300 rounded p-3 text-xs">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div className="mb-2">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 overflow-auto max-h-32 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 overflow-auto max-h-32 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={this.resetError}
              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          </div>

          {/* Development Mode Info */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <strong>Development Mode:</strong> This error boundary is showing detailed 
              error information because you're in development mode. In production, 
              users would see a more user-friendly error message.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;