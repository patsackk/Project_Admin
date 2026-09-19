'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // To handle redirection after login

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // To handle loading state
  const router = useRouter(); // To handle redirection after successful login

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Reset error before making the request
    setSuccess(''); // Reset success message
    setLoading(true); // Start loading

    // Basic client-side validation
    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    // Optional: validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful!');
        setError('');

        localStorage.setItem('username', data.user.name);

        // 👇 FORCE HEADER TO RE-RENDER
        window.dispatchEvent(new Event('storage'));

        router.push('/choose-role');
        router.refresh();
      } else {
        setError(data.message || 'Login failed, please try again.');
        setSuccess('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false); // Stop loading once the request is done
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Sign in to continue to <span className="font-semibold">UTO Advance</span>
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-sky-600 to-sky-800 py-3 text-white text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} UTO Advance
      </p>
    </div>
  </div>
);

}
