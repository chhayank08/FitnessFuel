import { useCallback, useEffect, useRef, useState } from 'react';
import { EXERCISES, ExerciseKey, Point3D, RepCounter, RepResult } from '../lib/poseAnalysis';

export type SessionStatus = 'idle' | 'loading-model' | 'requesting-camera' | 'running' | 'ended' | 'error';

interface LiveRep extends RepResult {
  index: number;
}

export function usePoseSession(exerciseKey: ExerciseKey) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reps, setReps] = useState<LiveRep[]>([]);
  const [currentCue, setCurrentCue] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>();
  const counterRef = useRef(new RepCounter(EXERCISES[exerciseKey]));
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const drawFrame = useCallback((landmarks: Point3D[] | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks) return;
    const w = canvas.width;
    const h = canvas.height;

    const CONNECTIONS: [number, number][] = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
    ];

    ctx.strokeStyle = 'rgba(133,123,255,0.85)';
    ctx.lineWidth = 3;
    CONNECTIONS.forEach(([a, b]) => {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (!pa || !pb || (pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) return;
      ctx.beginPath();
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
      ctx.stroke();
    });

    ctx.fillStyle = '#857BFF';
    landmarks.forEach((p) => {
      if ((p.visibility ?? 1) < 0.4) return;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;

    // Guard against the first frame(s) before the video stream reports real
    // dimensions — detectForVideo on a 0x0 frame crashes MediaPipe's WASM graph.
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks: Point3D[] | null = result?.landmarks?.[0] || null;
    drawFrame(landmarks);

    if (landmarks) {
      const rep = counterRef.current.process(landmarks);
      if (rep) {
        setReps((prev) => [...prev, { ...rep, index: prev.length + 1 }]);
        if (rep.cue) setCurrentCue(rep.cue);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  const start = useCallback(async () => {
    setStatus('loading-model');
    setErrorMessage(null);
    setReps([]);
    setCurrentCue(null);
    counterRef.current = new RepCounter(EXERCISES[exerciseKey]);

    try {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      landmarkerRef.current = landmarker;
    } catch (e) {
      console.error('Failed to load pose model:', e);
      setErrorMessage('Could not load the pose-detection model. Check your connection and try again.');
      setStatus('error');
      return;
    }

    setStatus('requesting-camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access denied:', e);
      setErrorMessage('Camera access was denied. Allow camera permissions and try again.');
      setStatus('error');
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000)), 1000);
    setStatus('running');
    rafRef.current = requestAnimationFrame(loop);
  }, [exerciseKey, loop]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    setStatus('ended');
  }, []);

  useEffect(() => stop, [stop]);

  const avgScore = reps.length ? Math.round(reps.reduce((s, r) => s + r.score, 0) / reps.length) : 0;

  return {
    status,
    errorMessage,
    reps,
    currentCue,
    elapsedSeconds,
    avgScore,
    phase: counterRef.current.getPhase(),
    videoRef,
    canvasRef,
    start,
    stop,
  };
}
