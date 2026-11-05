'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import Tooltip from '@/components/Tooltip';
import type { Translate } from '@/lib/i18n';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Ordered by how often each page is used: daily work first, settings last.
const menuGroups = (t: Translate) => [
  {
    title: t('Daily work', 'งานประจำวัน'),
    items: [
      { label: t('Home', 'หน้าหลัก'), href: '/' },
      { label: t('Schedule', 'ตารางงาน'), href: '/schedule' },
      { label: t('Status Updates', 'อัปเดตสถานะงาน'), href: '/status' },
      { label: t('Messages', 'ข้อความ'), href: '/messages' },
      { label: t('Clients', 'ลูกค้า'), href: '/clients' },
    ],
  },
  {
    title: t('Business', 'ธุรกิจ'),
    items: [
      { label: t('Quotations & Invoices', 'ใบเสนอราคา/ใบแจ้งหนี้'), href: '/documents' },
      { label: t('Stock', 'คลังวัสดุ'), href: '/stock' },
    ],
  },
  {
    title: t('Records & settings', 'ประวัติและการตั้งค่า'),
    items: [
      { label: t('History', 'ประวัติ'), href: '/history' },
      { label: t('Website Content', 'เนื้อหาเว็บไซต์'), href: '/content' },
      { label: t('Permissions', 'สิทธิ์การใช้งาน'), href: '/permissions' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

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
          <Tooltip label={t('Hide sidebar', 'ซ่อนแถบด้านข้าง')} side="bottom">
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-200/60 transition"
              aria-label={t('Hide sidebar', 'ซ่อนแถบด้านข้าง')}
            >
              <PanelLeftClose size={18} />
            </button>
          </Tooltip>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {menuGroups(t).map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
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
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
