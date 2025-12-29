import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { Router } from './Router';

export function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <Router />
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
