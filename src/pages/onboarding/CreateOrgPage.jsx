import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import organizationsApi from '../../api/organizations.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Check, X, Building2 } from 'lucide-react';
import { debounce } from '../../lib/utils';

export function CreateOrgPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrg } = useOrg();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setSlug(generated);
    }
  }, [name]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const checkSlug = debounce(async () => {
      setSlugChecking(true);
      try {
        const response = await organizationsApi.checkSlug(slug);
        setSlugAvailable(response.data.available);
      } catch (err) {
        setSlugAvailable(false);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    checkSlug();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const org = await createOrg({
        name,
        slug,
        dot_number: dotNumber || undefined,
        mc_number: mcNumber || undefined
      });

      // Navigate to new org dashboard
      navigate(`/o/${org.slug}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-headline text-text-primary">Create your organization</h1>
          <p className="text-body text-text-secondary mt-2">
            Set up your company to start managing loads, drivers, and dispatch.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Organization Name */}
              <Input
                label="Organization Name"
                placeholder="Acme Trucking Co."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              {/* Slug / URL */}
              <div className="space-y-2">
                <label className="block text-body-sm font-medium text-text-primary">
                  Organization URL
                </label>
                <div className="flex items-center">
                  <span className="text-body-sm text-text-tertiary mr-1">
                    tms.app/o/
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="acme-trucking"
                      className={`
                        w-full px-3 py-2.5 pr-10
                        bg-surface-secondary text-text-primary
                        border border-transparent rounded-input
                        placeholder:text-text-tertiary
                        transition-all duration-200
                        focus:bg-white focus:border-accent focus:outline-none
                        ${slugAvailable === false ? 'border-error' : ''}
                        ${slugAvailable === true ? 'border-success' : ''}
                      `}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugChecking && (
                        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      )}
                      {!slugChecking && slugAvailable === true && (
                        <Check className="w-4 h-4 text-success" />
                      )}
                      {!slugChecking && slugAvailable === false && (
                        <X className="w-4 h-4 text-error" />
                      )}
                    </div>
                  </div>
                </div>
                {slugAvailable === false && (
                  <p className="text-small text-error">This URL is already taken</p>
                )}
              </div>

              {/* DOT / MC Numbers (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="DOT Number"
                  placeholder="1234567"
                  value={dotNumber}
                  onChange={(e) => setDotNumber(e.target.value)}
                  hint="Optional"
                />
                <Input
                  label="MC Number"
                  placeholder="123456"
                  value={mcNumber}
                  onChange={(e) => setMcNumber(e.target.value)}
                  hint="Optional"
                />
              </div>

              {error && (
                <p className="text-body-sm text-error bg-error/10 px-4 py-3 rounded-input">
                  {error}
                </p>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!name || !slug || slug.length < 3 || slugAvailable === false}
              >
                Create Organization
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-small text-text-tertiary">
          You can add more details and invite team members after setup.
        </p>
      </div>
    </div>
  );
}

export default CreateOrgPage;
