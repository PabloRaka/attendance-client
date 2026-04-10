import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Camera, User, Lock, Mail, ArrowRight } from 'lucide-react';

const Register = () => {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('fullname', fullname);
    if (faceFile) {
      formData.append('file', faceFile);
    }

    try {
      await api.auth.register(formData);
      setError('✅ Registrasi berhasil! Silakan login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#A7A1D1] p-4 font-sans py-12">
      <div className="w-full max-w-[460px] bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 sm:p-10">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-[#F5F3FF] rounded-2xl">
              <span className="text-2xl font-black text-[#817BB9]">LP</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">
              Create Account
            </h1>
            <p className="text-gray-400 font-bold text-[11px] tracking-widest uppercase">
              Gabung dengan AuraAttendance
            </p>
          </div>

          {/* Message Banner */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 ${
              error.includes('berhasil') 
                ? 'bg-green-50 border border-green-100 text-green-600' 
                : 'bg-red-50 border border-red-100 text-red-500'
            }`}>
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#817BB9] transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required 
                  placeholder="Nama Lengkap"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[14px] pl-11 pr-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#817BB9]/30 transition-all text-sm" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#817BB9] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required 
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[14px] pl-11 pr-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#817BB9]/30 transition-all text-sm" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#817BB9] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[14px] pl-11 pr-4 py-3 text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#817BB9]/30 transition-all text-sm" 
                />
              </div>
            </div>

            {/* Face Photo (Optional) */}
            <div className="space-y-2 pt-2">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Face Photo <span className="text-[10px] font-medium text-gray-300">(Opsional)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-[18px] cursor-pointer hover:border-[#817BB9]/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                  {facePreview ? (
                    <img src={facePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#817BB9] transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-xs font-bold truncate">
                    {faceFile ? faceFile.name : 'Ambil Selfie'}
                  </p>
                  <p className="text-gray-400 text-[10px]">Klik untuk upload foto wajah</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFaceChange}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="group w-full bg-[#817BB9] hover:bg-[#726ba8] text-white font-bold py-3.5 rounded-[14px] shadow-lg shadow-[#817BB9]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-xs font-medium">
              Sudah punya akun? {' '}
              <Link to="/login" className="text-[#817BB9] hover:underline font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
