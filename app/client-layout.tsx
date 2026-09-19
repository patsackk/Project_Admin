'use client';

import { useEffect, useState } from 'react';
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

  // Default the sidebar to closed on phones/small tablets so it doesn't
  // cover the page on first load; desktop keeps it open.
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <TopBar sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1">{children}</main>
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
