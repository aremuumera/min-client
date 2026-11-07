'use client';

import * as React from 'react';
import jsQR from 'jsqr';
import { Button } from './button';
import { Input } from './input';

export interface QrScannerProps {
  /** Called once with the text read from the code, or typed */
  onResult: (value: string) => void;
  /** Label for the typed fallback */
  manualLabel?: string;
}

/**
 * Reads a QR code with the device camera (back camera on phones). Where there is no camera, or the
 * person refuses it, the code can be typed instead: the MNG reference printed under the QR.
 */
export function QrScanner({ onResult, manualLabel = 'Or type the code printed under the QR' }: QrScannerProps) {
  const video = React.useRef<HTMLVideoElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [state, setState] = React.useState<'starting' | 'scanning' | 'no-camera'>('starting');
  const [typed, setTyped] = React.useState('');
  const done = React.useRef(false);
  const id = React.useId();

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    const tick = () => {
      const v = video.current;
      const c = canvas.current;
      if (!v || !c || done.current) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const found = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'dontInvert' });
          if (found?.data) {
            done.current = true;
            onResult(found.data);
            return;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setState('scanning');
        frame = requestAnimationFrame(tick);
      } catch {
        setState('no-camera');
      }
    })();
    return () => {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      <div className={state === 'no-camera' ? 'hidden' : 'overflow-hidden rounded-xl border border-hairline bg-ink'}>
        <video ref={video} muted playsInline className="aspect-square w-full object-cover" aria-label="Camera" />
        <canvas ref={canvas} className="hidden" />
      </div>
      <p className="text-sm text-steel">{state === 'starting' ? 'Starting the camera…' : state === 'scanning' ? 'Point the camera at the label.' : 'The camera is not available. Type the code instead.'}</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) onResult(typed.trim());
        }}
      >
        <label htmlFor={id} className="sr-only">{manualLabel}</label>
        <Input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="MNG-XXXX-XXXX-XXXX-XXXX-X" aria-label={manualLabel} />
        <Button type="submit" variant="outlined" disabled={!typed.trim()}>Use</Button>
      </form>
    </div>
  );
}
