import React, { useState, useRef, useEffect } from 'react';
import { Scan, CheckCircle, AlertCircle, Camera, X, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

// ─── Types & Utilities ──────────────────────────────────────────────────────

type FacePhase = 'choose' | 'camera' | 'preview' | 'processing' | 'result';

interface FaceModalProps {
  onClose: () => void;
}

interface LocationCoords {
  lat: number;
  lng: number;
}

const compressImage = (blob: Blob, maxPx = 640, quality = 0.80): Promise<Blob> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', quality);
    };
    img.src = url;
  });

const getLocationErrorMessage = (error?: GeolocationPositionError | null): string => {
  if (!window.isSecureContext) {
    return 'Akses lokasi hanya bisa digunakan dari koneksi aman (HTTPS). Buka aplikasi dari link HTTPS lalu coba lagi.';
  }
  if (!navigator.geolocation) {
    return 'Browser ini tidak mendukung akses lokasi. Gunakan browser lain yang mendukung geolocation.';
  }
  if (!error) {
    return 'Gagal mengambil lokasi. Pastikan GPS aktif dan izin lokasi sudah diberikan.';
  }
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Izin lokasi ditolak. Buka pengaturan browser, izinkan lokasi untuk situs ini, lalu coba lagi.';
    case error.POSITION_UNAVAILABLE:
      return 'Lokasi tidak bisa dideteksi. Pastikan GPS/perangkat lokasi aktif lalu coba lagi.';
    case error.TIMEOUT:
      return 'Pengambilan lokasi terlalu lama. Pastikan sinyal lokasi stabil lalu coba lagi.';
    default:
      return 'Gagal mengambil lokasi. Pastikan GPS aktif dan izin lokasi sudah diberikan.';
  }
};

// ─── Component ──────────────────────────────────────────────────────────────

