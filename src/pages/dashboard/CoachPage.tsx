import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, Dumbbell, Mic, MicOff, Square, AlertTriangle, RotateCcw, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import RingGauge from '../../components/ui/RingGauge';
import { EXERCISES, ExerciseKey } from '../../lib/poseAnalysis';
import { usePoseSession } from '../../hooks/usePoseSession';
import { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
import { useSettings } from '../../hooks/useSettings';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const EXERCISE_LIST = Object.values(EXERCISES);

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  window.speechSynthesis.speak(utter);
}

const CoachPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, update } = useSettings();
  const { saveSession } = useWorkoutSessions();
  const paramExercise = searchParams.get('exercise');
  const [exerciseKey, setExerciseKey] = useState<ExerciseKey>(
    paramExercise && paramExercise in EXERCISES ? (paramExercise as ExerciseKey) : 'squat'
  );
  const [reportSaved, setReportSaved] = useState(false);
  const session = usePoseSession(exerciseKey);
  const lastAnnouncedRep = useRef(0);
  const autoStarted = useRef(false);

  const voiceOn = settings.coach.voiceFeedback;

  // ?autostart=1 launches the session immediately (dashboard "Start Workout" CTA).
  // Clear the param so refresh/back doesn't re-trigger; StrictMode guard via ref.
  useEffect(() => {
    if (searchParams.get('autostart') !== '1' || autoStarted.current) return;
    autoStarted.current = true;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('autostart');
      return next;
    }, { replace: true });
    session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!voiceOn || session.status !== 'running') return;
    if (session.reps.length > lastAnnouncedRep.current) {
      lastAnnouncedRep.current = session.reps.length;
      const rep = session.reps[session.reps.length - 1];
      const text = rep.cue ? `${session.reps.length}. ${rep.cue}` : `${session.reps.length}`;
      speak(text);
    }
  }, [session.reps, session.status, voiceOn]);

  useEffect(() => {
    if (session.status === 'running') lastAnnouncedRep.current = 0;
  }, [session.status]);

  const handleStop = useCallback(async () => {
    session.stop();
    if (session.reps.length === 0) return;
    const ok = await saveSession({
      exercise_key: exerciseKey,
      duration_seconds: session.elapsedSeconds,
      total_reps: session.reps.length,
      avg_form_score: session.avgScore,
      rep_scores: session.reps.map((r) => r.score),
      feedback: session.reps.map((r) => r.cue).filter(Boolean),
    });
    setReportSaved(ok);
    if (ok) toast.success('Session saved to your training history');
  }, [session, exerciseKey, saveSession]);

  const config = EXERCISES[exerciseKey];

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Form Coach</h1>
        <p className="mt-1 text-sm text-ink-muted">Real-time pose analysis for rep counting and form feedback — right from your webcam</p>
      </motion.div>

      {session.status === 'idle' && (
        <motion.div variants={item} className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">Choose an exercise</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {EXERCISE_LIST.map((ex) => (
                <button
                  key={ex.key}
                  onClick={() => setExerciseKey(ex.key as ExerciseKey)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    exerciseKey === ex.key ? 'border-primary-400/60 bg-primary-500/10' : 'border-surface-line bg-surface-2 hover:border-surface-line-strong'
                  }`}
                >
                  <Dumbbell className={`h-5 w-5 ${exerciseKey === ex.key ? 'text-primary-300' : 'text-ink-faint'}`} />
                  <p className="mt-2 text-sm font-medium text-ink">{ex.name}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">{config.name} setup</h3>
                <p className="mt-1 text-sm text-ink-muted">{config.instructions}</p>
              </div>
              <button
                onClick={() => update({ coach: { voiceFeedback: !voiceOn } })}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-3"
              >
                {voiceOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                Voice {voiceOn ? 'on' : 'off'}
              </button>
            </div>
            <Button className="mt-4 w-full" onClick={session.start}>
              <Camera className="mr-1.5 h-4 w-4" />
              Start session
            </Button>
          </Card>
        </motion.div>
      )}

      {(session.status === 'loading-model' || session.status === 'requesting-camera') && (
        <motion.div variants={item}>
          <Card className="relative overflow-hidden p-0">
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-surface-2">
              <div className="relative">
                <Camera className="h-10 w-10 animate-pulse text-primary-400" />
                <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse-dot rounded-full bg-primary-500" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" />
                <p className="text-sm text-ink-muted">
                  {session.status === 'loading-model' ? 'Loading the pose-detection model…' : 'Waiting for camera access — check the permission prompt'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {session.status === 'error' && (
        <motion.div variants={item}>
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-secondary-400" />
            <p className="max-w-sm text-sm text-ink-muted">{session.errorMessage}</p>
            {session.errorKind === 'denied' && (
              <ol className="max-w-sm list-inside list-decimal space-y-1 text-left text-xs text-ink-faint">
                <li>Open your browser's site settings (padlock icon in the address bar)</li>
                <li>Set Camera to "Allow" — on iOS: Settings → Safari → Camera</li>
                <li>Reload this page and try again</li>
              </ol>
            )}
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <Button onClick={session.start}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Try again
              </Button>
              {session.errorKind === 'no-camera' && (
                <Button variant="subtle" onClick={() => navigate('/dashboard/exercise')}>
                  <ClipboardList className="mr-1.5 h-4 w-4" />
                  Log workout manually
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {session.status === 'running' && (
        <motion.div variants={item} className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <Card className="relative overflow-hidden p-0">
            <video ref={session.videoRef} className="w-full -scale-x-100" playsInline muted />
            <canvas ref={session.canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />
            <div className="absolute left-4" style={{ top: 'max(1rem, env(safe-area-inset-top))' }}>
              <Badge tone="primary" className="px-3 py-1 text-sm capitalize">{session.phase}</Badge>
            </div>
            <div className="absolute right-4" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <Button variant="danger" onClick={handleStop}>
                <Square className="mr-1.5 h-4 w-4" />
                End session
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="flex flex-col items-center p-5">
              <span className="font-display text-4xl font-semibold text-ink">
                <AnimatedNumber value={session.reps.length} />
              </span>
              <span className="text-xs text-ink-muted">reps · {config.name}</span>
              <p className="mt-2 text-xs text-ink-faint tabular-nums">{Math.floor(session.elapsedSeconds / 60)}:{String(session.elapsedSeconds % 60).padStart(2, '0')}</p>
            </Card>

            <Card className="flex flex-col items-center p-5">
              <RingGauge value={session.avgScore / 100} size={100} colorFrom={session.avgScore >= 80 ? '#4AE3AC' : '#857BFF'} colorTo={session.avgScore >= 80 ? '#34D399' : '#6C63FF'}>
                <span className="font-display text-xl font-semibold text-ink">{session.avgScore || '—'}</span>
              </RingGauge>
              <span className="mt-2 text-xs text-ink-muted">avg form score</span>
            </Card>

            {session.currentCue && (
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">Coach says</p>
                <p className="mt-1 text-sm text-ink">{session.currentCue}</p>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {session.status === 'ended' && (
        <motion.div variants={item}>
          <SessionReport
            exerciseName={config.name}
            reps={session.reps}
            avgScore={session.avgScore}
            durationSeconds={session.elapsedSeconds}
            saved={reportSaved}
            onRestart={() => {
              setReportSaved(false);
              session.start();
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

const SessionReport: React.FC<{
  exerciseName: string;
  reps: ReturnType<typeof usePoseSession>['reps'];
  avgScore: number;
  durationSeconds: number;
  saved: boolean;
  onRestart: () => void;
}> = ({ exerciseName, reps, avgScore, durationSeconds, saved, onRestart }) => {
  const chartData = reps.map((r) => ({ rep: r.index, score: r.score }));
  const cues = Array.from(new Set(reps.map((r) => r.cue).filter(Boolean))).slice(0, 3) as string[];

  return (
    <div className="space-y-5">
      <Card className="p-6 text-center">
        <p className="text-sm text-ink-muted">{exerciseName} session complete</p>
        <div className="mt-3 flex justify-center gap-10">
          <div>
            <p className="font-display text-3xl font-semibold text-ink">{reps.length}</p>
            <p className="text-xs text-ink-faint">total reps</p>
          </div>
          <div>
            <p className={`font-display text-3xl font-semibold ${avgScore >= 80 ? 'text-success-400' : avgScore >= 60 ? 'text-primary-300' : 'text-secondary-400'}`}>{avgScore || '—'}</p>
            <p className="text-xs text-ink-faint">avg form score</p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-ink">{Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')}</p>
            <p className="text-xs text-ink-faint">duration</p>
          </div>
        </div>
        {saved && <Badge tone="success" className="mt-4">Saved to Training → History</Badge>}
      </Card>

      {reps.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Rep quality</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="rep" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#232336', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 80 ? '#34D399' : d.score >= 55 ? '#857BFF' : '#FF6584'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {cues.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Top improvement suggestions</h3>
          <ul className="mt-3 space-y-2">
            {cues.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button className="w-full" onClick={onRestart}>
        <RotateCcw className="mr-1.5 h-4 w-4" />
        Start another session
      </Button>
    </div>
  );
};

export default CoachPage;
