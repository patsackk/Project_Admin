'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose } from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Stock', href: '/stock' },
  { label: 'Client', href: '/clients' },
  { label: 'History', href: '/history' },
  { label: 'Messages', href: '/messages' },
  { label: 'Status', href: '/status' },
  { label: 'Permissions', href: '/permissions' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap outside */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col
          bg-gradient-to-b from-white via-sky-50 to-sky-100 shadow-lg
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo + collapse button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sky-100">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/images/logo_noname.png" alt="logo" className="h-9 w-9 object-contain shrink-0" />
            <span className="font-bold text-sm text-gray-800 truncate">
              UTO Admin
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-200/60 transition"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'text-gray-700 hover:bg-sky-100 hover:text-sky-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
