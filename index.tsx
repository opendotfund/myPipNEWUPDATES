import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';

const PUBLISHABLE_KEY = 'pk_test_c3dlZXQtc3VuYmlyZC0yNC5jbGVyay5hY2NvdW50cy5kZXYk';
const FRONTEND_API = 'sweet-sunbird-24.clerk.accounts.dev';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} frontendApi={FRONTEND_API}>
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
    