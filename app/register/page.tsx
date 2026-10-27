'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
  name: '',
  email: '',
  phone: '',
  address: '',
});

  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { t } = useLanguage();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      setIsSuccess(response.ok);
      if (response.ok) {
        setMessage(t('Registration successful!', 'ลงทะเบียนสำเร็จ!'));
        setFormData({
              name: '',
              email: '',
              phone: '',
              address: '',
            });
      } else {
        setMessage(data.message || t('Registration failed.', 'ลงทะเบียนไม่สำเร็จ'));
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setIsSuccess(false);
      setMessage(t('An unexpected error occurred.', 'เกิดข้อผิดพลาดที่ไม่คาดคิด'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/login');
  };

  return (
  <div className="flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md card p-8">

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('Register Your Details', 'ลงทะเบียนข้อมูลของคุณ')}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          {t(
            <>Tell <span className="font-semibold">UTO Advance</span> about yourself and our team will be in touch</>,
            <>แจ้งข้อมูลของคุณให้ <span className="font-semibold">UTO Advance</span> ทราบ แล้วทีมงานจะติดต่อกลับ</>
          )}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 ${isSuccess ? 'alert-success' : 'alert-error'}`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div>
          <label className="label">
            {t('Full Name', 'ชื่อ-นามสกุล')}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('Your name', 'ชื่อของคุณ')}
            required
            className="input py-3"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label">
            {t('Email', 'อีเมล')}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="input py-3"
          />

        </div>
        {/* Phone */}
          <div>
            <label className="label">
              {t('Phone', 'เบอร์โทรศัพท์')}
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('Your phone number', 'เบอร์โทรศัพท์ของคุณ')}
              className="input py-3"
            />
          </div>

          {/* Address */}
          <div>
            <label className="label">
              {t('Address', 'ที่อยู่')}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('Your address', 'ที่อยู่ของคุณ')}
              className="input py-3"
            />
          </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? t('Submitting...', 'กำลังส่ง...') : t('Submit', 'ส่งข้อมูล')}
          </button>

          <button
            type="button"
            onClick={handleBackToHome}
            className="btn-secondary w-full py-3"
          >
            {t('Back to Login', 'กลับไปหน้าเข้าสู่ระบบ')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

}
