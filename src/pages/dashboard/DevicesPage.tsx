import React from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Watch, CheckCircle2, RefreshCw, Unplug, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PROVIDERS } from '../../services/wearables';
import { useConnections } from '../../hooks/useConnections';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const DevicesPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { connections, busy, isConnected, connect, sync, disconnect } = useConnections();

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-white">Devices</h1>
        <p className="mt-1 text-sm text-gray-400">Connect wearables to power your Health Score, steps, sleep, and body composition</p>
      </motion.div>

      <motion.div variants={item} className="mb-5 rounded-xl border border-hydration-500/25 bg-hydration-500/10 p-4 text-sm text-gray-300">
        Google Health Connect isn't listed here — it's an Android-only system service and has no web API, so it can't sync
        to a browser-based app.
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
                        <h3 className="font-medium text-white">{provider.name}</h3>
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
                      <p className="mt-1 text-sm text-gray-400">{provider.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {provider.metrics.map((m) => (
                          <Badge key={m} tone="neutral">{m}</Badge>
                        ))}
                      </div>
                      {connected && row?.last_sync_at && (
                        <p className="mt-2 text-xs text-gray-500">Last synced {new Date(row.last_sync_at).toLocaleString()}</p>
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
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">To enable this integration</p>
                    <ol className="space-y-1 text-xs text-gray-400">
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
