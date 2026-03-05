import React, { useState } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Mail, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Login() {
  const [method, setMethod] = useState<'password' | 'sms'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: input phone/email, 2: input passcode (for SMS)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authService.loginWithPassword(username, password);
      if (data.resultCode === 0) {
        login(data.key);
      } else {
        setError(data.resultCodeMessage || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.resultCodeMessage || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authService.sendPasscode(username);
      if (data.resultCode === 0) {
        setStep(2);
      } else {
        setError(data.resultCodeMessage || 'Failed to send passcode');
      }
    } catch (err: any) {
      setError(err.response?.data?.resultCodeMessage || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authService.loginWithPasscode(username, passcode);
      if (data.resultCode === 0) {
        login(data.key);
      } else {
        setError(data.resultCodeMessage || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.resultCodeMessage || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white text-3xl font-bold italic">CD</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Care Daily</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <div className="flex p-1 bg-slate-800 rounded-lg">
          <button
            onClick={() => { setMethod('password'); setStep(1); setError(null); }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              method === 'password' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Password
          </button>
          <button
            onClick={() => { setMethod('sms'); setStep(1); setError(null); }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              method === 'sms' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            SMS Code
          </button>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        {method === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={step === 1 ? handleSendPasscode : handleSmsLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  required
                  disabled={step === 2}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            {step === 2 && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium text-slate-300">SMS Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 1 ? (
                <>Send Code <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Verify & Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-slate-400 hover:text-slate-200 py-2 transition-all"
              >
                Change Phone Number
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
