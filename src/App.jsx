import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { ToastProvider } from './contexts/ToastContext';
import { Router } from './Router';

export function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
