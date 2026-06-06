import React from 'react';

export class ErrorBoundary extends React.Component<any, { hasError: boolean, error: Error | null, errorInfo: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'white', color: 'red', border: '2px solid red', borderRadius: '8px', margin: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>React Runtime Error</h1>
          <p><strong>Message:</strong> {this.state.error?.message}</p>
          <pre style={{ background: '#f8d7da', padding: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ background: '#f8d7da', padding: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}
