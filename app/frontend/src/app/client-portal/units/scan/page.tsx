'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi } from '@/lib/api';
import {
  QrCode, ArrowLeft, Search, Package, ChevronRight,
  AlertTriangle, Camera, X,
} from 'lucide-react';
import styles from '../../ClientPortal.module.css';
import scanStyles from './scan.module.css';

// Fallback manual search jika kamera tidak tersedia
function ManualSearch({ fleet }: { fleet: any[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const results = query.trim().length >= 2
    ? fleet.filter(u =>
        u.serial_number?.toLowerCase().includes(query.toLowerCase()) ||
        u.model_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.current_client?.city?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className={scanStyles.manualSearch}>
      <div className={scanStyles.searchInputWrap}>
        <Search size={16} className={scanStyles.searchIcon} />
        <input
          autoFocus
          type="text"
          className={scanStyles.searchInput}
          placeholder="Ketik serial number atau model..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            className={scanStyles.clearBtn}
            onClick={() => setQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className={scanStyles.searchResults}>
          {results.map(u => (
            <button
              key={u.id}
              className={scanStyles.resultItem}
              onClick={() => router.push(`/client-portal/units/${u.id}`)}
            >
              <div className={scanStyles.resultIcon}>
                <Package size={18} />
              </div>
              <div className={scanStyles.resultInfo}>
                <div className={scanStyles.resultSerial}>{u.serial_number}</div>
                <div className={scanStyles.resultMeta}>
                  {u.model_name || 'Model TBA'} · {u.current_client?.city || u.specs?.city || 'Lokasi TBA'}
                </div>
              </div>
              <ChevronRight size={15} color="var(--brand-space-grey)" />
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <div className={scanStyles.noResults}>
          <Package size={24} color="var(--brand-space-grey)" />
          <p>Tidak ada unit ditemukan untuk "<strong>{query}</strong>"</p>
        </div>
      )}
    </div>
  );
}

// QR Scanner menggunakan camera API browser dengan fallback manual decoding
function QrScanner({ onResult }: { onResult: (token: string) => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const [error, setError]   = useState('');
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Default kamera belakang
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [jsQR, setJsQR] = useState<any>(null);

  // Load jsQR library dynamically
  useEffect(() => {
    import('jsqr').then(module => {
      setJsQR(() => module.default);
    }).catch(() => {
      console.warn('jsQR not available, will try BarcodeDetector');
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !jsQR) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    return code;
  }, [jsQR]);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);

        // Coba gunakan BarcodeDetector dulu (lebih cepat)
        if ('BarcodeDetector' in window && (window as any).BarcodeDetector) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            intervalRef.current = setInterval(async () => {
              if (!videoRef.current) return;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const raw = barcodes[0].rawValue as string;
                  stopCamera();
                  // Ekstrak token dari URL atau pakai langsung
                  const match = raw.match(/\/id\/([^?#/]+)/);
                  onResult(match ? match[1] : raw);
                }
              } catch { /* silent */ }
            }, 300);
          } catch (e) {
            console.warn('BarcodeDetector failed, falling back to jsQR');
            // Fallback ke jsQR
            if (jsQR) {
              intervalRef.current = setInterval(() => {
                const code = scanFrame();
                if (code && code.data) {
                  stopCamera();
                  const match = code.data.match(/\/id\/([^?#/]+)/);
                  onResult(match ? match[1] : code.data);
                }
              }, 300);
            } else {
              setError('Scanner QR tidak tersedia di browser ini. Gunakan pencarian manual.');
              stopCamera();
            }
          }
        } else {
          // Browser tidak support BarcodeDetector, gunakan jsQR
          if (jsQR) {
            intervalRef.current = setInterval(() => {
              const code = scanFrame();
              if (code && code.data) {
                stopCamera();
                const match = code.data.match(/\/id\/([^?#/]+)/);
                onResult(match ? match[1] : code.data);
              }
            }, 300);
          } else {
            setError('Scanner QR tidak tersedia. Gunakan pencarian manual di bawah.');
            stopCamera();
          }
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser, lalu refresh halaman ini.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setError('Gagal mengakses kamera. Coba gunakan pencarian manual.');
      }
    }
  }, [onResult, stopCamera, scanFrame, jsQR, facingMode]);

  const toggleCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // Wait a bit before restarting
    setTimeout(() => {
      startCamera();
    }, 300);
  }, [stopCamera, startCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return (
    <div className={scanStyles.cameraWrap}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className={scanStyles.viewfinder}>
        {active ? (
          <>
            <video
              ref={videoRef}
              className={scanStyles.video}
              playsInline
              muted
              autoPlay
            />
            <div className={scanStyles.scanFrame}>
              <span className={scanStyles.corner + ' ' + scanStyles.cornerTL} />
              <span className={scanStyles.corner + ' ' + scanStyles.cornerTR} />
              <span className={scanStyles.corner + ' ' + scanStyles.cornerBL} />
              <span className={scanStyles.corner + ' ' + scanStyles.cornerBR} />
              <div className={scanStyles.scanLine} />
            </div>
            <div className={scanStyles.cameraControls}>
              <button className={scanStyles.flipBtn} onClick={toggleCamera} title="Balik kamera">
                <Camera size={16} /> Balik
              </button>
              <button className={scanStyles.stopBtn} onClick={stopCamera}>
                <X size={16} /> Stop
              </button>
            </div>
          </>
        ) : (
          <div className={scanStyles.cameraPrompt}>
            <QrCode size={52} color="var(--brand-cobalt-blue)" style={{ opacity: 0.7 }} />
            <p className={scanStyles.cameraPromptText}>Arahkan kamera ke QR Code pada unit</p>
            <button className={styles.btnPrimary} onClick={startCamera}>
              <Camera size={16} /> Buka Kamera
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={scanStyles.cameraError}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function ScanQrPage() {
  const router  = useRouter();
  const [fleet, setFleet] = useState<any[]>([]);
  const [tab, setTab]     = useState<'camera' | 'manual'>('camera');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  useEffect(() => {
    unitApi.findMyFleet()
      .then(({ data }) => setFleet(data || []))
      .catch(() => {});
  }, []);

  // Saat QR token didapat dari scanner
  const handleQrResult = async (tokenOrUrl: string) => {
    setResolving(true);
    setResolveError('');

    // Cek apakah ada di fleet berdasarkan qr_token
    const match = fleet.find(u => u.qr_token === tokenOrUrl || u.id === tokenOrUrl);
    if (match) {
      router.push(`/client-portal/units/${match.id}`);
      return;
    }

    // Kalau tidak ada di fleet, coba resolve via API publik lalu redirect ke passport page
    try {
      await unitApi.findByQrToken(tokenOrUrl);
      // Jika unit valid tapi bukan milik client ini, arahkan ke passport publik
      router.push(`/id/${tokenOrUrl}`);
    } catch {
      setResolveError(`QR Code tidak dikenali atau unit tidak terdaftar di akun Anda. (Token: ${tokenOrUrl})`);
      setResolving(false);
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <button className={styles.pageBackBtn} onClick={() => router.push('/client-portal/dashboard')}>
        <ArrowLeft size={15} /> Beranda
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Scan QR</h1>
        <p className={styles.pageDescription}>
          Scan QR Code pada unit untuk langsung membuka detail unit tersebut.
        </p>
      </div>

      {resolving && (
        <div className={scanStyles.resolvingBanner}>
          <div className={scanStyles.spinnerSmall} />
          Memverifikasi unit...
        </div>
      )}

      {resolveError && (
        <div className={scanStyles.errorBanner}>
          <AlertTriangle size={15} />
          {resolveError}
        </div>
      )}

      {/* Tab switcher */}
      <div className={scanStyles.tabs}>
        <button
          className={`${scanStyles.tab} ${tab === 'camera' ? scanStyles.tabActive : ''}`}
          onClick={() => setTab('camera')}
        >
          <Camera size={15} /> Kamera
        </button>
        <button
          className={`${scanStyles.tab} ${tab === 'manual' ? scanStyles.tabActive : ''}`}
          onClick={() => setTab('manual')}
        >
          <Search size={15} /> Pencarian Manual
        </button>
      </div>

      <div className={scanStyles.contentWrap}>
        {tab === 'camera' ? (
          <QrScanner onResult={handleQrResult} />
        ) : (
          <ManualSearch fleet={fleet} />
        )}
      </div>
    </div>
  );
}
