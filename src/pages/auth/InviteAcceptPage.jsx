/**
 * InviteAcceptPage - Handles organization member invitation acceptance
 *
 * Flow:
 * 1. If logged in → auto-accept invite → redirect to dashboard
 * 2. If not logged in → show friendly message + Login button
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { CheckCircle, XCircle, Building2, Mail } from 'lucide-react';

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState('loading'); // loading, accepting, success, error, login_required
  const [error, setError] = useState(null);
  const [orgName, setOrgName] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('login_required');
      return;
    }

    acceptInvite();
  }, [user, authLoading, token]);

  const acceptInvite = async () => {
    setStatus('accepting');
    try {
      const response = await api.post(`/v1/organizations/invitations/${token}/accept`);
      const data = response.data?.data || response.data;
      setOrgName(data?.organization?.name || 'your organization');
      setStatus('success');

      // Redirect to dashboard after a moment
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to accept invitation';

      // If already accepted, just redirect
      if (msg.includes('no longer valid') || msg.includes('already')) {
        window.location.href = '/';
        return;
      }

      setError(msg);
      setStatus('error');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'login_required' && (
            <>
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                You've been invited!
              </h1>
              <p className="text-body-sm text-text-secondary mb-2">
                Someone invited you to join their organization on neXt TMS.
              </p>
              <p className="text-body-sm text-text-secondary mb-6">
                Sign in with the email the invite was sent to.
              </p>

              <Link to={`/login?redirect=/invitations/${token}/accept`}>
                <Button className="w-full mb-3">
                  <Mail className="w-4 h-4 mr-2" />
                  Sign In to Accept
                </Button>
              </Link>

              <p className="text-small text-text-tertiary">
                Don't have an account? <Link to={`/signup?redirect=/invitations/${token}/accept`} className="text-accent hover:text-accent/80">Sign up here</Link>
              </p>
            </>
          )}

          {status === 'accepting' && (
            <>
              <Spinner size="lg" className="mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-text-primary mb-2">Accepting invitation...</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">You're in!</h1>
              <p className="text-body-sm text-text-secondary mb-4">
                Welcome to <strong>{orgName}</strong>. Taking you to the dashboard...
              </p>
              <Spinner size="sm" className="mx-auto" />
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h1>
              <p className="text-body-sm text-error mb-6">{error}</p>
              <Button onClick={acceptInvite} className="w-full mb-3">Try Again</Button>
              <Link to="/">
                <Button variant="secondary" className="w-full">Go to Dashboard</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InviteAcceptPage;
