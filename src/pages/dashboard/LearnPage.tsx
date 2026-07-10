import React, { useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { GraduationCap, ShieldAlert, ExternalLink, FlaskConical, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { useResearch } from '../../hooks/useResearch';
import { topicsForGoal, searchRecalls, Recall } from '../../services/research';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const LearnPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { insights } = useDailyLogContext();
  const topics = topicsForGoal(insights.nutritionProfile?.goal ?? 'maintain');
  const [activeTopic, setActiveTopic] = useState(topics[0]);
  const { articles, trials, loading } = useResearch(activeTopic);

  const [recallQuery, setRecallQuery] = useState('');
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [recallLoading, setRecallLoading] = useState(false);
  const [recallSearched, setRecallSearched] = useState(false);

  const runRecallSearch = async () => {
    if (recallQuery.trim().length < 2) return;
    setRecallLoading(true);
    setRecallSearched(true);
    try {
      setRecalls(await searchRecalls(recallQuery.trim()));
    } finally {
      setRecallLoading(false);
    }
  };

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-4">
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold text-white">
          <GraduationCap className="h-7 w-7 text-primary-300" />
          Learn
        </h1>
        <p className="mt-1 text-sm text-gray-400">Evidence-based research on nutrition and training, tailored to your goal</p>
      </motion.div>

      <motion.div variants={item} className="mb-5 flex items-start gap-2 rounded-xl border border-secondary-500/25 bg-secondary-500/10 p-4 text-sm text-gray-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-400" />
        This content is educational, sourced from public research databases. It is not medical advice — talk to a
        healthcare professional before making decisions about your health.
      </motion.div>

      <motion.div variants={item} className="mb-5 flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTopic(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              activeTopic === t ? 'bg-primary-500/20 text-white' : 'bg-surface-2 text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Research articles</h3>
          {loading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : articles.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No articles found for this topic right now.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {articles.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3">
                  <p className="flex items-start justify-between gap-2 text-sm font-medium text-white">
                    {a.title}
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{a.authors} {a.journal && `· ${a.journal}`} {a.year && `· ${a.year}`}</p>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <FlaskConical className="h-4 w-4 text-hydration-400" />
            Recruiting clinical trials
          </h3>
          {loading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : trials.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No actively recruiting trials found for this topic.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {trials.map((t) => (
                <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3">
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="hydration">{t.status.replace(/_/g, ' ').toLowerCase()}</Badge>
                    {t.conditions.slice(0, 2).map((c) => (
                      <Badge key={c} tone="neutral">{c}</Badge>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={item} className="mt-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Food safety recall lookup</h3>
          <p className="mt-1 text-xs text-gray-500">Search OpenFDA for food recall notices by product name</p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={recallQuery}
                onChange={(e) => setRecallQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runRecallSearch()}
                placeholder="e.g. peanut butter, spinach"
                className="w-full rounded-xl border border-surface-line-strong bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button onClick={runRecallSearch} loading={recallLoading}>Search</Button>
          </div>

          {recallSearched && !recallLoading && (
            recalls.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="No recalls found" description={`No recall notices found for "${recallQuery}".`} className="py-8" />
            ) : (
              <div className="mt-4 space-y-2">
                {recalls.map((r) => (
                  <div key={r.id} className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{r.product}</p>
                      <Badge tone={r.classification === 'Class I' ? 'alert' : 'neutral'}>{r.classification}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{r.reason}</p>
                    {r.date && <p className="mt-1 text-xs text-gray-500">{r.date}</p>}
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LearnPage;
