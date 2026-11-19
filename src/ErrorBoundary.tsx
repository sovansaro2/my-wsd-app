import React, { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { systemLogger } from './lib/logger';

interface Props {
  children?: ReactNode;
}

interface State {
  error: Error | null;
}

const isModuleFetchError = (error: Error | null) => {
  if (!error) return false;
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(
    error.message || ''
  );
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    systemLogger.error(error.message, errorInfo.componentStack);

    if (isModuleFetchError(error) && typeof window !== 'undefined') {
      try {
        const key = 'error_boundary_module_reload';
        if (sessionStorage.getItem(key) !== '1') {
          sessionStorage.setItem(key, '1');
          window.location.reload();
        }
      } catch {}
    }
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('error_boundary_module_reload');
    } catch {}
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ error: null });
  };

  public render() {
    if (this.state.error) {
      const chunkError = isModuleFetchError(this.state.error);
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="font-title text-xl text-slate-900 dark:text-white">
              {chunkError ? 'ត្រូវការផ្ទុកទំព័រឡើងវិញ' : 'មានបញ្ហាបច្ចេកទេសបណ្តោះអាសន្ន'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {chunkError
                ? 'ទំព័រនេះមានការធ្វើបច្ចុប្បន្នភាពថ្មី ឬបណ្តាញអ៊ីនធឺណិតរអាក់រអួល។ សូមចុចផ្ទុកឡើងវិញដើម្បីបន្ត។'
                : this.state.error.message}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                សាកល្បងម្តងទៀត
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ផ្ទុកឡើងវិញ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
