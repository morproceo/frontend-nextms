/**
 * DriverInviteAcceptPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - Uses useDriverInviteAccept API hook for invite operations
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TokenManager } from '../../api/client';
import { useDriverInviteAccept } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import {
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Building2
} from 'lucide-react';

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) }
];

export function DriverInviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser, setOrganizations } = useAuth();

  // Use API hook for invite operations
  const {
    inviteInfo,
    loadingInfo,
    infoError,
    fetchInviteInfo,
    acceptInvite,
    accepting,
    acceptError
  } = useDriverInviteAccept(token);

  const [status, setStatus] = useState('loading'); // loading, form, submitting, success, error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch invite info on mount
  useEffect(() => {
    if (token) {
      loadInviteInfo();
    }
  }, [token]);

  const loadInviteInfo = async () => {
    try {
      setStatus('loading');
      setError(null);

      const response = await fetchInviteInfo();

      // If user already has password, they can just accept
      if (response?.has_password) {
        // Auto-accept for users with existing passwords
        await acceptInvitation();
      } else {
        setStatus('form');
      }
    } catch (err) {
      console.error('Failed to fetch invite info:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Invalid or expired invitation';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const acceptInvitation = async (passwordToSubmit = null) => {
    try {
      setStatus('submitting');
      setError(null);

      const response = await acceptInvite(passwordToSubmit);

      // Store the tokens
      if (response?.tokens) {
        TokenManager.setTokens(
          response.tokens.accessToken,
          response.tokens.refreshToken
        );
        // Update auth context
        setUser(response.user);
        setOrganizations(response.organizations);
      }

      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to accept invitation';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check all requirements met
    const allMet = PASSWORD_REQUIREMENTS.every(req => req.test(password));
    if (!allMet) {
      setError('Please meet all password requirements');
      return;
    }

    await acceptInvitation(password);
  };

  const handleGoToDriverPortal = () => {
    navigate('/driver');
  };

  // Loading state
  if (status === 'loading' || status === 'submitting') {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-title text-text-primary">
            {status === 'loading' ? 'Loading invitation...' : 'Setting up your account...'}
          </h2>
          <p className="text-body-sm text-text-secondary mt-2">
            Please wait a moment.
          </p>
        </Card>
      </div>
    );
  }

  // Password form state
  if (status === 'form' && inviteInfo) {
    const requirementsMet = PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      met: req.test(password)
    }));

    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-headline text-text-primary">TMS</h1>
            <p className="text-body text-text-secondary mt-2">
              Driver Portal
            </p>
          </div>

          <Card className="p-8">
            {/* Organization badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-accent" />
              <span className="text-body font-semibold text-text-primary">
                {inviteInfo.organization.name}
              </span>
            </div>

            <h2 className="text-title text-text-primary text-center mb-2">
              Welcome, {inviteInfo.user.first_name || 'Driver'}!
            </h2>

            <p className="text-body-sm text-text-secondary text-center mb-6">
              Create a password to claim your driver account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Email
                </label>
                <div className="px-3 py-2 bg-surface-secondary rounded-card text-body text-text-primary">
                  {inviteInfo.user.email}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null}
                />
              </div>

              {/* Requirements checklist */}
              <div className="bg-surface-secondary rounded-card p-4">
                <p className="text-small font-medium text-text-secondary mb-2">
                  Password requirements:
                </p>
                <ul className="space-y-1">
                  {requirementsMet.map(req => (
                    <li key={req.id} className="flex items-center gap-2 text-small">
                      {req.met ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <X className="w-4 h-4 text-text-tertiary" />
                      )}
                      <span className={req.met ? 'text-success' : 'text-text-tertiary'}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="bg-error/10 text-error text-body-sm p-3 rounded-card">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!password || !confirmPassword || password !== confirmPassword}
              >
                Claim My Account
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-small text-text-tertiary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          <h1 className="text-headline text-text-primary mb-2">
            Welcome to the Team!
          </h1>

          <p className="text-body text-text-secondary mb-6">
            You've successfully joined{' '}
            <span className="font-semibold text-text-primary">
              {result?.organizations?.[0]?.name || inviteInfo?.organization?.name || 'the organization'}
            </span>{' '}
            as a driver.
          </p>

          {result?.driver && (
            <div className="bg-surface-secondary rounded-card p-4 mb-6 text-left">
              <p className="text-small text-text-tertiary mb-1">Your Profile</p>
              <p className="text-body font-medium text-text-primary">
                {result.driver.first_name} {result.driver.last_name}
              </p>
            </div>
          )}

          <Button onClick={handleGoToDriverPortal} className="w-full">
            Go to Driver Portal
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-8">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-error" />
        </div>

        <h1 className="text-headline text-text-primary mb-2">
          Unable to Accept Invitation
        </h1>

        <p className="text-body text-text-secondary mb-6">
          {error || 'This invitation may have expired or already been used.'}
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        </div>

        <p className="text-small text-text-tertiary mt-6">
          If you continue to have problems, please contact your dispatcher or administrator.
        </p>
      </Card>
    </div>
  );
}

export default DriverInviteAcceptPage;
