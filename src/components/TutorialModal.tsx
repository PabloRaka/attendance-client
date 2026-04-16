import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TutorialModalProps {
  hasFacePhoto?: boolean;
  onClose: () => void;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({
  hasFacePhoto,
  onClose,
  acknowledged,
  onAcknowledgedChange,
}) => (
  <div className="fixed inset-0 z-[210] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-[24px] sm:rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
      <button
        onClick={onClose}
        disabled={!acknowledged}
        className="absolute right-6 top-6 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-10">
        <div className="flex items-start sm:items-center gap-4 mb-6 sm:mb-8 pr-12">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#817BB9]/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-7 h-7 text-[#817BB9]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Tutorial Singkat Presensi</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold mt-1">Ikuti alur ini sebelum mulai presensi.</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">1</div>
            <div>
              <p className="text-slate-900 font-black text-sm sm:text-base">Upload wajah di halaman Profile</p>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                {hasFacePhoto ? 'Foto wajah Anda sudah tersedia. Anda bisa lanjut ke langkah berikutnya.' : 'Sistem butuh 1 foto wajah sebagai data verifikasi utama.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">2</div>
            <div>
              <p className="text-slate-900 font-black text-sm sm:text-base">Buka menu Presensi Wajah di dashboard</p>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Frontend akan cek dulu apakah presensi hari ini masih bisa dilakukan.</p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">3</div>
            <div>
              <p className="text-slate-900 font-black text-sm sm:text-base">Arahkan wajah ke kamera dengan pencahayaan cukup</p>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Pastikan wajah terlihat jelas agar verifikasi berhasil.</p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#817BB9] text-white flex items-center justify-center text-sm font-black flex-shrink-0">4</div>
            <div>
              <p className="text-slate-900 font-black text-sm sm:text-base">Presensi hanya 1 kali masuk dan 1 kali keluar per hari</p>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Jika presensi hari ini sudah lengkap, sistem akan langsung menolak.</p>
            </div>
          </div>
        </div>

        <label className="mt-6 sm:mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAcknowledgedChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#817BB9] focus:ring-[#817BB9]"
          />
          <span className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
            Saya sudah memahami tutorial ini dan tidak perlu ditampilkan lagi.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {!hasFacePhoto && (
            <Link
              to="/profile"
              onClick={() => onAcknowledgedChange(false)}
              className="flex-1 bg-[#817BB9] hover:bg-[#6e68a3] text-white font-black py-3.5 sm:py-4 rounded-[20px] shadow-lg shadow-[#817BB9]/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              Ke Halaman Profile
            </Link>
          )}
          <button
            onClick={onClose}
            disabled={!acknowledged}
            className="flex-1 px-6 py-3.5 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[20px] transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default TutorialModal;
