import React, { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { CatalogExercise } from '../../lib/exerciseCatalog';
import { resolveMedia, ExerciseMedia } from '../../services/exerciseMedia';
import Skeleton from '../ui/Skeleton';

interface DemoMediaProps {
  exercise: CatalogExercise;
  className?: string;
}

// Looping demo (ExerciseDB GIF, or a start/end photo from free-exercise-db)
// for the current exercise. Aspect-locked so the player layout never jumps;
// lightweight skeleton while the asset loads.
const DemoMedia: React.FC<DemoMediaProps> = ({ exercise, className = '' }) => {
  const [media, setMedia] = useState<ExerciseMedia | null | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMedia(undefined);
    setLoaded(false);
    resolveMedia(exercise).then((m) => {
      if (!cancelled) setMedia(m);
    });
    return () => {
      cancelled = true;
    };
  }, [exercise]);

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-2 ${className}`}>
      {media === undefined && <Skeleton className="absolute inset-0 rounded-none" />}
      {media === null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
          <Dumbbell className="h-10 w-10" />
          <span className="text-xs">{exercise.name}</span>
        </div>
      )}
      {media && (
        <>
          {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
          <img
            src={media.url}
            alt={`${exercise.name} demonstration`}
            className={`h-full w-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setMedia(null)}
          />
        </>
      )}
    </div>
  );
};

export default DemoMedia;
