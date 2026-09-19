'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PanelLeftOpen } from 'lucide-react';

type TopBarProps = {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
};

export default function TopBar({ sidebarOpen, onOpenSidebar }: TopBarProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const syncAuth = () => {
      setUsername(localStorage.getItem('username'));
    };

    const syncLevel = async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        const data = await res.json();
        setLevel(data.session?.level ?? null);
      } catch {
        setLevel(null);
      }
    };

    syncAuth();
    syncLevel();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('storage', syncLevel);
    window.addEventListener('focus', syncAuth);
    window.addEventListener('focus', syncLevel);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('storage', syncLevel);
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('focus', syncLevel);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });

    localStorage.removeItem('username');
    setLevel(null);

    window.dispatchEvent(new Event('storage'));

    toast.success('Logged out successfully!');

    router.push('/login');
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border-b px-4 py-2.5">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-100 transition"
            aria-label="Show sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <span className="font-semibold text-sm text-gray-700">UTO Admin</span>
      </div>

      {!username ? (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-full border border-sky-600 bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
          >
            Register
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {level && (
            <span className="hidden sm:inline px-3 py-1 rounded-full bg-sky-100 text-xs font-semibold text-sky-700 capitalize">
              {level}
            </span>
          )}
          <Link
            href="/choose-role"
            className="text-sm font-medium text-gray-700 hover:text-sky-700 transition"
          >
            Switch role
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-full border border-red-600 bg-red-600 text-white text-sm hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
