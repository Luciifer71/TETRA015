import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function AdminSetupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/setup-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      setSuccess(`Admin account created: ${data.email}`);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1c1c22] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
        <div>
          <h2 className="text-center text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Admin Setup
          </h2>
          <p className="mt-2 text-center text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Create the primary administrator account
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSetupAdmin}>
          {error && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{success}</p>
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-xs font-extrabold text-slate-900 dark:text-zinc-200 mb-1.5">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-950 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-extrabold text-slate-900 dark:text-zinc-200 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-950 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-extrabold text-slate-900 dark:text-zinc-200 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-950 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-[#2E2E2D] hover:bg-[#4B4C51] dark:bg-[#8D9797] dark:hover:bg-[#a1acac] dark:text-[#000000] shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Admin...' : 'Create Admin Account'}
          </button>

          <div className="text-center pt-2">
            <a
              href="/login"
              className="text-xs font-extrabold text-slate-900 dark:text-amber-400 hover:underline"
            >
              Back to Sign In →
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
