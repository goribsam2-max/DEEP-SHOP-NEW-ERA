
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { setupProtection } from './protection';
setupProtection();
import App from './App';
import { RegionProvider } from './components/RegionContext';
import ErrorBoundary from './components/ErrorBoundary';
import { sendSystemAlertToTelegram } from './services/telegram';

// Suppress benign ResizeObserver errors that can cause unhandled overlays
const debounce = (cb: any) => {
  let frame: any;
  return (...args: any) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      cb(...args);
    });
  };
};

const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
  constructor(callback: any) {
    super(debounce(callback));
  }
};

window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('ResizeObserver loop completed with undelivered notifications.') || e.message.includes('ResizeObserver loop limit exceeded'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }
  // Global error handler
  try {
    sendSystemAlertToTelegram(`Global Error: ${e.message}`, e.error?.stack || 'No stack trace available');
  } catch (err) {
    console.error('Failed to dispatch to telegram', err);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  try {
    const errorMsg = e.reason?.message || (typeof e.reason === 'string' ? e.reason : 'Unhandled Promise Rejection');
    if (errorMsg.includes('Failed to register a ServiceWorker')) {
        return; // Ignore benign PWA registration errors
    }
    const stack = e.reason?.stack || 'No stack trace';
    sendSystemAlertToTelegram(`Unhandled Rejection: ${errorMsg}`, stack);
  } catch (err) {
    console.error('Failed to dispatch to telegram', err);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
import { HelmetProvider } from 'react-helmet-async';
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <RegionProvider>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </RegionProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
