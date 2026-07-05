import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-carmine/10 border border-carmine/20 flex items-center justify-center mb-5">
            <AlertTriangle size={26} className="text-carmine" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-base font-semibold text-ink mb-1.5">
            Something went wrong
          </h3>
          <p className="text-sm text-ink-muted max-w-sm leading-relaxed mb-5">
            An unexpected error occurred. Try refreshing the page or click retry below.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-ink font-display font-semibold text-sm hover:bg-white/[0.1] transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          {this.state.error && (
            <p className="mt-4 text-xs text-ink-faint font-mono max-w-md break-all">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
