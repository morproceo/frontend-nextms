import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { ToastProvider } from './contexts/ToastContext';
import { MigrationStatusBanner } from './components/migration/MigrationStatusBanner';
import { MigrationToastBridge } from './components/migration/MigrationToastBridge';
import { Router } from './Router';

export function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <ToastProvider>
          <MigrationToastBridge />
          <MigrationStatusBanner />
          <Router />
        </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
