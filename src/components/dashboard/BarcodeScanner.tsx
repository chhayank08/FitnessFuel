import React, { useEffect, useRef, useState } from 'react';
import { ScanBarcode, X, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

type ScanErrorKind = 'denied' | 'no-camera' | 'busy' | 'insecure' | 'init' | null;

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

// Native BarcodeDetector on Chromium; zxing-wasm ponyfill (identical API)
// everywhere else — the scanner works in Safari, Firefox, and installed PWAs.
// The ponyfill is dynamically imported so Chromium users never download it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDetector(): Promise<{ detector: any; native: boolean }> {
  if ('BarcodeDetector' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supported: string[] = (await (window as any).BarcodeDetector.getSupportedFormats?.()) ?? FORMATS;
      if (FORMATS.some((f) => supported.includes(f))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { detector: new (window as any).BarcodeDetector({ formats: FORMATS }), native: true };
      }
    } catch {
      // fall through to the ponyfill
    }
  }
  const { BarcodeDetector } = await import('barcode-detector/ponyfill');
  return { detector: new BarcodeDetector({ formats: FORMATS as never[] }), native: false };
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ open, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [errorKind, setErrorKind] = useState<ScanErrorKind>(null);
  const [starting, setStarting] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setErrorKind(null);

    if (!window.isSecureContext) {
      setErrorKind('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorKind('no-camera');
      return;
    }

    let cancelled = false;
    let rafId: number;
    setStarting(true);

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let detector: any;
      let native = true;
      try {
        // Camera permission and detector init in parallel.
        const [detectorResult, stream] = await Promise.all([
          createDetector(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
        ]);
        detector = detectorResult.detector;
        native = detectorResult.native;
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        const name = e instanceof DOMException ? e.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') setErrorKind('denied');
        else if (name === 'NotFoundError' || name === 'OverconstrainedError') setErrorKind('no-camera');
        else if (name === 'NotReadableError' || name === 'AbortError') setErrorKind('busy');
        else setErrorKind('init');
        return;
      }

      // WASM decoding is heavier than the native detector — poll every 3rd
      // frame on the ponyfill path to keep mobile CPUs cool.
      let frame = 0;
      const stride = native ? 1 : 3;
      const tick = async () => {
        if (cancelled || !videoRef.current) return;
        frame += 1;
        if (frame % stride === 0 && videoRef.current.readyState >= 2) {
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetected(codes[0].rawValue);
              return;
            }
          } catch {
            // transient detection errors are expected mid-frame; keep polling
          }
        }
        rafId = requestAnimationFrame(tick);
      };
      tick();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onDetected, retryTick]);

  const showCamera = errorKind === null;
  const showManualOnly = errorKind === 'no-camera' || errorKind === 'insecure';

  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-md">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <ScanBarcode className="h-5 w-5 text-primary-300" />
            Scan barcode
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showCamera && (
          <>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-primary-400/60" />
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-primary-400" />
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-ink-faint">Point your camera at a product barcode</p>
          </>
        )}

        {errorKind === 'denied' && (
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="flex items-center gap-2 text-sm text-ink">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-secondary-400" />
              Camera access was denied.
            </p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-ink-faint">
              <li>Open your browser's site settings (padlock icon in the address bar)</li>
              <li>Set Camera to "Allow" — on iOS: Settings → Safari → Camera</li>
              <li>Tap "Try again" below</li>
            </ol>
            <Button variant="subtle" className="mt-3 w-full" onClick={() => setRetryTick((t) => t + 1)}>
              Try again
            </Button>
          </div>
        )}

        {errorKind === 'busy' && (
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-sm text-ink-muted">The camera is in use by another app. Close it and try again.</p>
            <Button variant="subtle" className="mt-3 w-full" onClick={() => setRetryTick((t) => t + 1)}>
              Try again
            </Button>
          </div>
        )}

        {errorKind === 'init' && (
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-sm text-ink-muted">The scanner couldn't start. Enter the barcode number below instead.</p>
            <Button variant="subtle" className="mt-3 w-full" onClick={() => setRetryTick((t) => t + 1)}>
              Try again
            </Button>
          </div>
        )}

        {showManualOnly && (
          <p className="text-sm text-ink-muted">
            {errorKind === 'insecure'
              ? 'Camera scanning needs a secure (https) connection. Enter the barcode number manually instead.'
              : 'No camera was found on this device. Enter the barcode number manually instead.'}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter barcode number"
            inputMode="numeric"
            className="flex-1 rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button onClick={() => manualCode.trim() && onDetected(manualCode.trim())}>Look up</Button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScanner;
