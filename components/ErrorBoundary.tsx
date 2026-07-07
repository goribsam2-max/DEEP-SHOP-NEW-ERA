import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { sendSystemAlertToTelegram } from '../services/telegram';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  reported: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    reported: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, reported: false };
  }

  public async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('An unexpected error occurred.', error, errorInfo);
    try {
      await sendSystemAlertToTelegram(error.message, errorInfo.componentStack || '');
      this.setState({ reported: true });
    } catch (e) {
      console.error('Failed to send error alert', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
              <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <Icon name="exclamation-triangle" className="text-4xl" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">Oops! Something went wrong.</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-4 leading-relaxed">
                 {(this.state as any).error?.message || "We've encountered an unexpected issue."}
              </p>
              
              {this.state.reported && (
                <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <Icon name="check-circle" className="text-sm" />
                  Report automatically sent to the team.
                </div>
              )}

              <button onClick={() => window.location.href = '/'} className="px-8 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full hover:bg-black dark:hover:bg-zinc-200 transition-colors shadow-md text-sm">
                 Return Home
              </button>
           </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
