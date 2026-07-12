import React from 'react';
import { ScanFace, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { WorkoutSession } from '../../hooks/useWorkoutSessions';

interface FormCoachCTAProps {
  lastSession?: WorkoutSession | null;
  className?: string;
}

// Shared entry point into the Form Coach — used on Today and featured at the
// top of Training, since Coach is a sub-flow of Training rather than its own
// top-level nav item.
const FormCoachCTA: React.FC<FormCoachCTAProps> = ({ lastSession, className = '' }) => {
  const navigate = useNavigate();

  return (
    <Card className={`flex flex-wrap items-center justify-between gap-4 p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
          <ScanFace className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">
            {lastSession ? `Last session: ${lastSession.exercise_key.replace(/-/g, ' ')}` : 'Try the Form Coach'}
          </p>
          <p className="text-xs text-ink-muted">
            {lastSession
              ? `${lastSession.total_reps} reps · form score ${lastSession.avg_form_score != null ? Math.round(lastSession.avg_form_score) : '—'}`
              : 'Live rep counting and form feedback using your webcam'}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate('/dashboard/exercise/coach?autostart=1')}
        className="flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200"
      >
        {lastSession ? 'New session' : 'Get started'}
        <ChevronRight className="h-4 w-4" />
      </button>
    </Card>
  );
};

export default FormCoachCTA;
