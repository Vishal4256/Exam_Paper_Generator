import React from 'react';
import { AlertTriangle, RefreshCcw, ChevronDown } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // ── FULL DIAGNOSTIC OUTPUT ────────────────────────────────────────
        console.group('%c🚨 ErrorBoundary caught a crash', 'color: red; font-size: 14px; font-weight: bold');
        console.error('error.message:', error.message);
        console.error('error.stack:\n', error.stack);
        console.error('componentStack:\n', errorInfo.componentStack);
        console.groupEnd();
        // ─────────────────────────────────────────────────────────────────
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails } = this.state;
            const isDev = import.meta.env?.DEV ?? false;

            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-4">
                            An unexpected error occurred in this section of the application.
                        </p>

                        {/* Always show the error message */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left">
                            <p className="text-sm font-bold text-red-700 mb-1">Error:</p>
                            <p className="text-sm font-mono text-red-600 break-all">{error?.message}</p>
                        </div>

                        {/* Show full stack in dev OR when toggled */}
                        {(isDev || showDetails) && errorInfo && (
                            <div className="bg-gray-900 rounded-xl p-4 mb-4 text-left overflow-auto max-h-64">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Component Stack</p>
                                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                                    {errorInfo.componentStack}
                                </pre>
                                <p className="text-xs font-bold text-gray-400 mb-2 mt-3 uppercase tracking-wider">JS Stack</p>
                                <pre className="text-xs text-yellow-300 whitespace-pre-wrap font-mono">
                                    {error?.stack}
                                </pre>
                            </div>
                        )}

                        {!isDev && (
                            <button
                                onClick={() => this.setState({ showDetails: !showDetails })}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mx-auto mb-4 transition-colors"
                            >
                                <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                                {showDetails ? 'Hide' : 'Show'} error details
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
