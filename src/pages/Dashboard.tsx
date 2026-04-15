import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Scan, CheckCircle, AlertCircle, Camera, X, ArrowRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AttendanceLog {
  id: number;
  timestamp: string;
  attendance_type: 'in' | 'out';
}

// Compress image to max 640px, quality 80% to reduce upload size over slow connections
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

// ─── Camera Quality Utils ──────────────────────────────────────────────────

const checkBrightness = (video: HTMLVideoElement): number => {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 30;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 100;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  return brightness / (canvas.width * canvas.height);
};

// ─── Face Recognition Modal ──────────────────────────────────────────────────

type FacePhase = 'choose' | 'camera' | 'preview' | 'processing' | 'result';

interface FaceModalProps {
  onClose: () => void;
}

interface TutorialModalProps {
  hasFacePhoto?: boolean;
  onClose: () => Promise<void> | void;
  isClosing: boolean;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ hasFacePhoto, onClose, isClosing }) => (
  <div className="fixed inset-0 z-[210] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
      <button
        onClick={onClose}
        disabled={isClosing}
        className="absolute right-6 top-6 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-8 sm:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#817BB9]/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-[#817BB9]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Tutorial Singkat Presensi</h2>
            <p className="text-slate-500 text-sm font-bold mt-1">Ikuti alur ini sebelum mulai absen.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">1</div>
            <div>
              <p className="text-slate-900 font-black">Upload wajah di halaman Profile</p>
              <p className="text-slate-500 text-sm font-medium mt-1">
                {hasFacePhoto ? 'Foto wajah Anda sudah tersedia. Anda bisa lanjut ke langkah berikutnya.' : 'Sistem butuh 1 foto wajah sebagai data verifikasi utama.'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">2</div>
            <div>
              <p className="text-slate-900 font-black">Buka menu Presensi Wajah di dashboard</p>
              <p className="text-slate-500 text-sm font-medium mt-1">Frontend akan cek dulu apakah presnsi hari ini masih bisa dilakukan.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">3</div>
            <div>
              <p className="text-slate-900 font-black">Arahkan wajah ke kamera dengan pencahayaan cukup</p>
              <p className="text-slate-500 text-sm font-medium mt-1">Pastikan wajah terlihat jelas agar verifikasi berhasil.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">4</div>
            <div>
              <p className="text-slate-900 font-black">Presensi hanya 1 kali masuk dan 1 kali keluar per hari</p>
              <p className="text-slate-500 text-sm font-medium mt-1">Jika presensi hari ini sudah lengkap, sistem akan langsung menolak.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {!hasFacePhoto && (
            <Link
              to="/profile"
              onClick={onClose}
              className="flex-1 bg-[#817BB9] hover:bg-[#6e68a3] text-white font-black py-4 rounded-[20px] shadow-lg shadow-[#817BB9]/20 transition-all flex items-center justify-center gap-2"
            >
              Ke Halaman Profile
            </Link>
          )}
          <button
            onClick={onClose}
            disabled={isClosing}
            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[20px] transition-all font-bold text-sm"
          >
            {isClosing ? 'Menyimpan...' : 'Saya Mengerti'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const FaceModal: React.FC<FaceModalProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<FacePhase>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [cameraError, setCameraError] = useState('');

  // Real-time quality states
  const [quality, setQuality] = useState<{ ok: boolean; message: string }>({ ok: true, message: '' });
  const [_attempts, setAttempts] = useState(0);
  const [detector, setDetector] = useState<any>(null);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    handleSelectCamera();
    initFaceDetector();
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

  // Analysis Loop
  useEffect(() => {
    if (phase !== 'camera' || !videoRef.current || !detector) return;
    
    let animationFrameId: number;
    const analyzeTrack = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameId = requestAnimationFrame(analyzeTrack);
        return;
      }

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

      animationFrameId = requestAnimationFrame(analyzeTrack);
    };

    analyzeTrack();
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, detector]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleSelectCamera = async () => {
    setCameraError('');
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
    setPhase('camera');
    setQuality({ ok: true, message: '' });
    setAttempts(0);
    setBypass(false);
    handleSelectCamera();
  };

  const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000 }
      );
    });

  const handleSubmit = async () => {
    if (!capturedBlob) return;
    setPhase('processing');

    const [compressed, location] = await Promise.all([
      compressImage(capturedBlob),
      getLocation()
    ]);

    const formData = new FormData();
    formData.append('file', compressed, 'face.jpg');
    if (location) {
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
    }

    try {
      const res: any = await api.attendance.scanFace(formData);
      setResult({
        success: true,
        message: `${res.user} berhasil absen ${res.type === 'in' ? 'masuk 🟢' : 'keluar 🔴'}${res.attendance_status ? ` (${res.attendance_status})` : ''}`,
        detail: `Pukul ${new Date(res.time).toLocaleTimeString('id-ID')} · Kemiripan wajah: ${Math.round((res.similarity || 0) * 100)}%`,
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
          {/* Header */}
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
                    <span className="text-xl">💡</span>
                    <p className="text-yellow-800 text-[13px] font-black leading-tight uppercase tracking-wide">
                      Pastikan bahu terlihat area frame<br/>
                      <span className="text-yellow-600/80 text-[11px] font-bold">Agar dapat diverifikasi sistem</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CHOOSE SOURCE ── */}

          {/* ── CAMERA / PREVIEW / PROCESSING / RESULT ── */}
          {phase !== 'choose' && (
            <>
              {cameraError && phase === 'camera' && (
                <div className="bg-red-50 border border-red-100 text-red-500 rounded-2xl p-4 text-xs font-bold mb-4">
                  {cameraError}
                </div>
              )}

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

              {/* Action Buttons */}
              <div className="flex gap-4">
                {phase === 'camera' && !cameraError && (
                  <>
                    <button onClick={handleRetake} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] transition-all font-bold text-sm">
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
                    {result?.success ? 'Selesai ✓' : 'Coba Lagi'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const [isFaceOpen, setIsFaceOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isClosingTutorial, setIsClosingTutorial] = useState(false);
  const [attendanceWarning, setAttendanceWarning] = useState('');
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);

  const hasFacePhoto = user?.has_face;

  useEffect(() => {
    if (user && !user.has_seen_tutorial) {
      setIsTutorialOpen(true);
    } else {
      setIsTutorialOpen(false);
    }
  }, [user]);

  const handleCloseTutorial = async () => {
    if (!user || user.has_seen_tutorial || isClosingTutorial) {
      setIsTutorialOpen(false);
      return;
    }

    setIsClosingTutorial(true);
    try {
      const updatedUser: any = await api.user.updateTutorialStatus(true);
      setUser(updatedUser);
      setIsTutorialOpen(false);
    } catch (err: any) {
      setAttendanceWarning(err || 'Gagal menyimpan status tutorial.');
    } finally {
      setIsClosingTutorial(false);
    }
  };

  const hasCompletedTodayAttendance = async () => {
    const res: any = await api.user.getHistory(1, 10);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    const todayRecords = (res.items as AttendanceLog[]).filter((item) => {
      const itemDate = new Date(item.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      return itemDate === today;
    });

    const hasCheckIn = todayRecords.some((item) => item.attendance_type === 'in');
    const hasCheckOut = todayRecords.some((item) => item.attendance_type === 'out');
    return hasCheckIn && hasCheckOut;
  };

  const handleOpenFaceAttendance = async () => {
    if (!hasFacePhoto) {
      setAttendanceWarning('');
      setIsFaceOpen(true);
      return;
    }

    setIsCheckingAttendance(true);
    setAttendanceWarning('');

    try {
      const alreadyCompleted = await hasCompletedTodayAttendance();
      if (alreadyCompleted) {
        setAttendanceWarning('Anda sudah absen masuk dan keluar hari ini.');
        return;
      }

      setIsFaceOpen(true);
    } catch (err: any) {
      setAttendanceWarning(err || 'Gagal memeriksa status presensi hari ini.');
    } finally {
      setIsCheckingAttendance(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Welcome Banner */}
      <div className="bg-[#817BB9] rounded-[40px] p-10 sm:p-14 relative overflow-hidden shadow-2xl shadow-[#817BB9]/20">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-20" />
        <div className="absolute left-10 bottom-10 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em]">
                {user?.role} Portal
             </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
             Hello, <span className="opacity-80 underline decoration-white/30 decoration-4 underline-offset-8">{user?.fullname}</span>!
          </h1>
          <p className="text-[#E0DDFE] mt-4 font-bold text-sm sm:text-lg max-w-md">
             Siap mencatatkan kehadiran Anda dengan mudah hari ini?
          </p>
        </div>
      </div>

      {attendanceWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-[24px] px-6 py-4 flex items-center gap-3 font-bold text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{attendanceWarning}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Face Recognition Main Card */}
        <div className="lg:col-span-8">
           <div 
             onClick={handleOpenFaceAttendance}
             className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 group cursor-pointer hover:border-[#817BB9]/30 transition-all active:scale-[0.99] relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-8 text-slate-100 group-hover:text-[#817BB9]/10 transition-colors">
                 <Scan className="w-32 h-32 rotate-12" />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-16 h-16 rounded-[24px] bg-[#817BB9]/10 flex items-center justify-center mb-8 group-hover:bg-[#817BB9] group-hover:scale-110 transition-all duration-300">
                    <Scan className="w-8 h-8 text-[#817BB9] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:text-[#817BB9] transition-colors">Presensi Wajah</h3>
                  <p className="text-slate-400 font-bold text-sm max-w-sm">
                    Cara tercepat untuk melakukan presensi melalui sinkronisasi data wajah secara real-time.
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-4">
                  {hasFacePhoto ? (
                    <div className="flex items-center gap-3 px-6 py-3 bg-green-50 rounded-2xl border border-green-100 text-green-600 text-xs font-black uppercase tracking-widest animate-in zoom-in-95">
                      <UserCheck className="w-4 h-4" /> Foto Wajah OK
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-6 py-3 bg-red-50 rounded-2xl border border-red-100 text-red-500 text-xs font-black uppercase tracking-widest animate-pulse">
                      <AlertCircle className="w-4 h-4" /> Belum Upload Wajah
                    </div>
                  )}
                  
                </div>
              </div>
           </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
                Petunjuk Singkat
             </h4>
             <ul className="space-y-6">
                <li className="flex gap-4">
                   <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">1</div>
                   <p className="text-xs font-bold text-slate-500 leading-relaxed">Upload foto wajah terlebih dahulu di halaman Profile.</p>
                </li>
                <li className="flex gap-4">
                   <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">2</div>
                   <p className="text-xs font-bold text-slate-500 leading-relaxed">Setelah foto wajah tersimpan, klik kartu "Presensi Wajah" untuk mulai.</p>
                </li>
                <li className="flex gap-4">
                   <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">3</div>
                   <p className="text-xs font-bold text-slate-500 leading-relaxed">Hadapkan wajah ke kamera depan untuk verifikasi.</p>
                </li>
                <li className="flex gap-4">
                   <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">4</div>
                   <p className="text-xs font-bold text-slate-500 leading-relaxed">Pastikan pencahayaan cukup untuk verifikasi sukses.</p>
                </li>
             </ul>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
             <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pusat Bantuan</h4>
             <p className="text-sm font-bold text-white/80 mb-4">Butuh bantuan mengenai data wajah Anda? Hubungi Admin.</p>
             <a 
                href="https://wa.me/6281389888933" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] font-black uppercase tracking-widest text-[#817BB9] hover:text-white transition-colors block"
             >
                Kontak Sekarang →
             </a>
          </div>
        </div>
      </div>

      {/* Face Modal */}
      {isTutorialOpen && (
        <TutorialModal
          hasFacePhoto={hasFacePhoto}
          onClose={handleCloseTutorial}
          isClosing={isClosingTutorial}
        />
      )}
      {isFaceOpen && <FaceModal onClose={() => setIsFaceOpen(false)} />}
    </div>
  );
};

export default Dashboard;
