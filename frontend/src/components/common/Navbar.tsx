import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';
import { NotificationItem } from '../../types';
import {
  Bell,
  Search,
  LogOut,
  Layers,
  Moon,
  Sun,
  Key,
  X,
  Mail,
  Shield
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [trackQuery, setTrackQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 📌 Refs for Click-Outside Detection
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      notificationApi.list().then(setNotifications).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 📌 CLICK OUTSIDE LOGIC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackQuery.trim()) {
      navigate(`/track/${trackQuery.trim().toUpperCase()}`);
      setTrackQuery('');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    for (const n of notifications.filter((n) => !n.is_read)) {
      await notificationApi.markRead(n.id);
    }
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

  const getDisplayName = () => {
    if (user?.client_profile) return user.client_profile.contact_person;
    if (user?.employee_profile) return user.employee_profile.full_name;
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Administrator';
    return user?.email || 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name ? name.substring(0, 2).toUpperCase() : "??";
  };

  // 🔥 REAL PASSWORD CHANGE FUNCTION
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    try {
      setPwdMessage({ type: 'success', text: 'Updating password in database...' });

      const token = localStorage.getItem('workhub_token'); // Matches your AuthContext

      const response = await fetch('http://localhost:8000/api/v1/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to change password");
      }

      // Success
      setPwdMessage({ type: 'success', text: 'Password updated successfully in database!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdMessage({ type: '', text: '' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);

    } catch (error: any) {
      setPwdMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Brand */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 group-hover:bg-indigo-700 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">WorkHub</span>
                <span className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                  Enterprise
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleTrackSubmit} className="w-full relative group">
                <input
                  type="text"
                  placeholder="Search or track ticket by ID (e.g. WH-2026-0001)..."
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800 border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 group-focus-within:text-indigo-500 transition-colors" />
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">

              {/* Notifications */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
                  )}
                </button>

                <div className={`absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 origin-top-right transition-all duration-200 ease-out ${showNotifs ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-xs text-slate-400 text-center font-medium">You're all caught up!</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`p-3.5 text-xs hover:bg-slate-50/80 dark:hover:bg-slate-700 cursor-pointer ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative flex items-center pl-3 ml-2 border-l border-slate-200 dark:border-slate-700" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="hidden sm:flex w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white dark:ring-slate-900">
                    {getInitials()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{getDisplayName()}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      {role?.replace('_', ' ')}
                    </span>
                  </div>
                </button>

                <div className={`absolute top-14 right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 origin-top-right transition-all duration-200 ease-out ${showProfileMenu ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>

                  <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {getInitials()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{getDisplayName()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center mt-0.5">
                        <Mail className="w-3 h-3 mr-1" /> {user?.email}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide flex items-center mt-1">
                        <Shield className="w-3 h-3 mr-1" /> {role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Key className="w-4 h-4 mr-3 text-slate-400" /> Change Password
                    </button>

                    <div className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex items-center">
                        {isDarkMode ? <Moon className="w-4 h-4 mr-3 text-slate-400" /> : <Sun className="w-4 h-4 mr-3 text-slate-400" />}
                        Dark Mode
                      </span>
                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'left-5.5 translate-x-full' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                    <button
                      onClick={logout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Sign Out
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              {pwdMessage.text && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${pwdMessage.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                  {pwdMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};