import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto p-6 mt-10 box">
        <h1 className="text-2xl font-extrabold uppercase">Something broke</h1>
        <p className="mt-3 font-mono text-sm text-hot break-words">{String(this.state.error.message || this.state.error)}</p>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </ErrorBoundary>
);
