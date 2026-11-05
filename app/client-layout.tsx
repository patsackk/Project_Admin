'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Toaster } from "react-hot-toast";
import AdminChatbot from '@/components/AdminChatbot';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Default the sidebar to closed on phones/small tablets so it doesn't
  // cover the page on first load; desktop keeps it open.
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Printable documents (quotations, invoices) are the whole page: no
  // sidebar, top bar or assistant to get onto the paper. Shared links are
  // opened by clients, who must not see the admin chrome either.
  if (pathname.endsWith('/print') || pathname.startsWith('/share/')) return <>{children}</>;

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <TopBar sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        {/* Bottom padding keeps the end of every page clear of the floating
            assistant button. */}
        <main className="flex-1 pb-24">{children}</main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          className: "toast-slide",
        }}
      />

      <AdminChatbot />
    </>
  );
}
