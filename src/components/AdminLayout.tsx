import React from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  BarChart3, 
  Users, 
  FileText, 
  History, 
  Settings, 
  ShieldAlert,
  LayoutDashboard,
  ChevronRight,
  LogOut,
  Home
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user } = useVault();

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <ShieldAlert size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">You do not have administrative privileges to access this area.</p>
          <NavLink to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            <Home size={20} />
            Back to Dashboard
          </NavLink>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
    { icon: <FileText size={20} />, label: 'Exams', path: '/admin/exams' },
    { icon: <History size={20} />, label: 'Attempts', path: '/admin/attempts' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="admin-layout min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-column border-r border-slate-800">
        <div className="p-8">
          <div className="flex items-center gap-3 text-white mb-10">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <span className="text-xl font-black tracking-tight">ADMIN PANEL</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {window.location.pathname.includes(item.path) && <ChevronRight size={16} className="ml-auto opacity-50" />}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <div className="flex items-center gap-4 mb-6 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <NavLink to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors font-semibold">
            <LogOut size={20} />
            <span>Exit Admin</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      <style>{`
        .admin-layout { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
