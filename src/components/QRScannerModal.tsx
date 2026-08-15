import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage(
        'Camera API is not supported on this browser or platform. Please enter the room code manually.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);
        scanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermission(false);
      const errorStr = String(err);
      if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
        setErrorMessage(
          'Camera permission was denied. You can allow camera access in your browser/device settings, or use the 6-character room code input.'
        );
      } else {
        setErrorMessage(
          'Could not start camera feed. Please verify camera availability or type the room code manually.'
        );
      }
    }
  };

  const parseScannedData = (data: string): string | null => {
    if (!data) return null;
    const clean = data.trim();

    // 1. Direct 6-character code
    if (/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/i.test(clean)) {
      return clean.toUpperCase();
    }

    // 2. Custom scheme: protocolspace://join?code=ABCDEF or yourgame://join?code=ABCDEF
    if (clean.includes('join?code=') || clean.includes('join?join=')) {
      try {
        const parts = clean.split('?')[1];
        const params = new URLSearchParams(parts);
        const code = params.get('code') || params.get('join');
        if (code && code.length >= 4) return code.trim().toUpperCase();
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Web URL: https://.../?join=ABCDEF or ?code=ABCDEF
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const url = new URL(clean);
        const code = url.searchParams.get('join') || url.searchParams.get('code');
        if (code && code.length >= 4) return code.trim().toUpperCase();
      } catch (e) {
        console.error(e);
      }
    }

    // 4. Fallback extract any 6-character token from string
    const match = clean.match(/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/i);
    if (match) {
      return match[0].toUpperCase();
    }

    return null;
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const parsedCode = parseScannedData(code.data);
          if (parsedCode) {
            sound.playTaskStep();
            stopCamera();
            onScanSuccess(parsedCode);
            return;
          }
        }
      } catch (err) {
        console.warn('QR scan frame error:', err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-slate-900">QR Code Scanner</h3>
              <p className="text-[11px] font-mono text-slate-500">Scan friend&apos;s lobby invite code</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Canvas / Video */}
        <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-200 shadow-inner">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Guide */}
          {hasPermission && isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {/* Outer dimmed border */}
              <div className="relative w-56 h-56 border-2 border-indigo-500 rounded-3xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

                {/* Animated Laser Scanning Line */}
                <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
              </div>
              <p className="mt-4 text-xs font-mono text-white/90 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs">
                Align lobby QR code within frame
              </p>
            </div>
          )}

          {/* Permission Denied or Camera Error State */}
          {hasPermission === false && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <CameraOff className="w-10 h-10 text-rose-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Camera Inaccessible</h4>
              <p className="text-xs text-slate-300 mb-4 max-w-xs">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Permission</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="w-full mt-4 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
            }}
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Camera</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              stopCamera();
              onClose();
            }}
            className="text-slate-500 hover:text-slate-800 font-semibold underline decoration-slate-300"
          >
            Use manual code entry
          </button>
        </div>
      </div>
    </div>
  );
};
