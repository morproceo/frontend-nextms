import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { ToastProvider } from './contexts/ToastContext';
import { Router } from './Router';
import { Analytics } from '@vercel/analytics/react';

export function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <ToastProvider>
          <Router />
          <Analytics />
        </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
