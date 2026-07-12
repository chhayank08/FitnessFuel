// Module-level cache for the MediaPipe PoseLandmarker so repeat sessions skip
// the WASM + model download entirely. The landmarker is created once and
// reused for the lifetime of the page; callers must NOT close() it.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Landmarker = any;

let landmarkerPromise: Promise<Landmarker> | null = null;

async function createLandmarker(): Promise<Landmarker> {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  return vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
}

export function getPoseLandmarker(): Promise<Landmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((e) => {
      // Failed loads must not poison the cache — next start() retries fresh.
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

/** Fire-and-forget warm start (call on workout page mount). */
export function preloadPoseLandmarker(): void {
  getPoseLandmarker().catch(() => {
    // Preload failures are silent; the session start path surfaces errors.
  });
}
