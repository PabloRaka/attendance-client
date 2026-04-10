import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  History as HistoryIcon, ArrowUpRight, ArrowDownLeft, Clock, 
  Calendar, User, Filter, Search, X, ArrowRight, LogIn, LogOut,
  CheckCircle, AlertCircle
} from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val > endDate) setEndDate('');
  };

  const handleEndDateChange = (val: string) => {
    if (startDate && val < startDate) return;
    setEndDate(val);
  };

  const fetchData = async () => {
    if (startDate && endDate && startDate > endDate) return;
    setIsLoading(true);
    try {
      let data: any[];
      if (isAdmin) {
        // Fetch all logs if admin
        data = await api.admin.getLogs(startDate || undefined, endDate || undefined);
      } else {
        // Fetch personal history if user
        data = await api.user.getHistory();
      }
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const forceAttendance = async (userId: number, type: 'in' | 'out') => {
    try {
      await api.admin.forceAttendance(userId, type);
      setMsg({ text: `Berhasil mencatat absen ${type} secara paksa`, type: 'success' });
      fetchData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ text: String(err), type: 'error' });
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const filteredHistory = history.filter(h => {
    if (!isAdmin || !search) return true;
    const s = search.toLowerCase();
    return (h.fullname?.toLowerCase().includes(s) || h.username?.toLowerCase().includes(s));
  });

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Toast Message */}
      {msg && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-[28px] shadow-2xl flex items-center gap-3 border animate-in slide-in-from-top-full duration-300 ${
          msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest">{msg.text}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#817BB9]/10 rounded-[22px] flex items-center justify-center">
            <HistoryIcon className="w-7 h-7 text-[#817BB9]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {isAdmin ? 'Log Presensi Global' : 'Riwayat Kehadiran'}
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? 'Memantau seluruh aktivitas absensi user' : 'Laporan Aktivitas Absensi Anda'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/20">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent focus-within:border-[#817BB9]/20 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[11px] font-bold focus:outline-none text-slate-700 w-32 md:w-48"
              />
            </div>

            <div className="w-px h-6 bg-slate-100 hidden sm:block" />

            {/* Date Filters */}
            <div 
              onClick={() => startDateRef.current?.showPicker()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                ref={startDateRef}
                type="date" 
                value={startDate} 
                max={endDate || undefined}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-slate-600 cursor-pointer"
              />
            </div>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <div 
              onClick={() => endDateRef.current?.showPicker()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                ref={endDateRef}
                type="date" 
                value={endDate} 
                min={startDate || undefined}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-slate-600 cursor-pointer"
              />
            </div>
            {(startDate || endDate || search) && (
              <button 
                onClick={clearFilters}
                className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                title="Hapus Filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {isAdmin && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengguna</th>}
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Tanggal</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipe Absensi</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metode</th>
              {isAdmin && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi Cepat</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 3} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat Data...</p>
                   </div>
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 3} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-4 text-slate-300">
                      <HistoryIcon className="w-16 h-16 stroke-[1.5] opacity-20" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada catatan absensi.'}
                      </p>
                   </div>
                </td>
              </tr>
            ) : (
              filteredHistory.map((h, i) => (
                <tr key={h.id || i} className="group hover:bg-slate-50/50 transition-colors">
                  {isAdmin && (
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight">{h.fullname}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{h.username}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-slate-900 font-black text-sm mb-1">
                         <Calendar className="w-3.5 h-3.5 text-slate-300" />
                         {new Date(h.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                         <Clock className="w-3.5 h-3.5" />
                         {new Date(h.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                      h.attendance_type === 'in' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {h.attendance_type === 'in' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      {h.attendance_type === 'in' ? 'Masuk / Check-in' : 'Keluar / Check-out'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                      {h.method ? h.method.replace(/_/g, ' ') : '-'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => forceAttendance(h.user_id, 'in')} 
                          className="p-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all" 
                          title="Force In"
                        >
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => forceAttendance(h.user_id, 'out')} 
                          className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-all" 
                          title="Force Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
