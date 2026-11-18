import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layers, Loader2, ShieldCheck, Briefcase, User, Mail, Lock } from 'lucide-react';

type LoginRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<LoginRole>('EMPLOYEE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-xl shadow-indigo-300/50 mb-4 transform transition-transform hover:scale-105 duration-300">
            <Layers className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">WorkHub</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Enterprise Work Management & IT Service Desk
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-white/50">

          {/* Role Selection Tabs */}
          <div className="flex space-x-1 mb-8 bg-slate-100/80 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setRole('EMPLOYEE'); setError(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${role === 'EMPLOYEE' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Employee</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('ADMIN'); setError(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${role === 'ADMIN' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('CLIENT'); setError(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${role === 'CLIENT' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <User className="w-4 h-4" />
              <span>Client</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                {role === 'CLIENT' ? 'Client Email' : 'Corporate Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 text-sm text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 text-sm text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Sign In to WorkHub</span>
              )}
            </button>
          </form>

          {role === 'CLIENT' && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
              New Client Organization?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                Register Account
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          &copy; 2026 WorkHub Enterprise. All rights reserved.
        </p>
      </div>
    </div>
  );
};