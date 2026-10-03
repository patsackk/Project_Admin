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
  <div className="flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md card p-8">

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Register Your Details
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Tell <span className="font-semibold">UTO Advance</span> about yourself and our team will be in touch
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div>
          <label className="label">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="input py-3"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label">
            Email
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
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              className="input py-3"
            />
          </div>

          {/* Address */}
          <div>
            <label className="label">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your address"
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
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>

          <button
            type="button"
            onClick={handleBackToHome}
            className="btn-secondary w-full py-3"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  </div>
);

}