const FaceModal: React.FC<FaceModalProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<FacePhase>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');

  // Real-time quality states
  const [quality, setQuality] = useState<{ ok: boolean; message: string }>({ ok: true, message: '' });
  const [bypass, setBypass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [detector, setDetector] = useState<any>(null);

  useEffect(() => {
    handleSelectCamera();
    initFaceDetector();
    
    // Create hidden canvas for brightness analysis once
    analysisCanvasRef.current = document.createElement('canvas');
    analysisCanvasRef.current.width = 40;
    analysisCanvasRef.current.height = 30;

    return () => stopCamera();
  }, []);

  const initFaceDetector = async () => {
    try {
      // @ts-ignore
      const vision = (window as any).vision || await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const faceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU"
        },
        runningMode: "VIDEO"
      });
      setDetector(faceDetector);
    } catch (err) {
      console.error("Failed to init face detector:", err);
    }
  };

  const checkBrightness = (video: HTMLVideoElement): number => {
    const canvas = analysisCanvasRef.current;
    if (!canvas) return 100;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 100;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    return brightness / (canvas.width * canvas.height);
  };

  // Optimized Analysis Loop (Throttled to 200ms)
  useEffect(() => {
    if (phase !== 'camera' || !videoRef.current || !detector) return;
    
    const analyzeTrack = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      
      // 1. Check Brightness
      const brightness = checkBrightness(video);
      if (brightness < 40) {
        setQuality({ ok: false, message: 'Pencahayaan terlalu gelap 🌙' });
      } else {
        // 2. Check Face
        const detections = detector.detectForVideo(video, performance.now()).detections;
        if (detections.length === 0) {
          setQuality({ ok: false, message: 'Wajah tidak terdeteksi 🔍' });
        } else {
          const face = detections[0].boundingBox;
          const videoArea = video.videoWidth * video.videoHeight;
          const faceArea = face.width * face.height;
          const faceRatio = faceArea / videoArea;

          if (faceRatio > 0.45) {
            setQuality({ ok: false, message: 'Wajah terlalu dekat 🤳' });
          } else if (faceRatio < 0.05) {
            setQuality({ ok: false, message: 'Wajah terlalu jauh 📏' });
          } else {
            setQuality({ ok: true, message: '' });
          }
        }
      }
    };

    const intervalId = setInterval(analyzeTrack, 200);
    return () => clearInterval(intervalId);
  }, [phase, detector]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleSelectCamera = async () => {
    setCameraError('');
    setLocationNotice('');
    setPhase('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const handleCapture = () => {
    if (!quality.ok && !bypass) {
      setAttempts(prev => {
        const next = prev + 1;
        if (next >= 3) setBypass(true);
        return next;
      });
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setPreviewUrl(canvas.toDataURL('image/jpeg'));
      setPhase('preview');
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    stopCamera();
    setCapturedBlob(null);
    setPreviewUrl(null);
    setResult(null);
    setCameraError('');
    setLocationNotice('');
    setPhase('camera');
    setQuality({ ok: true, message: '' });
    setAttempts(0);
    setBypass(false);
    handleSelectCamera();
  };

  const getLocation = (): Promise<LocationCoords> =>
    new Promise((resolve, reject) => {
      if (!window.isSecureContext) {
        reject(new Error(getLocationErrorMessage()));
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error(getLocationErrorMessage()));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (error) => reject(new Error(getLocationErrorMessage(error))),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  const handleSubmit = async () => {
    if (!capturedBlob) return;
    setPhase('processing');
    setLocationNotice('');

    let compressed: Blob;
    let location: LocationCoords;

    try {
      [compressed, location] = await Promise.all([
        compressImage(capturedBlob),
        getLocation()
      ]);
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message || 'Gagal mengambil lokasi.';
      setLocationNotice(message);
      setResult({
        success: false,
        message: 'Lokasi wajib diaktifkan',
        detail: message,
      });
      setPhase('result');
      return;
    }

    const formData = new FormData();
    formData.append('file', compressed, 'face.jpg');
    formData.append('latitude', location.lat.toString());
    formData.append('longitude', location.lng.toString());

    try {
      const res: any = await api.attendance.scanFace(formData);
      setResult({
        success: true,
        message: `${res.user} berhasil presensi ${res.type === 'in' ? 'masuk \ud83d\udfe2' : 'keluar \ud83d\udd34'}${res.attendance_status ? ` (${res.attendance_status})` : ''}`,
        detail: `Pukul ${new Date(res.time).toLocaleTimeString('id-ID')} \u00b7 Kemiripan wajah: ${Math.round((res.similarity || 0) * 100)}%`,
      });
    } catch (err: any) {
      const isAntiSpoof = typeof err === 'string' && (err.includes('Anti-Spoofing') || err.includes('Liveness') || err.includes('layar'));
      setResult({
        success: false,
        message: isAntiSpoof ? 'Kecurangan Terdeteksi' : (err || 'Verifikasi Gagal'),
        detail: isAntiSpoof 
          ? 'Sistem mendeteksi bahwa Anda menggunakan foto atau layar hp. Silakan gunakan wajah asli Anda.'
          : 'Coba pastikan wajah Anda terlihat sepenuhnya di dalam bingkai dengan pencahayaan yang cukup.',
      });
    } finally {
      setPhase('result');
    }
  };

  const handleClose = () => { stopCamera(); onClose(); };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={handleClose}
          className="absolute right-6 top-6 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#817BB9]/10 flex items-center justify-center">
              <Scan className="w-6 h-6 text-[#817BB9]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Scan Wajah</h2>
              <div className="flex flex-col gap-0.5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  {phase === 'camera' && 'Ambil Foto Langsung'}
                  {phase === 'preview' && 'Review Hasil Foto'}
                  {(phase === 'processing' || phase === 'result') && 'Verifikasi Wajah...'}
                </p>
                {phase === 'camera' && (
                  <div className="bg-yellow-100 border border-yellow-200 rounded-2xl px-4 py-3 mt-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-500">
                    <span className="text-xl">\ud83d\udca1</span>
                    <p className="text-yellow-800 text-[13px] font-black leading-tight uppercase tracking-wide">
                      Pastikan bahu terlihat area frame<br/>
                      <span className="text-yellow-600/80 text-[11px] font-bold">Agar dapat diverifikasi sistem</span>
                    </p>
                  </div>
                )}
                {phase === 'preview' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mt-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-500">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-700 text-[12px] font-bold leading-relaxed">
                      Lokasi wajib aktif untuk presensi. Saat verifikasi, browser akan meminta izin lokasi jika belum pernah diberikan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] bg-slate-100 rounded-[24px] overflow-hidden shadow-inner mb-6">
            <video ref={videoRef} autoPlay playsInline muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${phase === 'camera' ? 'opacity-100' : 'opacity-0'}`}
            />

            {phase === 'camera' && !cameraError && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-52 h-64 rounded-[40px] border-4 border-dashed transition-colors duration-300 ${quality.ok ? 'border-white/40' : 'border-red-500/60'}`} />
                </div>

                {quality.message && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6">
                    <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
                      <AlertCircle className="w-3 h-3" /> {quality.message}
                    </div>
                  </div>
                )}

                {bypass && !quality.ok && (
                  <div className="absolute top-6 left-0 right-0 flex justify-center px-6">
                    <div className="bg-amber-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
                       Bypass Aktif: Ambil foto meskipun kualitas kurang
                    </div>
                  </div>
                )}
              </>
            )}

            {previewUrl && (
              <img src={previewUrl} alt="Preview"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${phase === 'preview' || phase === 'processing' ? 'opacity-100' : 'opacity-0'}`}
              />
            )}

            {phase === 'processing' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                <p className="text-slate-900 text-xs font-black uppercase tracking-widest">Memproses Wajah...</p>
              </div>
            )}

            {phase === 'result' && result && (
              <div className={`absolute inset-0 ${result.success ? 'bg-green-50/90' : 'bg-red-50/90'} backdrop-blur-md flex flex-col items-center justify-center gap-4 p-8 text-center animate-in zoom-in-95`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.success ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                  {result.success ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>
                <div>
                  <p className={`text-xl font-black ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                  {result.detail && <p className="text-slate-500 text-sm mt-2 font-medium">{result.detail}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {phase === 'camera' && !cameraError && (
              <>
                <button onClick={handleClose} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] transition-all font-bold text-sm">
                  Kembali
                </button>
                <button 
                  onClick={handleCapture} 
                  className={`flex-1 font-black py-4 rounded-[20px] shadow-lg transition-all flex items-center justify-center gap-2 
                    ${quality.ok || bypass 
                      ? 'bg-[#817BB9] hover:bg-[#6e68a3] text-white shadow-[#817BB9]/20' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                   <Camera className="w-5 h-5" /> 
                   {quality.ok || bypass ? 'Ambil Foto' : 'Perbaiki Posisi'}
                </button>
              </>
            )}

            {phase === 'preview' && (
              <>
                <button onClick={handleRetake} className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] transition-all font-bold text-sm">
                  Ganti Foto
                </button>
                <button onClick={handleSubmit} className="flex-1 bg-[#817BB9] hover:bg-[#6e68a3] text-white font-black py-4 rounded-[20px] shadow-lg shadow-[#817BB9]/20 transition-all flex items-center justify-center gap-2">
                   Simpan & Verifikasi <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {phase === 'result' && (
              <button onClick={result?.success ? handleClose : handleRetake}
                className={`flex-1 font-black py-4 rounded-[20px] text-white shadow-lg transition-all ${result?.success ? 'bg-[#817BB9] hover:bg-[#6e68a3] shadow-[#817BB9]/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
                {result?.success ? 'Selesai \u2713' : 'Coba Lagi'}
              </button>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceModal;
