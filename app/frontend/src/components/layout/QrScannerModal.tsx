'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, ShieldAlert, Loader2, FlipHorizontal } from 'lucide-react';
import styles from './QrScannerModal.module.css';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FacingMode = 'environment' | 'user';

export default function QrScannerModal({ isOpen, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [flipping, setFlipping] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader-element';

  const stopScanner = useCallback(async () => {
    if (qrCodeScannerRef.current && qrCodeScannerRef.current.isScanning) {
      try {
        await qrCodeScannerRef.current.stop();
      } catch (err) {
        // ignore stop errors
      }
      qrCodeScannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (mode: FacingMode) => {
    setInitializing(true);
    setScannerError(null);

    // Small delay to ensure DOM element is ready
    await new Promise(r => setTimeout(r, 300));

    try {
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      qrCodeScannerRef.current = scanner;

      await scanner.start(
        { facingMode: mode },
        { fps: 15, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          try {
            if (decodedText.includes('/id/')) {
              const urlParts = decodedText.split('/id/');
              const token = urlParts[urlParts.length - 1]?.split('?')[0];
              if (token) {
                stopScanner().then(() => {
                  onClose();
                  router.push(`/id/${token}`);
                });
              } else {
                setScannerError('Format QR Code tidak valid.');
              }
            } else {
              setScannerError('QR Code tidak dikenali sebagai Unit Passport Holicindo.');
            }
          } catch {
            setScannerError('Terjadi kesalahan saat memproses scan.');
          }
        },
        () => { /* silent scan loop errors */ }
      );

      setInitializing(false);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setInitializing(false);
      setScannerError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }, [onClose, router, stopScanner]);

  // Start scanner when modal opens
  useEffect(() => {
    if (!isOpen) return;
    startScanner(facingMode);
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Flip camera
  const handleFlip = async () => {
    if (flipping || initializing) return;
    setFlipping(true);
    const newMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await stopScanner();
    setFacingMode(newMode);
    await startScanner(newMode);
    setFlipping(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Camera size={20} className={styles.icon} />
            <h2>Pindai QR Mesin</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Flip Camera Button */}
            {!scannerError && (
              <button
                onClick={handleFlip}
                className={styles.flipBtn}
                disabled={flipping || initializing}
                aria-label={facingMode === 'environment' ? 'Ganti ke kamera depan' : 'Ganti ke kamera belakang'}
                title={facingMode === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}
              >
                <FlipHorizontal size={18} />
                <span className={styles.flipLabel}>
                  {facingMode === 'environment' ? 'Belakang' : 'Depan'}
                </span>
              </button>
            )}
            <button
              onClick={() => stopScanner().then(onClose)}
              className={styles.closeBtn}
              aria-label="Tutup scanner"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {initializing && (
            <div className={styles.loaderArea}>
              <Loader2 size={32} className={styles.spin} />
              <p>{flipping ? 'Mengganti kamera...' : 'Mengaktifkan kamera...'}</p>
            </div>
          )}

          <div
            className={styles.scannerContainer}
            style={{ display: initializing ? 'none' : 'block' }}
          >
            <div id={scannerId} className={styles.scannerViewport} />
            <div className={styles.scanLine} />
            <div className={styles.cornerBrackets} />

            {/* Camera mode indicator */}
            <div className={styles.cameraIndicator}>
              <Camera size={12} />
              <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
            </div>
          </div>

          {!initializing && !scannerError && (
            <p className={styles.hint}>
              Arahkan kamera ke QR Code yang tertempel di mesin Holicindo.
            </p>
          )}

          {scannerError && (
            <div className={styles.errorArea}>
              <ShieldAlert size={24} />
              <p>{scannerError}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setScannerError(null);
                    startScanner(facingMode);
                  }}
                  className={styles.retryBtn}
                >
                  Coba Lagi
                </button>
                <button
                  onClick={() => { setScannerError(null); stopScanner().then(onClose); }}
                  className={styles.retryBtn}
                  style={{ background: 'var(--color-space-grey)' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
