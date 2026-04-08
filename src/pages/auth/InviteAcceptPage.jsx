/**
 * InviteAcceptPage - Handles organization member invitation acceptance
 *
 * When a user clicks an invite link from email, this page:
 * 1. If logged in: calls POST /v1/organizations/invitations/:token/accept
 * 2. If not logged in: redirects to login with return URL
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { CheckCircle, XCircle, LogIn, Building2 } from 'lucide-react';

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

    // User is logged in — accept the invite
    acceptInvite();
  }, [user, authLoading, token]);

  const acceptInvite = async () => {
    setStatus('accepting');
    try {
      const response = await api.post(`/v1/organizations/invitations/${token}/accept`);
      const data = response.data?.data || response.data;
      setOrgName(data?.organization?.name || data?.orgName || 'the organization');
      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to accept invitation';
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
                <LogIn className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">Sign in to accept invite</h1>
              <p className="text-body-sm text-text-secondary mb-6">
                You need to sign in or create an account to accept this invitation.
              </p>
              <div className="space-y-3">
                <Link to={`/login?redirect=/invitations/${token}/accept`}>
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link to={`/signup?redirect=/invitations/${token}/accept`}>
                  <Button variant="secondary" className="w-full">Create Account</Button>
                </Link>
              </div>
            </>
          )}

          {status === 'accepting' && (
            <>
              <Spinner size="lg" className="mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-text-primary mb-2">Accepting invitation...</h1>
              <p className="text-body-sm text-text-secondary">Please wait</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">Invitation accepted!</h1>
              <p className="text-body-sm text-text-secondary mb-4">
                You've joined <strong>{orgName}</strong>. Redirecting to dashboard...
              </p>
              <Spinner size="sm" className="mx-auto" />
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">Unable to accept invitation</h1>
              <p className="text-body-sm text-error mb-6">{error}</p>
              <div className="space-y-3">
                <Button onClick={acceptInvite} className="w-full">Try Again</Button>
                <Link to="/">
                  <Button variant="secondary" className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InviteAcceptPage;
