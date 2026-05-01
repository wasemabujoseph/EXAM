import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            The application crashed. This might be due to a local data error or a missing configuration.
          </p>
          <pre style={{
            padding: '1rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            maxWidth: '100%',
            overflowX: 'auto',
            textAlign: 'left'
          }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1e293b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Clear Data & Restart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
