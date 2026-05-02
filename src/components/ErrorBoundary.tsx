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
            The application encountered a critical error. This is often caused by old session data or restrictive browser settings.
          </p>
          <pre style={{
            padding: '1rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            maxWidth: '100%',
            overflowX: 'auto',
            textAlign: 'left',
            marginBottom: '2rem'
          }}>
            {this.state.error?.message}
          </pre>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                // Keep cloud tokens but wipe everything else
                const token = localStorage.getItem('exam_cloud_token');
                const user = localStorage.getItem('exam_cloud_user');
                localStorage.clear();
                if (token) localStorage.setItem('exam_cloud_token', token);
                if (user) localStorage.setItem('exam_cloud_user', user);
                window.location.href = '/dashboard';
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue in Cloud Mode
            </button>

            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1e293b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Everything & Restart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
