import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-text-primary text-center">
          <div className="glass-panel-elevated p-8 rounded-3xl max-w-md w-full border border-blossom/20 shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              An unexpected error occurred while rendering this view. Your session and rooms are safe.
            </p>

            {this.state.error && (
              <div className="w-full p-3 mb-6 rounded-xl bg-surface-muted/60 border border-white/5 text-left overflow-x-auto text-[11px] font-mono text-rose-300">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-lg shadow-accent/25 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="flex-1 py-3 rounded-xl bg-surface-muted hover:bg-surface-hover text-text-primary text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
