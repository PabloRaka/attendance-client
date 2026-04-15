import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  History as HistoryIcon, ArrowUpRight, ArrowDownLeft, Clock, 
  Calendar, Search, X, ArrowRight, LogIn, LogOut,
  CheckCircle, AlertCircle, FileSpreadsheet, MapPin
} from 'lucide-react';
import Pagination, { PageSizeSelector } from '../components/Pagination';

interface AttendanceLog {
  id?: number;
  user_id: number;
  fullname: string;
  username: string;
  timestamp: string;
  attendance_type: 'in' | 'out';
  status: string | null;
  method: string | null;
  latitude?: string | null;
  longitude?: string | null;
  location_name?: string | null;
}

const formatMethod = (method: string | null) => {
  if (!method) return '-';
  if (method === 'face_recognition') return 'Scan';
  return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// ─── Map Modal Component ──────────────────────────────────────────────────────

interface MapModalProps {
  lat: string;
  lon: string;
  locationName?: string | null;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ lat, lon, locationName, onClose }) => {
  // OSM Embed URL with marker
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon)-0.005}%2C${parseFloat(lat)-0.005}%2C${parseFloat(lon)+0.005}%2C${parseFloat(lat)+0.005}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose}
          className="absolute right-6 top-6 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-500 hover:bg-white shadow-lg transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Lokasi Presensi</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                {locationName || `${lat}, ${lon}`}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] overflow-hidden border border-slate-100 shadow-inner bg-slate-50 relative aspect-video">
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src={mapUrl}
            />
          </div>
          
          <div className="mt-6 flex justify-between items-center">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Presisi Koordinat: {lat}, {lon}
             </div>
             <a 
              href={`https://www.google.com/maps?q=${lat},${lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase text-blue-500 hover:underline"
             >
                Buka di Google Maps →
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<{lat: string, lon: string, name?: string | null} | null>(null);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = user?.role === 'admin';

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val > endDate) setEndDate('');
  };

  const handleEndDateChange = (val: string) => {
    if (startDate && val < startDate) return;
    setEndDate(val);
  };

  const fetchData = useCallback(async (page: number) => {
    if (startDate && endDate && startDate > endDate) return;
    setIsLoading(true);
    try {
      let res: any;
      if (isAdmin) {
        // Fetch all logs if admin with server-side pagination & filters
        res = await api.admin.getLogs(page, pageSize, startDate || undefined, endDate || undefined, search || undefined);
      } else {
        // Fetch personal history if user with server-side pagination
        res = await api.user.getHistory(page, pageSize);
      }
      setHistory(res.items);
      setTotalPages(res.pages);
      setTotalItems(res.total);
      setCurrentPage(res.page);
    } catch {
      console.error("Failed to fetch history");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, startDate, endDate, pageSize, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, startDate, endDate]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, pageSize, fetchData]);

  const forceAttendance = async (userId: number, type: 'in' | 'out') => {
    try {
      await api.admin.forceAttendance(userId, type);
      setMsg({ text: `Berhasil mencatat presensi ${type} secara paksa`, type: 'success' });
      fetchData(currentPage);
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ text: String(err), type: 'error' });
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = (await api.admin.exportExcel(
        startDate || undefined, 
        endDate || undefined,
        search || undefined
      )) as unknown as Blob;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap_absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMsg({ text: 'Excel berhasil didownload', type: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ text: 'Gagal mendownload Excel', type: 'error' });
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const handleSearchChange = (val: string) => {
     setSearch(val);
     setCurrentPage(1);
  };

  const handleDateChange = (type: 'start' | 'end', val: string) => {
     if (type === 'start') handleStartDateChange(val);
     else handleEndDateChange(val);
     setCurrentPage(1);
  };

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

      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#817BB9]/10 rounded-[22px] flex items-center justify-center">
            <HistoryIcon className="w-7 h-7 text-[#817BB9]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {isAdmin ? 'Log Presensi Global' : 'Riwayat Kehadiran'}
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? 'Memantau seluruh aktivitas presensi user' : 'Laporan Aktivitas Presensi Anda'}
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-10 bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
          <div className="px-5 md:px-7 py-5 md:py-6 bg-gradient-to-r from-[#817BB9] via-[#7770af] to-[#6e68a3] border-b border-[#6e68a3]/50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Kontrol Data</p>
            <h2 className="text-lg md:text-xl font-black text-white mt-1">Filter & Aksi Cepat Presensi</h2>
          </div>

          <div className="p-5 md:p-7 space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus-within:border-[#817BB9]/30 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau username user..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
                <button
                  type="button"
                  onClick={() => startDateRef.current?.showPicker()}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Mulai</span>
                  </div>
                  <input
                    ref={startDateRef}
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest focus:outline-none text-slate-700 cursor-pointer"
                  />
                </button>

                <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300 justify-self-center" />

                <button
                  type="button"
                  onClick={() => endDateRef.current?.showPicker()}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sampai</span>
                  </div>
                  <input
                    ref={endDateRef}
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest focus:outline-none text-slate-700 cursor-pointer"
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Baris per halaman:</span>
                <PageSizeSelector pageSize={pageSize} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {(startDate || endDate || search) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    title="Hapus Filter"
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </button>
                )}

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#817BB9] hover:bg-[#6e68a3] text-white rounded-xl transition-all shadow-lg shadow-[#817BB9]/20 text-[10px] font-black uppercase tracking-widest"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden mb-8">
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {isAdmin && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengguna</th>}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Tanggal</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipe Presensi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metode</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lokasi</th>
                {isAdmin && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi Cepat</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat Data...</p>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                        <HistoryIcon className="w-16 h-16 stroke-[1.5] opacity-20" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada catatan presensi.'}
                        </p>
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
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
                      {h.status ? (
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                          h.status === 'terlambat' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {h.status === 'terlambat' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {h.status}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-2 bg-slate-50 rounded-xl text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-100 whitespace-nowrap">
                        {formatMethod(h.method)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {h.latitude && h.longitude ? (
                        <button 
                          onClick={() => setSelectedLocation({ lat: h.latitude!, lon: h.longitude!, name: h.location_name })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 group/loc"
                        >
                          <MapPin className="w-3 h-3 text-slate-400 group-hover/loc:text-blue-500" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {h.location_name || 'Lihat Peta'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
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

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="px-8 py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat Data...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="flex flex-col items-center gap-4 text-slate-300">
                  <HistoryIcon className="w-16 h-16 stroke-[1.5] opacity-20" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada catatan presensi.'}
                  </p>
              </div>
            </div>
          ) : (
            history.map((h, i) => (
              <div key={h.id || i} className="p-6 bg-white space-y-4">
                {isAdmin && (
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#817BB9] font-black text-xs uppercase">
                       {h.username[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 leading-tight">{h.fullname}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">@{h.username}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs mb-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {new Date(h.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(h.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    h.attendance_type === 'in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {h.attendance_type === 'in' ? 'Check-in' : 'Check-out'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {h.status && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        h.status === 'terlambat' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                         {h.status}
                      </div>
                    )}
                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-slate-400 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                       {formatMethod(h.method)}
                    </span>
                    {h.latitude && h.longitude && (
                      <button 
                        onClick={() => setSelectedLocation({ lat: h.latitude!, lon: h.longitude!, name: h.location_name })}
                        className="px-3 py-1 bg-blue-50 text-blue-500 rounded-lg flex items-center gap-1 text-[8px] font-black uppercase"
                      >
                         <MapPin className="w-2.5 h-2.5" /> {h.location_name ? 'Lokasi' : 'Peta'}
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => forceAttendance(h.user_id, 'in')} className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <LogIn className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => forceAttendance(h.user_id, 'out')} className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination component */}
      <div className="mt-8 bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          totalItems={totalItems}
          hidePageSize={true}
        />
      </div>
      {/* Map Modal */}
      {selectedLocation && (
        <MapModal 
          lat={selectedLocation.lat}
          lon={selectedLocation.lon}
          locationName={selectedLocation.name}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default History;
