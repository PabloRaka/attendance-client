import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Scan, AlertCircle, UserCheck } from 'lucide-react';

// Lazy loading modals to improve LCP
const FaceModal = lazy(() => import('../components/FaceModal'));
const TutorialModal = lazy(() => import('../components/TutorialModal'));

interface AttendanceLog {
  id: number;
  timestamp: string;
  attendance_type: 'in' | 'out';
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getTutorialStorageKey = (username?: string) =>
  username ? `attendance_tutorial_seen_${username}` : null;

const Dashboard = () => {
  const { user } = useAuth();
  const [isFaceOpen, setIsFaceOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isTutorialAcknowledged, setIsTutorialAcknowledged] = useState(false);
  const [hasInitializedTutorial, setHasInitializedTutorial] = useState(false);
  const [attendanceWarning, setAttendanceWarning] = useState('');
  const [, setIsCheckingAttendance] = useState(false);

  const hasFacePhoto = user?.has_face;

  useEffect(() => {
    if (!user || hasInitializedTutorial) return;

    const tutorialStorageKey = getTutorialStorageKey(user.username);
    const hasSeenTutorial = tutorialStorageKey ? localStorage.getItem(tutorialStorageKey) === 'true' : true;

    if (!hasSeenTutorial) {
      setIsTutorialOpen(true);
      setIsTutorialAcknowledged(false);
    }

    setHasInitializedTutorial(true);
  }, [user, hasInitializedTutorial]);

  const handleCloseTutorial = () => {
    if (!user || !isTutorialAcknowledged) {
      return;
    }

    const tutorialStorageKey = getTutorialStorageKey(user.username);
    if (tutorialStorageKey) {
      localStorage.setItem(tutorialStorageKey, 'true');
    }

    setIsTutorialOpen(false);
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
        setAttendanceWarning('Anda sudah presensi masuk dan keluar hari ini.');
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

      <Suspense fallback={null}>
        {isTutorialOpen && (
          <TutorialModal
            hasFacePhoto={hasFacePhoto}
            onClose={handleCloseTutorial}
            acknowledged={isTutorialAcknowledged}
            onAcknowledgedChange={setIsTutorialAcknowledged}
          />
        )}
        {isFaceOpen && <FaceModal onClose={() => setIsFaceOpen(false)} />}
      </Suspense>
    </div>
  );
};

export default Dashboard;
