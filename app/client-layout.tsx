'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Toaster } from "react-hot-toast";
import AdminChatbot from '@/components/AdminChatbot';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1">{children}</main>


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
