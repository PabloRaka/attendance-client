import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Plus, Filter, Edit2, Trash2, Camera, 
  Scan, X, CheckCircle, AlertCircle, ImageIcon, ArrowRight,
  Shield, MapPin, Mail, Key, MoreVertical, LogIn, LogOut
} from 'lucide-react';
import Pagination, { PageSizeSelector } from '../components/Pagination';

// ─── Face Manager Modal ───────────────────────────────────────────────────────

interface FaceManagerProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

const FaceManager: React.FC<FaceManagerProps> = ({ user, onClose, onUpdate }) => {
  const [phase, setPhase] = useState<'choose' | 'camera' | 'preview' | 'uploading'>('choose');
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => streamRef.current?.getTracks().forEach(t => t.stop());

  const openCamera = async () => {
    setCameraError('');
    setPhase('camera');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch { setCameraError('Gagal akses kamera.'); }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 640; canvas.height = 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((b) => {
      if (!b) return;
      setFaceBlob(b); setPreviewUrl(canvas.toDataURL('image/jpeg'));
      setPhase('preview'); stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFaceBlob(f); setPreviewUrl(URL.createObjectURL(f)); setPhase('preview');
  };

  const handleUpload = async () => {
    if (!faceBlob) return;
    setPhase('uploading'); setMsg('');
    const fd = new FormData(); fd.append('file', faceBlob, 'admin_face.jpg');
    try {
      await api.admin.updateUserFace(user.id, fd);
      setMsg('✅ Berhasil memperbarui foto wajah.');
      setTimeout(() => { onUpdate(); onClose(); }, 1500);
    } catch (e: any) { setMsg(`❌ Gagal: ${e}`); setPhase('preview'); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={() => { stopCamera(); onClose(); }}
          className="absolute right-6 top-6 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#817BB9]/10 flex items-center justify-center text-[#817BB9] font-black">
               {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Kelola Wajah</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">@{user.username}</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${user.has_face ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
            {user.has_face ? <><CheckCircle className="w-3.5 h-3.5" /> Sudah Ada Foto</> : <><AlertCircle className="w-3.5 h-3.5" /> Belum Ada Foto</>}
          </div>

          {msg && <div className={`mb-6 p-4 rounded-2xl text-[10px] font-bold ${msg.includes('❌') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

          {phase === 'choose' && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={openCamera} className="group flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-[#817BB9]/20 hover:bg-[#817BB9]/5 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-[#817BB9]" /></div>
                <p className="font-black text-slate-900 text-xs">Kamera</p>
              </button>
              <button onClick={() => galleryRef.current?.click()} className="group flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-[#817BB9]/20 hover:bg-[#817BB9]/5 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon className="w-6 h-6 text-[#817BB9]" /></div>
                <p className="font-black text-slate-900 text-xs">Galeri</p>
              </button>
            </div>
          )}

          {phase === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-slate-100 rounded-[28px] overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-40 h-52 rounded-[32px] border-4 border-dashed border-white/30" />
                </div>
              </div>
              <button onClick={capture} className="w-full bg-[#817BB9] text-white font-black py-4 rounded-[20px] shadow-lg shadow-[#817BB9]/20 transition-all flex items-center justify-center gap-2">
                 <Camera className="w-5 h-5" /> Ambil Foto
              </button>
            </div>
          )}

          {previewUrl && (phase === 'preview' || phase === 'uploading') && (
            <div className="space-y-6">
              <div className="relative aspect-square bg-slate-100 rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                {phase === 'uploading' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" /></div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setPhase('choose')} disabled={phase === 'uploading'} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-[20px] text-xs">Ulangi</button>
                <button onClick={handleUpload} disabled={phase === 'uploading'} className="flex-1 bg-[#817BB9] text-white font-black py-4 rounded-[20px] text-xs shadow-lg shadow-[#817BB9]/20 uppercase tracking-widest">Kirim Foto</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// ─── Edit User Modal ──────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUpdate }) => {
  const [fullname, setFullname] = useState(user.fullname);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.admin.updateUser(user.id, { fullname, role, password });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err || 'Gagal memperbarui user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Edit Pengguna</h2>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-all"><X className="w-5 h-5" /></button>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold">❌ {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <input 
                type="text" required value={fullname} onChange={(e) => setFullname(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
              <select 
                value={role} onChange={(e) => setRole(e.target.value)}
                disabled={user.username === 'admin'}
                className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all appearance-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru (Opsional)</label>
              <input 
                type="password" placeholder="Kosongkan jika tidak diubah"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
              />
            </div>
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-[#817BB9] text-white font-black py-4 rounded-[22px] shadow-xl shadow-[#817BB9]/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-[11px] mt-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [faceUser, setFaceUser] = useState<any | null>(null);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullname: '', username: '', password: '', role: 'user' });

  useEffect(() => { 
    const timer = setTimeout(() => {
      loadUsers(1); 
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadUsers(currentPage);
  }, [currentPage, pageSize]);

  const loadUsers = async (page: number) => {
    setIsLoading(true);
    try { 
      const res: any = await api.admin.getUsers(page, pageSize, search); 
      setUsers(res.items);
      setTotalPages(res.pages);
      setTotalItems(res.total);
      setCurrentPage(res.page);
    }
    catch { setMsg('❌ Gagal memuat daftar user.'); }
    finally { setIsLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user uses register endpoint which takes FormData ideally, 
      // but let's see if we can use a simpler version or stick to register
      const fd = new FormData();
      fd.append('fullname', newUser.fullname);
      fd.append('username', newUser.username);
      fd.append('password', newUser.password);
      fd.append('role', newUser.role);
      
      await api.auth.register(fd);
      setMsg('✅ User berhasil dibuat!');
      setIsNewUserOpen(false);
      setNewUser({ fullname: '', username: '', password: '', role: 'user' });
      loadUsers();
    } catch (e: any) { setMsg(`❌ Gagal: ${e}`); }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Hapus user @${u.username}?`)) return;
    try { await api.admin.deleteUser(u.id); setMsg('✅ User dihapus.'); loadUsers(); }
    catch (e: any) { setMsg(`❌ Gagal: ${e}`); }
  };

  const forceAttendance = async (userId: number, type: 'in' | 'out') => {
    try {
      await api.admin.forceAttendance(userId, type);
      setMsg(`✅ Absen ${type} berhasil dipaksa.`);
      loadUsers();
    } catch (e: any) { setMsg(`❌ Gagal: ${e}`); }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#817BB9] rounded-[22px] flex items-center justify-center shadow-xl shadow-[#817BB9]/20">
             <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Admin Control</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Manajemen Pengguna</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsNewUserOpen(true)}
          className="w-full md:w-auto bg-[#817BB9] hover:bg-[#6e68a3] text-white font-black px-8 py-4 rounded-[20px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#817BB9]/20 uppercase tracking-widest text-[11px]"
        >
          <Plus className="w-5 h-5" /> Tambah User Baru
        </button>
      </div>

      {msg && (
        <div className={`mb-8 p-6 rounded-[24px] text-xs font-bold animate-in zoom-in-95 ${msg.includes('❌') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {msg}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-10 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#817BB9] transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama atau username..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-slate-50 border-2 border-transparent rounded-[22px] text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-4 px-4 bg-slate-50 rounded-[22px] border border-slate-100">
           <span className="text-[10px] font-black uppercase text-slate-400">Total: {totalItems} Users</span>
        </div>
        <div className="flex items-center px-4 bg-white rounded-[22px] border border-slate-100 shadow-sm">
           <PageSizeSelector pageSize={pageSize} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Identitas</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status Wajah</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Users className="w-16 h-16 opacity-20" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada user ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight">{u.fullname}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{u.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-[#817BB9]/10 text-[#817BB9]' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.has_face ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                         {u.has_face ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                         {u.has_face ? 'Ready' : 'Missing'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2 transition-all">
                        <button onClick={() => setEditingUser(u)} className="p-2.5 bg-slate-50 hover:bg-[#817BB9]/10 text-slate-400 hover:text-[#817BB9] rounded-xl transition-all" title="Edit User">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFaceUser(u)} className="p-2.5 bg-slate-50 hover:bg-[#817BB9]/10 text-slate-400 hover:text-[#817BB9] rounded-xl transition-all" title="Manage Face">
                          <Camera className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u)} className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
           {isLoading ? (
             <div className="py-20 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#817BB9]/10 border-t-[#817BB9] rounded-full animate-spin" />
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat...</p>
                </div>
             </div>
           ) : users.length === 0 ? (
             <div className="py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <Users className="w-16 h-16 opacity-20" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada user ditemukan.</p>
                </div>
             </div>
           ) : (
             users.map((u) => (
               <div key={u.id} className="p-6 bg-white space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-sm font-black text-slate-900 leading-tight">{u.fullname}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">@{u.username}</span>
                   </div>
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-[#817BB9]/10 text-[#817BB9]' : 'bg-slate-100 text-slate-500'}`}>
                      {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                      {u.role}
                   </span>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.has_face ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                       {u.has_face ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                       {u.has_face ? 'Ready' : 'Missing'}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setEditingUser(u)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFaceUser(u)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl" title="Face">
                          <Camera className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u)} className="p-2.5 bg-red-50 text-red-500 rounded-xl" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
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

      {/* NEW USER MODAL */}
      {isNewUserOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#817BB9]/10 rounded-2xl flex items-center justify-center text-[#817BB9]"><Users className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-black text-slate-900">Registrasi User Baru</h2>
                 </div>
                 <button onClick={() => setIsNewUserOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-all"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                   <input 
                    type="text" required placeholder="Contoh: Budi Santoso"
                    value={newUser.fullname} onChange={(e) => setNewUser({...newUser, fullname: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
                   />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                     <input 
                      type="text" required placeholder="budis"
                      value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                     <select 
                      value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all appearance-none"
                     >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                     </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Awal</label>
                   <input 
                    type="password" required placeholder="••••••••"
                    value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[18px] px-6 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#817BB9]/20 transition-all"
                   />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-[22px] shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-[11px] mt-4">
                  Simpan Akun Baru
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onUpdate={() => { loadUsers(); setMsg('✅ User berhasil diperbarui!'); }} 
        />
      )}

      {/* FACE MANAGER MODAL */}
      {faceUser && <FaceManager user={faceUser} onClose={() => setFaceUser(null)} onUpdate={loadUsers} />}

    </div>
  );
};

export default Admin;
