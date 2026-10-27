'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PanelLeftOpen } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/components/LanguageProvider';

type TopBarProps = {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
};

export default function TopBar({ sidebarOpen, onOpenSidebar }: TopBarProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

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

    toast.success(t('Logged out successfully!', 'ออกจากระบบเรียบร้อยแล้ว'));

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
            aria-label={t('Show sidebar', 'แสดงแถบด้านข้าง')}
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <span className="font-semibold text-sm text-gray-700">UTO Admin</span>
      </div>

      {!username ? (
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/login"
            className="btn-secondary px-4 py-1.5"
          >
            {t('Sign in', 'เข้าสู่ระบบ')}
          </Link>
          <Link
            href="/register"
            className="btn-primary px-4 py-1.5"
          >
            {t('Register', 'ลงทะเบียน')}
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <NotificationBell />
          {level && (
            <span className="badge hidden sm:inline-flex bg-sky-100 text-sky-700 capitalize">
              {level === 'admin' ? t('Admin', 'ผู้ดูแลระบบ') : level === 'staff' ? t('Staff', 'พนักงาน') : level}
            </span>
          )}
          <Link
            href="/choose-role"
            className="text-sm font-medium text-gray-700 hover:text-sky-700 transition"
          >
            {t('Switch role', 'เปลี่ยนบทบาท')}
          </Link>
          <button
            onClick={handleLogout}
            className="btn-danger px-4 py-1.5"
          >
            {t('Logout', 'ออกจากระบบ')}
          </button>
        </div>
      )}
    </div>
  );
}
