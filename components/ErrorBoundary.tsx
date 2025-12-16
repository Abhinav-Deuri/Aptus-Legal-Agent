import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  t: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800 text-center animate-scale-in">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 dark:text-red-400" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              The application encountered an unexpected error. We apologize for the inconvenience.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32">
               <code className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                 {this.state.error?.message}
               </code>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;