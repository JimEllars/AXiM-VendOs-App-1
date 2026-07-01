import React from 'react';
import SafeIcon from '../../common/SafeIcon';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }


  async logErrorToService(error, errorInfo) {
    const payload = {
      message: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    console.error("[AXiM Observability Queue]", JSON.stringify(payload, null, 2));
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-axim-charcoal border border-axim-steel rounded-xl p-5 h-full flex flex-col items-center justify-center text-center">
           <SafeIcon name="FiAlertTriangle" className="text-axim-crimson text-3xl mb-2" />
           <p className="text-white font-medium mb-1">AXiM System Error</p>
           <p className="text-xs text-gray-400">Component failed to load.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
