import React from 'react';
import { Dumbbell, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { ExerciseInfo } from '../../services/exercises';

interface ExerciseDetailModalProps {
  exercise: ExerciseInfo | null;
  onClose: () => void;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  if (!exercise) return null;

  // Heuristic "common mistakes" derived from the instruction text — the free
  // data sources don't ship dedicated mistake fields, so surface cues from
  // words like "avoid" / "don't" / "keep" that already appear in steps.
  const cautionSteps = exercise.instructions.filter((s) => /avoid|don't|keep your|maintain|do not/i.test(s));

  return (
    <Modal open={!!exercise} onClose={onClose} panelClassName="max-w-lg max-h-[85vh] overflow-y-auto">
      <div className="p-5">
        {exercise.mediaUrl ? (
          <img src={exercise.mediaUrl} alt={exercise.name} className="h-56 w-full rounded-xl bg-surface-2 object-contain" />
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-xl bg-surface-2 text-gray-500">
            <Dumbbell className="h-10 w-10" />
          </div>
        )}

        <h2 className="mt-4 font-display text-xl font-semibold text-white capitalize">{exercise.name}</h2>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="primary">{exercise.bodyPart}</Badge>
          {exercise.target && <Badge tone="neutral">Target: {exercise.target}</Badge>}
          <Badge tone="neutral">{exercise.equipment}</Badge>
          {exercise.level && <Badge tone="success">{exercise.level}</Badge>}
        </div>

        {exercise.secondaryMuscles.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Secondary muscles: <span className="text-gray-300">{exercise.secondaryMuscles.join(', ')}</span>
          </p>
        )}

        {exercise.instructions.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">How to perform it</p>
            <ol className="space-y-1.5 text-sm text-gray-300">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary-300">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {cautionSteps.length > 0 && (
          <div className="mt-4 rounded-xl bg-secondary-500/10 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Watch out for
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              {cautionSteps.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExerciseDetailModal;
