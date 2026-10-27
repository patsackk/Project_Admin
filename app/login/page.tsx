'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // To handle redirection after login
import { useLanguage } from '@/components/LanguageProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // To handle loading state
  const router = useRouter(); // To handle redirection after successful login
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Reset error before making the request
    setSuccess(''); // Reset success message
    setLoading(true); // Start loading

    // Basic client-side validation
    if (!email || !password) {
      setError(t('Email and password are required.', 'กรุณากรอกอีเมลและรหัสผ่าน'));
      setLoading(false);
      return;
    }

    // Optional: validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError(t('Please enter a valid email.', 'กรุณากรอกอีเมลให้ถูกต้อง'));
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
        setSuccess(t('Login successful!', 'เข้าสู่ระบบสำเร็จ!'));
        setError('');

        localStorage.setItem('username', data.user.name);

        // 👇 FORCE HEADER TO RE-RENDER
        window.dispatchEvent(new Event('storage'));

        router.push('/choose-role');
        router.refresh();
      } else {
        setError(data.message || t('Login failed, please try again.', 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'));
        setSuccess('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('An unexpected error occurred. Please try again.', 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setLoading(false); // Stop loading once the request is done
    }
  };

  return (
  <div className="flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md card p-8">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('Welcome Back', 'ยินดีต้อนรับกลับ')}</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {t('Sign in to continue to ', 'เข้าสู่ระบบเพื่อใช้งาน ')}<span className="font-semibold">UTO Advance</span>
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="alert-success mb-4">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            {t('Email', 'อีเมล')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input py-3"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            {t('Password', 'รหัสผ่าน')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="input py-3"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? t('Logging in...', 'กำลังเข้าสู่ระบบ...') : t('Login', 'เข้าสู่ระบบ')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

}
