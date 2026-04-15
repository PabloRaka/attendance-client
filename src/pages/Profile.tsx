import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Camera, CheckCircle, AlertCircle, User, X, RefreshCw, Shield } from 'lucide-react';

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

// ─── Camera Capture Modal ─────────────────────────────────────────────────────

interface CameraModalProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => {
        if (mounted) setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.');
      });
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopCamera = () => streamRef.current?.getTracks().forEach(t => t.stop());

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamera();
      onCapture(blob, canvas.toDataURL('image/jpeg'));
    }, 'image/jpeg', 0.92);
  };

  const handleAutoCapture = () => {
    let count = 3;
    setCountdown(count);
    const iv = setInterval(() => {
      count--;
      if (count <= 0) { clearInterval(iv); setCountdown(null); capture(); }
      else setCountdown(count);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute right-4 top-4 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#817BB9]/10 flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#817BB9]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Capture Wajah</h2>
              <div className="flex flex-col gap-0.5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Live Camera Preview</p>
                <div className="bg-yellow-100 border border-yellow-200 rounded-2xl px-4 py-3 mt-3 flex items-start gap-3 shadow-sm">
                  <span className="text-xl">💡</span>
                  <p className="text-yellow-800 text-[13px] font-black leading-tight uppercase tracking-wide">
                    Pastikan bahu terlihat<br/>
                    <span className="text-yellow-600/80 text-[11px] font-bold">Agar dapat diverifikasi sistem</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {cameraError ? (
            <div className="bg-red-50 border border-red-100 text-red-500 rounded-2xl p-4 text-xs font-bold mb-4">
              {cameraError}
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-slate-100 rounded-[24px] overflow-hidden shadow-inner mb-6">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 rounded-[40px] border-4 border-dashed border-white/40 animate-pulse" />
              </div>
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <span className="text-8xl font-black text-white">{countdown}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            {!cameraError && (
              <>
                <button onClick={capture} disabled={!ready || countdown !== null} className="flex-1 bg-[#817BB9] hover:bg-[#6e68a3] text-white font-black py-4 rounded-[20px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#817BB9]/20">
                  <Camera className="w-5 h-5" /> Ambil Foto
                </button>
                <button onClick={handleAutoCapture} disabled={!ready || countdown !== null} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50">
                  {countdown !== null ? `${countdown}...` : 'Timer 3s'}
                </button>
              </>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

// ─── Profile Page ─────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, setUser } = useAuth();

  // Face upload states
  const [faceFile, setFaceFile] = useState<File | Blob | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState(false);
  const [faceMessage, setFaceMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [storedFaceUrl, setStoredFaceUrl] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const hasFace = user?.has_face;

  useEffect(() => {
    let url: string | null = null;
    if (hasFace) {
      api.user.getFacePhoto()
        .then((blob: any) => {
          url = URL.createObjectURL(blob);
          setStoredFaceUrl(url);
        })
        .catch(err => console.error("Error fetching face photo:", err));
    } else {
      setStoredFaceUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [hasFace, user?.id]);



  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
    setFaceMessage('');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleCameraCapture = (blob: Blob, previewUrl: string) => {
    setFaceFile(blob);
    setFacePreview(previewUrl);
    setFaceMessage('');
    setShowCamera(false);
  };

  const handleClearFace = () => {
    setFaceFile(null);
    setFacePreview(null);
    setFaceMessage('');
  };

  const handleUploadFace = async () => {
    if (!faceFile) return;
    setIsUploadingFace(true);
    setFaceMessage('');
    const compressed = await compressImage(faceFile);
    const formData = new FormData();
    formData.append('file', compressed, 'face.jpg');
    try {
      const updatedUser: any = await api.user.uploadFace(formData);
      setFaceMessage('Foto wajah berhasil disimpan!');
      setFaceFile(null);
      setFacePreview(null);
      if (setUser) setUser(updatedUser);
    } catch (err: any) {
      setFaceMessage(err);
    } finally {
      setIsUploadingFace(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header Profile */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
        <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl border border-slate-50 relative">
          <div className="w-full h-full bg-[#817BB9] rounded-full flex items-center justify-center text-white text-3xl font-black">
             {user?.fullname?.[0]}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full" />
        </div>
        <div className="text-center sm:text-left">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{user?.fullname}</h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
             <Shield className="w-4 h-4 text-[#817BB9]" /> Account {user?.role}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Col: Face Photo & Security */}
        <div className="lg:col-span-12 space-y-10">
          
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-[#817BB9]/10 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#817BB9]" />
               </div>
               <h2 className="text-xl font-black text-slate-900">Data Wajah Absensi</h2>
             </div>

             <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                {/* Photo Container */}
                <div className="relative w-56 h-56 rounded-[32px] overflow-hidden bg-slate-50 border-4 border-white shadow-xl flex-shrink-0">
                  {facePreview ? (
                    <>
                      <img src={facePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={handleClearFace} className="absolute top-4 right-4 p-2 bg-red-500 rounded-full text-white shadow-lg hover:scale-110 transiton-all"><X className="w-3 h-3" /></button>
                    </>
                  ) : hasFace ? (
                    storedFaceUrl ? (
                      <img src={storedFaceUrl} alt="Face" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-200">
                      <User className="w-20 h-20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6">
                   <div className="space-y-4">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${hasFace ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                         {hasFace ? <><CheckCircle className="w-3 h-3" /> Foto Terdaftar</> : <><AlertCircle className="w-3 h-3" /> Foto Belum Ada</>}
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Foto wajah digunakan untuk proses verifikasi presensi. Pastikan foto memiliki pencahayaan yang cukup dan wajah tidak tertutup atribut.
                      </p>
                   </div>

                   {faceMessage && (
                     <div className={`p-4 rounded-2xl text-xs font-bold ${faceMessage.includes('Error') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                       {faceMessage}
                     </div>
                   )}

                   <div className="flex flex-wrap gap-4 pt-4">
                      {!faceFile ? (
                        hasFace ? (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold leading-relaxed flex items-center gap-3">
                             <Shield className="w-5 h-5 text-slate-300" />
                             Foto terdaftar! Hubungi admin untuk penggantian.
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setShowCamera(true)} className="px-6 py-4 bg-[#817BB9]/10 text-[#817BB9] font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#817BB9] hover:text-white transition-all">
                              Kamera
                            </button>
                            <button onClick={() => galleryInputRef.current?.click()} className="px-6 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                              Gallery
                            </button>
                          </>
                        )
                      ) : (
                        <button onClick={handleUploadFace} disabled={isUploadingFace} className="flex-1 sm:flex-none px-10 py-4 bg-[#817BB9] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-[#817BB9]/20 hover:scale-105 transition-all">
                          {isUploadingFace ? 'Menyimpan...' : 'Simpan Foto Baru'}
                        </button>
                      )}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Account Info */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900">Informasi Dasar</h2>
               </div>
               
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Nama Lengkap</label>
                   <div className="px-5 py-3.5 bg-slate-50 rounded-2xl text-slate-900 font-bold text-sm border border-slate-100">
                     {user?.fullname}
                   </div>
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Username</label>
                   <div className="px-5 py-3.5 bg-slate-50 rounded-2xl text-slate-900 font-bold text-sm border border-slate-100">
                     @{user?.username}
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-center">
               <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
               <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pusat Bantuan</h4>
               <p className="text-sm font-bold text-white/80 mb-4">Butuh bantuan mengenai akun atau data Anda? Hubungi Admin.</p>
               <a 
                  href="https://wa.me/6281389888933" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] font-black uppercase tracking-widest text-[#817BB9] hover:text-white transition-all text-left block"
               >
                  Kontak Sekarang →
               </a>
            </div>
          </div>

        </div>
      </div>

      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryChange} />
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
    </div>
  );
};

export default Profile;
