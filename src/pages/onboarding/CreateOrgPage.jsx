import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrg } from '../../contexts/OrgContext';
import organizationsApi from '../../api/organizations.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import {
  Check, X, Truck, Package, ArrowLeft, Search, Loader2,
  Building2, ShieldCheck, MapPin, ArrowRight, Radar
} from 'lucide-react';
import { debounce } from '../../lib/utils';

/**
 * Create-org as a guided flow:
 *   carrier / owner-operator →  dot → searching → confirm → details
 *   shipper                  →  details (no FMCSA lookup)
 *
 * The FMCSA/LINQ step is pure prefill — it can be skipped, and a miss /
 * outage drops straight to manual `details`. It never blocks signup.
 */
export function CreateOrgPage() {
  const navigate = useNavigate();
  const { createOrg } = useOrg();
  const [params] = useSearchParams();

  const rawRole = params.get('role');
  const role =
    rawRole === 'shipper' ? 'shipper'
      : rawRole === 'owner_operator' ? 'owner_operator'
        : 'carrier';
  const isShipper = role === 'shipper';
  const isOwnerOp = role === 'owner_operator';
  // Owner-operators are one person ("me"); carriers/shippers are a
  // company/team ("us").
  const confirmYes = isOwnerOp ? "Yes, that’s me" : "Yes, that’s us";
  const confirmNo = isOwnerOp ? 'Not me — enter manually' : 'Not us — enter manually';

  // phase: 'dot' | 'searching' | 'confirm' | 'details'
  const [phase, setPhase] = useState(isShipper ? 'details' : 'dot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [softNote, setSoftNote] = useState(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [addr, setAddr] = useState({ line1: '', city: '', state: '', zip: '' });
  const [found, setFound] = useState(null);

  useEffect(() => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 30));
    }
  }, [name]);

  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugAvailable(null); return; }
    const check = debounce(async () => {
      setSlugChecking(true);
      try {
        const r = await organizationsApi.checkSlug(slug);
        setSlugAvailable(r.data.available);
      } catch { setSlugAvailable(false); }
      finally { setSlugChecking(false); }
    }, 500);
    check();
  }, [slug]);

  const runLookup = async () => {
    const dot = dotNumber.trim();
    if (!dot) return;
    setPhase('searching');
    setSoftNote(null);
    try {
      const res = await organizationsApi.carrierLookup(dot);
      if (res?.found) {
        setFound(res);
        setName(res.dba_name || res.legal_name || '');
        if (res.address) {
          setAddr({
            line1: res.address.line1 || '',
            city: res.address.city || '',
            state: res.address.state || '',
            zip: res.address.zip || ''
          });
        }
        setPhase('confirm');
      } else {
        setSoftNote(
          "We couldn't find that USDOT — no problem, just fill in your details below."
        );
        setPhase('details');
      }
    } catch {
      setSoftNote(
        'FMCSA lookup is unavailable right now — no problem, fill in your details below.'
      );
      setPhase('details');
    }
  };

  const skipLookup = () => {
    setFound(null);
    setSoftNote(null);
    setPhase('details');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const hasAddr = !isShipper && (addr.line1 || addr.city || addr.state || addr.zip);
      const org = await createOrg({
        name,
        slug,
        network_role: role,
        dot_number: isShipper ? undefined : (dotNumber || undefined),
        mc_number: isShipper ? undefined : (mcNumber || undefined),
        address: hasAddr
          ? { line1: addr.line1, city: addr.city, state: addr.state, zip: addr.zip, country: 'USA' }
          : undefined
      });
      navigate(`/o/${org.slug}/launcher`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const HeaderIcon = isShipper ? Package : Truck;
  const titleByPhase = {
    dot: "Let's find your company",
    searching: 'Searching FMCSA…',
    confirm: 'Is this you?',
    details: isShipper ? 'Set up your shipping company' : 'Set up your company'
  };
  const subByPhase = {
    dot: 'Enter your USDOT and we’ll pull your profile from FMCSA automatically.',
    searching: 'Pulling your carrier record from the LINQ network.',
    confirm: 'Confirm this is your company — you can edit anything next.',
    details: isShipper
      ? 'A few quick details so carriers can find you on the network.'
      : 'Review and finish — these details set up your profile.'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HeaderIcon className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-headline text-text-primary">{titleByPhase[phase]}</h1>
          <p className="text-body text-text-secondary mt-2">{subByPhase[phase]}</p>

          {!isShipper && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {['dot', 'confirm', 'details'].map((p, i) => {
                const order = { dot: 0, searching: 0, confirm: 1, details: 2 };
                const active = order[phase] >= i;
                return (
                  <div
                    key={p}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      active ? 'w-8 bg-accent' : 'w-4 bg-surface-tertiary'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: DOT entry ─────────────────────────────── */}
          {phase === 'dot' && (
            <motion.div
              key="dot"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <label className="block text-body-sm font-medium text-text-primary">
                      USDOT Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={dotNumber}
                      onChange={(e) => setDotNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && dotNumber.trim() && runLookup()}
                      placeholder="1234567"
                      className="w-full px-4 py-3 text-lg bg-surface-secondary text-text-primary border border-transparent rounded-input placeholder:text-text-tertiary focus:bg-white focus:border-accent focus:outline-none"
                    />
                    <p className="text-small text-text-tertiary">
                      We’ll auto-fill your company name and address. You don’t
                      verify ownership now — that happens later in MorPro Direct.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={runLookup}
                    disabled={!dotNumber.trim()}
                  >
                    <Search className="w-4 h-4 mr-1.5" />
                    Find my company
                  </Button>
                </CardContent>
              </Card>
              <button
                onClick={skipLookup}
                className="block w-full text-center mt-4 text-body-sm text-text-secondary hover:text-text-primary"
              >
                I don’t have a USDOT — set up manually
              </button>
            </motion.div>
          )}

          {/* ── STEP 1b: searching ────────────────────────────── */}
          {phase === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="py-14 flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 mb-5">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent/30"
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <div className="absolute inset-0 rounded-full bg-accent/10 flex items-center justify-center">
                      <Radar className="w-7 h-7 text-accent animate-pulse" />
                    </div>
                  </div>
                  <div className="text-body font-medium text-text-primary">
                    Searching LINQ for DOT {dotNumber}
                  </div>
                  <div className="text-body-sm text-text-secondary mt-1">
                    Pulling your FMCSA profile — this takes a few seconds.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: confirm identity ──────────────────────── */}
          {phase === 'confirm' && found && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-title-sm text-text-primary font-semibold">
                        {found.legal_name}
                      </div>
                      {found.dba_name && (
                        <div className="text-body-sm text-text-secondary">
                          dba {found.dba_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-body-sm">
                    {(found.address?.line1 || found.address?.city) && (
                      <Row icon={MapPin}>
                        {[
                          found.address.line1,
                          [found.address.city, found.address.state, found.address.zip]
                            .filter(Boolean).join(', ')
                        ].filter(Boolean).join(' · ')}
                      </Row>
                    )}
                    <Row icon={ShieldCheck}>
                      {[
                        found.authority_status && `Authority ${found.authority_status}`,
                        found.insurance_status && `Insurance ${found.insurance_status}`,
                        found.fleet_size && `${found.fleet_size} unit(s)`
                      ].filter(Boolean).join(' · ') || 'On file with FMCSA'}
                      {found.stub ? ' · (sandbox)' : ''}
                    </Row>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button className="w-full" onClick={() => setPhase('details')}>
                    {confirmYes}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                  <button
                    onClick={skipLookup}
                    className="w-full text-center py-2 text-body-sm text-text-secondary hover:text-text-primary"
                  >
                    {confirmNo}
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: details ───────────────────────────────── */}
          {phase === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6 pt-6">
                    {softNote && (
                      <p className="text-small text-text-secondary bg-warning/10 px-3 py-2 rounded-input">
                        {softNote}
                      </p>
                    )}
                    {found && (
                      <p className="text-small text-success bg-success/10 px-3 py-2 rounded-input flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Prefilled from FMCSA — edit anything below.
                      </p>
                    )}

                    <Input
                      label={isShipper ? 'Organization Name' : 'Company Name'}
                      placeholder="Acme Trucking Co."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus={!found}
                    />

                    <div className="space-y-2">
                      <label className="block text-body-sm font-medium text-text-primary">
                        Organization URL
                      </label>
                      <div className="flex items-center">
                        <span className="text-body-sm text-text-tertiary mr-1">tms.app/o/</span>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="acme-trucking"
                            className={`w-full px-3 py-2.5 pr-10 bg-surface-secondary text-text-primary border border-transparent rounded-input placeholder:text-text-tertiary transition-all focus:bg-white focus:border-accent focus:outline-none ${slugAvailable === false ? 'border-error' : ''} ${slugAvailable === true ? 'border-success' : ''}`}
                            required
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugChecking && <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                            {!slugChecking && slugAvailable === true && <Check className="w-4 h-4 text-success" />}
                            {!slugChecking && slugAvailable === false && <X className="w-4 h-4 text-error" />}
                          </div>
                        </div>
                      </div>
                      {slugAvailable === false && (
                        <p className="text-small text-error">This URL is already taken</p>
                      )}
                    </div>

                    {!isShipper && (
                      <>
                        <Input
                          label="Street Address"
                          placeholder="123 Main St"
                          value={addr.line1}
                          onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
                          hint="Optional"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <Input label="City" placeholder="Dallas" value={addr.city}
                            onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} />
                          <Input label="State" placeholder="TX" value={addr.state}
                            onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} />
                          <Input label="ZIP" placeholder="75201" value={addr.zip}
                            onChange={(e) => setAddr((a) => ({ ...a, zip: e.target.value }))} />
                        </div>
                        <Input
                          label="MC Number"
                          placeholder="123456"
                          value={mcNumber}
                          onChange={(e) => setMcNumber(e.target.value)}
                          hint="Optional"
                        />
                      </>
                    )}

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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          {phase === 'details' && !isShipper && (
            <button
              onClick={() => { setSoftNote(null); setPhase('dot'); }}
              className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to USDOT lookup
            </button>
          )}
          <p className="text-small text-text-tertiary">
            You can add more details and invite your team after setup.
          </p>
          <Link
            to={`/onboarding/path?role=${role}`}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Start over
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2 text-text-secondary">
      <Icon className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default CreateOrgPage;
