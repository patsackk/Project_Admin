'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

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

      if (response.ok) {
        setMessage('Registration successful!');
        setFormData({
              name: '',
              email: '',
              phone: '',
              address: '',
            });
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/login');
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Register Your Details
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Tell <span className="font-semibold">UTO Advance</span> about yourself and our team will be in touch
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 rounded-lg px-4 py-3 text-sm border
            ${
              message.includes('successful')
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

        </div>
        {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your address"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-gradient-to-r from-sky-600 to-sky-800 py-3 text-white text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-60"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>

          <button
            type="button"
            onClick={handleBackToHome}
            className="w-full rounded-full border border-sky-600 py-3 text-sky-700 text-sm font-medium hover:bg-sky-50 transition"
          >
            Back to Login
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
