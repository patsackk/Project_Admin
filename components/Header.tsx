'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from "react-hot-toast";


type HeaderProps = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
};

export default function Header({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: HeaderProps) {
  const [username, setUsername] = useState<string | null>(null);

  //  sync login / logout real-time
  useEffect(() => {
    const syncAuth = () => {
      setUsername(localStorage.getItem('username'));
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');

  window.dispatchEvent(new Event('storage'));

  setIsMobileMenuOpen(false);

  toast.success("Logged out successfully!");
};



  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Stock', href: '/stock' },
    { label: 'Client', href: '/clients' },
    { label: 'History', href: '/history' },
    { label: 'Messages', href: '/messages' },
  ];

  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 
                   bg-gradient-to-r from-white via-sky-100 to-sky-900
                   shadow-md">



        <div className="flex items-center justify-between px-6 py-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/images/logo_noname.png
            " alt="logo" className="h-13 w-9" />
            <span className="font-bold text-lg text-gray-800">
              UTO Advance Engineering
            </span>
          </div>

          {/* ===== DESKTOP MENU ===== */}
          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-sky-700 transition"
              >
                {item.label}
              </Link>
            ))}

            {!username ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Sign in
                </Link>

                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full border border-sky-600 bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full border border-red-600 bg-red-600 text-white text-sm hover:bg-red-700 transition"
              >
                Logout
              </button>
            )}
          </nav>

          {/* ===== HAMBURGER ===== */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center 
                      rounded-full hover:bg-slate-300 transition"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <span className="text-2xl font-light">✕</span>
            ) : (
              <span className="text-3xl font-light">☰</span>
            )}
          </button>
        </div>
      </header>

     
      {/* ===== MOBILE MENU ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 w-full 
                        bg-white border-b shadow-md 
                        px-4 py-4 space-y-3 z-40">

    
    {/* Menu links */}
    {menuItems.map((item) => (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className="block text-base font-medium text-gray-800 text-center py-1.5 rounded-lg hover:bg-sky-50 hover:text-sky-700 transition"
      >
        {item.label}
      </Link>
    ))}

    {/* Divider */}
    <div className="h-px bg-gray-200" />

    {/* Auth buttons */}
    {!username ? (
      <div className="flex flex-col gap-2">
        <Link
          href="/login"
          onClick={() => setIsMobileMenuOpen(false)}
          className="py-2 text-center rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
        >
          Sign in
        </Link>

        <Link
          href="/register"
          onClick={() => setIsMobileMenuOpen(false)}
          className="py-2 text-center rounded-full bg-sky-600 text-sm text-white hover:bg-sky-700 transition"
        >
          Sign up
        </Link>
      </div>
    ) : (
      <button
        onClick={handleLogout}
        className="w-full py-2 rounded-full bg-red-600 text-sm text-white hover:bg-red-700 transition"
      >
        Logout
      </button>
    )}
  </div>
)}


        </>
      );
    }
