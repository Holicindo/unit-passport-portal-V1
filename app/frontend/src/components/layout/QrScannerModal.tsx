'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ShieldAlert, Loader2 } from 'lucide-react';
import styles from './QrScannerModal.module.css';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QrScannerModal({ isOpen, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader-element';

  useEffect(() => {
    if (!isOpen) return;

    setInitializing(true);
    setScannerError(null);

    // Small delay to ensure container element is rendered in DOM
    const timer = setTimeout(() => {
      const scanner = new Html5Qrcode(scannerId);
      qrCodeScannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' }, // Prefer back camera
        {
          fps: 15,
          qrbox: { width: 200, height: 200 } // Safe fixed size to prevent 0 height crashes
        },
        (decodedText) => {
          // Success Callback: Parse and validate QR code
          console.log('QR Code Decoded:', decodedText);
          
          try {
            // Check if it's our portal link
            if (decodedText.includes('/id/')) {
              const urlParts = decodedText.split('/id/');
              const token = urlParts[urlParts.length - 1]?.split('?')[0]; // Extract token
              
              if (token) {
                // Stop scanner and redirect
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
          } catch (err) {
            console.error('Scan handling error:', err);
            setScannerError('Terjadi kesalahan saat memproses scan.');
          }
        },
        (errorMessage) => {
          // Silent failure during continuous scan loop
        }
      ).then(() => {
        setInitializing(false);
      }).catch((err) => {
        console.error('Failed to start scanner:', err);
        setInitializing(false);
        setScannerError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (qrCodeScannerRef.current && qrCodeScannerRef.current.isScanning) {
      try {
        await qrCodeScannerRef.current.stop();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      qrCodeScannerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Camera size={20} className={styles.icon} />
            <h2>Pindai QR Mesin</h2>
          </div>
          <button onClick={() => stopScanner().then(onClose)} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {initializing && (
            <div className={styles.loaderArea}>
              <Loader2 size={32} className={styles.spin} />
              <p>Mengaktifkan kamera...</p>
            </div>
          )}

          <div 
            className={styles.scannerContainer}
            style={{ display: initializing ? 'none' : 'block' }}
          >
            <div id={scannerId} className={styles.scannerViewport} />
            <div className={styles.scanLine} />
            <div className={styles.cornerBrackets} />
          </div>

          {!initializing && !scannerError && (
            <p className={styles.hint}>Arahkan kamera ke QR Code yang tertempel di mesin Holicindo.</p>
          )}

          {scannerError && (
            <div className={styles.errorArea}>
              <ShieldAlert size={24} />
              <p>{scannerError}</p>
              <button 
                onClick={() => { setScannerError(null); setInitializing(true); onClose(); }}
                className={styles.retryBtn}
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
