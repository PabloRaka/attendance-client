import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const data: any = await api.auth.login(formData);
      login(data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#A7A1D1] p-4 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 sm:p-10">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-[#F5F3FF] rounded-2xl">
              <span className="text-2xl font-black text-[#817BB9]">A</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-1">
              Attandence <span className="text-[#817BB9]">IBIK</span>
            </h1>
            <p className="text-gray-400 font-bold text-[11px] tracking-widest uppercase">
              Sistem Informasi Attendance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-xs animate-in slide-in-from-top-2 duration-300">
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#817BB9] transition-colors">
                  <User className="w-4 h-4" />
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

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="group w-full bg-[#817BB9] hover:bg-[#726ba8] text-white font-bold py-3.5 rounded-[14px] shadow-lg shadow-[#817BB9]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-xs font-medium">
              Belum punya akun? {' '}
              <Link to="/register" className="text-[#817BB9] hover:underline font-bold transition-colors">
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
