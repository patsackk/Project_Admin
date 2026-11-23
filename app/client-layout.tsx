'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Toaster } from "react-hot-toast";
import AdminChatbot from '@/components/AdminChatbot';

// null = not toggled yet: CSS decides (docked on PC, hidden on phone/iPad),
// so the first paint is right at every width with no flash of an open menu.
export type SidebarState = boolean | null;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>(null);
  const pathname = usePathname();

  // Printable documents (quotations, invoices) are the whole page: no
  // sidebar, top bar or assistant to get onto the paper. Shared links are
  // opened by clients, who must not see the admin chrome either.
  if (pathname.endsWith('/print') || pathname.startsWith('/share/')) return <>{children}</>;

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-in-out ${
          sidebarOpen === false ? 'lg:ml-0' : 'lg:ml-64'
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
