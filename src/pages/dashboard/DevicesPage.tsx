import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Watch, CheckCircle2, RefreshCw, Unplug, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PROVIDERS } from '../../services/wearables';
import { useConnections } from '../../hooks/useConnections';
import { completeGoogleHealthConnect } from '../../services/googleHealth';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const DevicesPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { connections, busy, isConnected, connect, sync, disconnect, refresh } = useConnections();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [completingOAuth, setCompletingOAuth] = useState(false);
  const handledCode = useRef<string | null>(null);

  // Google redirects back here with ?code=... (or ?error=...) after consent.
  useEffect(() => {
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      toast.error(`Google Health connection was cancelled or denied (${oauthError}).`);
      navigate('/dashboard/devices', { replace: true });
      return;
    }
    if (!code || handledCode.current === code) return;
    handledCode.current = code;

    setCompletingOAuth(true);
    completeGoogleHealthConnect(code)
      .then(() => {
        toast.success('Google Health connected — syncing your data');
        return refresh();
      })
      .catch((e) => {
        console.error(e);
        toast.error(e instanceof Error ? e.message : 'Could not complete the Google Health connection.');
      })
      .finally(() => {
        setCompletingOAuth(false);
        navigate('/dashboard/devices', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Devices</h1>
        <p className="mt-1 text-sm text-ink-muted">Connect wearables to power your Health Score, steps, sleep, and body composition</p>
      </motion.div>

      {completingOAuth && (
        <motion.div variants={item} className="mb-5 flex items-center gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 p-4 text-sm text-ink-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary-400" />
          Completing your Google Health connection…
        </motion.div>
      )}

      <motion.div variants={item} className="mb-5 rounded-xl border border-hydration-500/25 bg-hydration-500/10 p-4 text-sm text-ink-muted">
        Google Health Connect isn't listed here — it's an Android-only system service and has no web API, so it can't sync
        to a browser-based app. "Fitbit (via Google Health)" below is the new cloud API Google is replacing the legacy
        Fitbit Web API with.
      </motion.div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const connected = isConnected(provider.id);
          const row = connections.find((c) => c.provider === provider.id);
          const isBusy = busy === provider.id;

          return (
            <motion.div key={provider.id} variants={item}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                      <Watch className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-ink">{provider.name}</h3>
                        {connected && (
                          <Badge tone="success">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                          </Badge>
                        )}
                        {provider.availability === 'needs-setup' && (
                          <Badge tone="neutral">
                            <Lock className="h-3 w-3" /> Requires setup
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{provider.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {provider.metrics.map((m) => (
                          <Badge key={m} tone="neutral">{m}</Badge>
                        ))}
                      </div>
                      {connected && row?.last_sync_at && (
                        <p className="mt-2 text-xs text-ink-faint">Last synced {new Date(row.last_sync_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 gap-2">
                    {provider.availability === 'ready' ? (
                      connected ? (
                        <>
                          <Button variant="subtle" size="sm" loading={isBusy} onClick={() => sync(provider.id)}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Sync
                          </Button>
                          <Button variant="ghost" size="sm" loading={isBusy} onClick={() => disconnect(provider.id)}>
                            <Unplug className="mr-1.5 h-3.5 w-3.5" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" loading={isBusy} onClick={() => connect(provider.id)}>
                          Connect
                        </Button>
                      )
                    ) : (
                      <Button variant="subtle" size="sm" disabled>
                        Requires setup
                      </Button>
                    )}
                  </div>
                </div>

                {provider.availability === 'needs-setup' && provider.setupSteps && (
                  <div className="mt-4 rounded-xl bg-surface-2 p-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">To enable this integration</p>
                    <ol className="space-y-1 text-xs text-ink-muted">
                      {provider.setupSteps.map((step, i) => (
                        <li key={i}>{i + 1}. {step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DevicesPage;
