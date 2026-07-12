import { useCallback, useEffect, useRef, useState } from 'react';
import { EXERCISES, ExerciseKey, Point3D, RepCounter, RepResult } from '../lib/poseAnalysis';
import { hapticLight as hapticRep } from '../lib/haptics';

export type SessionStatus = 'idle' | 'loading-model' | 'requesting-camera' | 'running' | 'ended' | 'error';
export type SessionErrorKind = 'denied' | 'no-camera' | 'busy' | 'model' | null;

interface LiveRep extends RepResult {
  index: number;
}

export function usePoseSession(exerciseKey: ExerciseKey) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<SessionErrorKind>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
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
        hapticRep();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("This browser doesn't support camera access. Try Chrome, Safari, or the installed app.");
      setErrorKind('no-camera');
      setStatus('error');
      return;
    }

    setStatus('loading-model');
    setErrorMessage(null);
    setErrorKind(null);
    setReps([]);
    setCurrentCue(null);
    setElapsedSeconds(0);
    counterRef.current = new RepCounter(EXERCISES[exerciseKey]);

    try {
      const loadModel = async () => {
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
      };
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('model-load-timeout')), 20000)
      );
      landmarkerRef.current = await Promise.race([loadModel(), timeout]);
    } catch (e) {
      console.error('Failed to load pose model:', e);
      setErrorMessage(
        e instanceof Error && e.message === 'model-load-timeout'
          ? 'The pose model is taking too long to load. Check your connection and try again.'
          : 'Could not load the pose-detection model. Check your connection and try again.'
      );
      setErrorKind('model');
      setStatus('error');
      return;
    }

    setStatus('requesting-camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (e) {
      console.error('Camera access failed:', e);
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setErrorMessage('Camera access was denied. Re-enable it for this app and try again.');
        setErrorKind('denied');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setErrorMessage('No camera was found on this device.');
        setErrorKind('no-camera');
      } else if (name === 'NotReadableError' || name === 'AbortError') {
        setErrorMessage('The camera is in use by another app. Close it and try again.');
        setErrorKind('busy');
      } else {
        setErrorMessage('Could not start the camera. Try again.');
        setErrorKind('no-camera');
      }
      setStatus('error');
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000)), 1000);
    setStatus('running');
  }, [exerciseKey]);

  // Attach the stream once the <video> element is mounted. CoachPage only
  // renders the video in the 'running' state, so assigning srcObject inside
  // start() would hit a null ref — this effect runs after that mount.
  useEffect(() => {
    const video = videoRef.current;
    if (status !== 'running' || !stream || !video) return;
    video.srcObject = stream;
    video.play().catch((e) => console.error('Video play failed:', e));
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, stream, loop]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    setStatus('ended');
  }, []);

  useEffect(() => stop, [stop]);

  const avgScore = reps.length ? Math.round(reps.reduce((s, r) => s + r.score, 0) / reps.length) : 0;

  return {
    status,
    errorMessage,
    errorKind,
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
