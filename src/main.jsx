import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '', errorStack: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString(), errorStack: error.stack };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CATASTROPHIC REACT CRASH:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', backgroundColor: 'purple', padding: '20px', minHeight: '100vh', width: '100vw', boxSizing: 'border-box', overflowY: 'auto' }}>
          <h2>REACT CRASHED!</h2>
          <p style={{fontFamily: 'monospace'}}>{this.state.errorMsg}</p>
          <pre style={{fontSize: '10px'}}>{this.state.errorStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
