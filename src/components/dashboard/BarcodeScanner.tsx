import React, { useEffect, useRef, useState } from 'react';
import { ScanBarcode, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// BarcodeDetector is Chromium-only. Feature-detect and fall back to manual
// entry everywhere else (Safari, Firefox) rather than showing a dead camera UI.
const isSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ open, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !isSupported) return;
    let cancelled = false;
    let rafId: number;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetected(codes[0].rawValue);
              return;
            }
          } catch {
            // transient detection errors are expected mid-frame; keep polling
          }
          rafId = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError('Camera access was denied or unavailable.');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onDetected]);

  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-md">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <ScanBarcode className="h-5 w-5 text-primary-300" />
            Scan barcode
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSupported ? (
          <>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-primary-400/60" />
            </div>
            {error && <p className="mt-2 text-sm text-secondary-400">{error}</p>}
            <p className="mt-3 text-center text-xs text-gray-500">Point your camera at a product barcode</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Barcode scanning isn't supported in this browser. Enter the barcode number manually instead.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter barcode number"
            className="flex-1 rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button onClick={() => manualCode.trim() && onDetected(manualCode.trim())}>Look up</Button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScanner;
