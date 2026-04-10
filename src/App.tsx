import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[#817BB9]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#817BB9] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/" />;
  
  return <>{children}</>;
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => window.innerWidth >= 1024);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex overflow-x-hidden">
      {/* Sidebar - Controlled visibility */}
      <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
      
      {/* Floating Toggle Button (Visible when sidebar is hidden) */}
      {!isSidebarOpen && (
        <div className="hidden lg:block fixed top-6 left-6 z-[160] animate-in fade-in slide-in-from-left-4 duration-500">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-4 bg-white rounded-[20px] shadow-xl shadow-slate-200 border border-slate-100 text-[#817BB9] hover:scale-110 transition-transform"
             title="Show Sidebar"
           >
             <Menu className="w-6 h-6" />
           </button>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-[padding] duration-500 will-change-[padding-left] ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-0'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <main className="flex-grow container mx-auto px-4 md:px-8 py-10 max-w-7xl">
          {children}
        </main>
        
        <footer className="py-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-t border-slate-100 mx-8">
          <p>&copy; 2026 Attendance IBIK System. Professional Performance.</p>
        </footer>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* Auth Routes (Full-screen) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* App Routes (With Navbar and Container) */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout><Dashboard /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <MainLayout><History /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout><Profile /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <MainLayout><Admin /></MainLayout>
        </ProtectedRoute>
      } />

      {/* Redirect all unknown to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
